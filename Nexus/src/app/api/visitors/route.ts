import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';

// GET /api/visitors — Fetch visitors for the logged-in owner's unit
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: profile } = await supabase
            .from("profiles")
            .select("unit_id, role")
            .eq("id", user.id)
            .single();

        if (!profile?.unit_id) {
            return NextResponse.json({ error: "No unit associated with this account." }, { status: 400 });
        }

        const { data: visitors, error: fetchErr } = await supabase
            .from("visitors")
            .select("id, first_name, last_name, phone, start_time, expiry_time, needs_parking, status, pin_code")
            .eq("unit_id", profile.unit_id)
            .order("created_at", { ascending: false });

        if (fetchErr) {
            console.error("Failed to fetch visitors:", fetchErr);
            return NextResponse.json({ error: "Failed to fetch visitors." }, { status: 500 });
        }

        return NextResponse.json({ visitors: visitors || [] });

    } catch (err) {
        console.error("Critical error in GET /api/visitors:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/visitors — Invite a new visitor
export async function POST(request: Request) {
    try {
        const supabase = await createClient();

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

        const { data: profile, error: profErr } = await supabase
            .from("profiles")
            .select("unit_id")
            .eq("id", user.id)
            .single();

        if (profErr || !profile?.unit_id) {
            console.error(`[${user.id}] Error fetching user profile or unit.`, profErr);
            return NextResponse.json({ error: "Could not determine unit association." }, { status: 400 });
        }

        // Validate access groups exist (non-blocking)
        try {
            const { data: unitMapping } = await supabase
                .from("unit_access_mapping")
                .select("access_group_id")
                .eq("unit_id", profile.unit_id);

            if (!unitMapping || unitMapping.length === 0) {
                console.warn(`[${user.id}] No access groups mapped for unit ${profile.unit_id}.`);
            }
        } catch (err) {
            console.error(`[${user.id}] Failed to validate unit mapping.`, err);
        }

        const generatedPin = randomInt(10000, 100000).toString();

        // IMPORTANT: DB schema uses start_time & expiry_time (not valid_from/valid_until)
        const visitorPayload = {
            unit_id: profile.unit_id,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            pin_code: generatedPin,
            start_time: new Date(validFrom).toISOString(),
            expiry_time: new Date(validUntil).toISOString(),
            needs_parking: needsParking,
            status: 'Pending',
        };

        const { error: insertErr } = await supabase
            .from("visitors")
            .insert([visitorPayload]);

        if (insertErr) {
            console.error(`[${user.id}] Supabase Insert Error:`, insertErr);
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

// DELETE /api/visitors?id=xxx — Revoke a visitor pass
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const visitorId = searchParams.get("id");
        if (!visitorId) return NextResponse.json({ error: "Visitor ID required." }, { status: 400 });

        // Ownership check — prevent IDOR attacks
        const { data: profile } = await supabase
            .from("profiles").select("unit_id").eq("id", user.id).single();

        const { data: visitor } = await supabase
            .from("visitors").select("unit_id").eq("id", visitorId).single();

        if (!visitor || visitor.unit_id !== profile?.unit_id) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 });
        }

        const { error: updateErr } = await supabase
            .from("visitors")
            .update({ status: "Revoked" })
            .eq("id", visitorId);

        if (updateErr) {
            return NextResponse.json({ error: "Failed to revoke visitor." }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error("Critical error in DELETE /api/visitors:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
