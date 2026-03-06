import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Authenticate Request
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
            console.warn("Unauthorized API access attempt");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { firstName, lastName, phone, validFrom, validUntil, needsParking } = body;

        if (!firstName || !lastName || !phone || !validFrom || !validUntil) {
            console.warn(`[${user.id}] Missing required fields in visitor invitation.`);
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 2. Get User's Unit ID
        const { data: profile, error: profErr } = await supabase
            .from("profiles")
            .select("unit_id")
            .eq("id", user.id)
            .single();

        if (profErr || !profile?.unit_id) {
            console.error(`[${user.id}] Error fetching user profile or unit.`, profErr);
            return NextResponse.json({ error: "Could not determine unit association." }, { status: 400 });
        }

        // 3. Inheritance Logic: Fetch allowed access groups for this Unit
        let allowedGroups = [1, 2]; // Default fallbacks
        try {
            const { data: unitMapping, error: mapErr } = await supabase
                .from("unit_access_groups")
                .select("access_group_id")
                .eq("unit_id", profile.unit_id);

            if (mapErr) throw mapErr;

            if (unitMapping && unitMapping.length > 0) {
                allowedGroups = unitMapping.map(m => m.access_group_id);
            }
        } catch (err) {
            console.error(`[${user.id}] Failed to fetch unit mapping. Using fallbacks.`, err);
        }

        // 4. Generate Hardware PIN
        const generatedPin = Math.floor(10000 + Math.random() * 90000).toString();

        // 5. Insert into Supabase
        const visitorPayload = {
            unit_id: profile.unit_id,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            pin_code: generatedPin,
            valid_from: new Date(validFrom).toISOString(),
            valid_until: new Date(validUntil).toISOString(),
            needs_parking: needsParking,
            status: 'active' // We will update this to 'sync_failed' if the bridge drops it
        };

        const { data: insertedVisitor, error: insertErr } = await supabase
            .from("visitors")
            .insert([visitorPayload])
            .select("id")
            .single();

        if (insertErr || !insertedVisitor) {
            console.error(`[${user.id}] Supabase Insert Error for visitor ${firstName} ${lastName}:`, insertErr);
            return NextResponse.json({ error: "Database failed to save visitor." }, { status: 500 });
        }

        // 6. Push to C# Hardware Bridge 
        const bridgeUrl = process.env.IMPRO_BRIDGE_URL;
        const bridgeSecret = process.env.SUPABASE_SHARED_SECRET || "default_dev_secret";
        let hardwareSyncSuccess = false;

        if (bridgeUrl) {
            try {
                // Formatting DateTime as YYYYMMDDHHmmss for the Impro XML Requirements (14 chars)
                const expiryDateObj = new Date(validUntil);
                const expiryString = expiryDateObj.toISOString().replace(/[-:T]/g, '').slice(0, 14);

                const bridgePayload = {
                    firstName,
                    lastName,
                    phone,
                    pinCode: generatedPin,
                    expiryDateTime: expiryString,
                    accessGroupIds: allowedGroups
                };

                const bridgeRes = await fetch(`${bridgeUrl}/api/impro/visitor`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': bridgeSecret
                    },
                    body: JSON.stringify(bridgePayload)
                });

                if (bridgeRes.ok) {
                    hardwareSyncSuccess = true;
                } else {
                    const errText = await bridgeRes.text();
                    console.error(`[${user.id}] Bridge rejected payload for ${firstName} ${lastName}. Status ${bridgeRes.status}. Output: ${errText}`);
                }
            } catch (networkErr) {
                console.error(`[${user.id}] Cannot reach C# Bridge for visitor ${firstName} ${lastName}. Is it offline?`, networkErr);
            }

            // Fallback status handler
            if (!hardwareSyncSuccess) {
                await supabase
                    .from("visitors")
                    .update({ status: 'sync_failed' })
                    .eq("id", insertedVisitor.id);
            }

        } else {
            console.log(`[${user.id}] IMPRO_BRIDGE_URL environment variable not set. Bypassing hardware sync.`);
        }

        if (hardwareSyncSuccess || !bridgeUrl) {
            return NextResponse.json({ success: true, message: "Visitor invited & groups inherited.", pinCode: generatedPin });
        } else {
            return NextResponse.json({ success: false, error: "Visitor created in cloud but failed to sync to physical hardware.", pinCode: generatedPin }, { status: 502 });
        }

    } catch (err: unknown) {
        console.error("Critical API Route Error in /api/visitors:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
