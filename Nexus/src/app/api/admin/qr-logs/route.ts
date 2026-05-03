import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * QR Access Logs API (Admin)
 * GET — View access logs with optional unit_id / date filters
 */

async function assertSuperAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized", status: 401, supabase: null };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "SuperAdmin") {
        return { error: "Forbidden — SuperAdmin only", status: 403, supabase: null };
    }

    return { error: null, status: 200, supabase };
}

export async function GET(req: NextRequest) {
    const { error, status, supabase } = await assertSuperAdmin();
    if (error || !supabase) return NextResponse.json({ error }, { status });

    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get("unit_id");
    const from = searchParams.get("from"); // ISO date
    const to = searchParams.get("to"); // ISO date
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const offset = (page - 1) * limit;

    let query = supabase
        .from("qr_access_logs")
        .select(`
            id, access_point, event_type, scanned_at, metadata,
            units ( id, name, type ),
            qr_codes ( id, qr_value, status )
        `, { count: "exact" })
        .order("scanned_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (unitId) query = query.eq("unit_id", unitId);
    if (from) query = query.gte("scanned_at", from);
    if (to) query = query.lte("scanned_at", to);

    const { data: logs, count, error: queryErr } = await query;

    if (queryErr) {
        return NextResponse.json({ error: queryErr.message }, { status: 500 });
    }

    return NextResponse.json({
        logs: logs || [],
        total: count || 0,
        page,
        limit,
    });
}
