import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// GET /api/guest/[id] — Fetch visitor pass with limited PII for public guest page
// This server-side route prevents the client from querying Supabase directly,
// keeping unit_id and other internal fields off the client.
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        // Use the service role key to bypass RLS, because guests viewing passes do not have an authenticated session.
        // We only fetch based on the hard-to-guess UUID.
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Validate the ID is a UUID format to prevent injection
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return NextResponse.json({ error: "Invalid pass ID." }, { status: 400 });
        }

        const { data: visitor, error: visErr } = await supabase
            .from("visitors")
            .select("id, first_name, last_name, pin_code, start_time, expiry_time, needs_parking, status, unit_id, access_windows")
            .eq("id", id)
            .single();

        if (visErr || !visitor) {
            return NextResponse.json({ error: "Pass not found." }, { status: 404 });
        }

        // Resolve unit name server-side so we never expose unit_id to the client
        let unitName: string | null = null;
        if (visitor.unit_id) {
            const { data: unitData } = await supabase
                .from("units")
                .select("name")
                .eq("id", visitor.unit_id)
                .single();
            unitName = unitData?.name || null;
        }

        // Return only what the guest page needs — no unit_id
        return NextResponse.json({
            pass: {
                id: visitor.id,
                first_name: visitor.first_name,
                last_name: visitor.last_name,
                pin_code: visitor.pin_code,
                start_time: visitor.start_time,
                expiry_time: visitor.expiry_time,
                needs_parking: visitor.needs_parking,
                status: visitor.status,
                access_windows: visitor.access_windows,
            },
            unitName,
        });

    } catch (err) {
        console.error("Critical error in GET /api/guest/[id]:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
