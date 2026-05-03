import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * Owner QR Code API
 * Returns the authenticated user's unit QR code.
 */
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile to find their unit
    const { data: profile } = await supabase
        .from("profiles")
        .select("unit_id, first_name, last_name, role")
        .eq("id", user.id)
        .single();

    if (!profile || !profile.unit_id) {
        return NextResponse.json({ error: "No unit assigned to your account" }, { status: 404 });
    }

    // Fetch unit details + QR code + access groups
    const { data: unit, error: unitErr } = await supabase
        .from("units")
        .select(`
            id, name, type, floor,
            qr_codes ( id, qr_value, status, created_at, updated_at ),
            unit_access_mapping ( access_group_id, access_groups ( id, name ) )
        `)
        .eq("id", profile.unit_id)
        .single();

    if (unitErr || !unit) {
        return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qr = Array.isArray((unit as any).qr_codes) ? (unit as any).qr_codes[0] || null : (unit as any).qr_codes || null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessGroups = ((unit as any).unit_access_mapping || []).map((m: any) => m.access_groups).filter(Boolean);

    return NextResponse.json({
        unit: {
            id: unit.id,
            name: unit.name,
            type: unit.type,
            floor: unit.floor,
        },
        qr_code: qr,
        access_groups: accessGroups,
        owner: {
            first_name: profile.first_name,
            last_name: profile.last_name,
        },
    });
}
