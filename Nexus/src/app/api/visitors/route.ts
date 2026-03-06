import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';

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

        // 4. Generate Hardware PIN securely
        const generatedPin = randomInt(10000, 100000).toString();

        // 5. Insert into Supabase - Set status to 'pending_sync' for the C# Bridge to pull
        const visitorPayload = {
            unit_id: profile.unit_id,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            pin_code: generatedPin,
            valid_from: new Date(validFrom).toISOString(),
            valid_until: new Date(validUntil).toISOString(),
            needs_parking: needsParking,
            status: 'pending_sync' // <--- This tells the local hardware worker to pick it up
        };

        const { error: insertErr } = await supabase
            .from("visitors")
            .insert([visitorPayload]);

        if (insertErr) {
            console.error(`[${user.id}] Supabase Insert Error for visitor ${firstName} ${lastName}:`, insertErr);
            return NextResponse.json({ error: "Database failed to save visitor." }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Visitor invited. Awaiting hardware synchronization.",
            pinCode: generatedPin
        });

    } catch (err: unknown) {
        console.error("Critical API Route Error in /api/visitors:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
