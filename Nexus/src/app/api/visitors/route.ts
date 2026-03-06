import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Authenticate Request
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { firstName, lastName, phone, validFrom, validUntil, needsParking } = body;

        if (!firstName || !lastName || !phone || !validFrom || !validUntil) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 2. Get User's Unit ID
        const { data: profile, error: profErr } = await supabase
            .from("profiles")
            .select("unit_id")
            .eq("id", user.id)
            .single();

        if (profErr || !profile?.unit_id) {
            return NextResponse.json({ error: "Could not determine unit association." }, { status: 400 });
        }

        // 3. Inheritance Logic: Fetch allowed access groups for this Unit
        // In a real database, unit_access_groups would map unit_id to access_group_id
        // For fallback/mock purposes, we assume [1] = Main Gate, [2] = General Lift
        let allowedGroups = [1, 2];

        const { data: unitMapping, error: mapErr } = await supabase
            .from("unit_access_groups")
            .select("access_group_id")
            .eq("unit_id", profile.unit_id);

        if (!mapErr && unitMapping && unitMapping.length > 0) {
            allowedGroups = unitMapping.map(m => m.access_group_id);
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
            status: 'active'
        };

        const { error: insertErr } = await supabase
            .from("visitors")
            .insert([visitorPayload]);

        if (insertErr) {
            console.error("Supabase Insert Error:", insertErr);
            return NextResponse.json({ error: "Database failed to save visitor." }, { status: 500 });
        }

        // 6. Push to C# Hardware Bridge 
        const bridgeUrl = process.env.IMPRO_BRIDGE_URL;
        const bridgeSecret = process.env.SUPABASE_SHARED_SECRET || "default_dev_secret";

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

                if (!bridgeRes.ok) {
                    console.warn("C# Bridge rejected the payload. Local hardware may be out of sync. Response:", await bridgeRes.text());
                }
            } catch (networkErr) {
                console.error("Cannot reach C# Bridge. Offline?", networkErr);
                // In production, we'd queue this into a Supabase table for background retry
            }
        } else {
            console.log("IMPRO_BRIDGE_URL environment variable not set. Bypassing hardware sync.");
        }

        return NextResponse.json({ success: true, message: "Visitor invited & groups inherited.", pinCode: generatedPin });

    } catch (err: unknown) {
        console.error("API Route Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
