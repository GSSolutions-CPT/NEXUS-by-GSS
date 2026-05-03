import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * Owner QR Access Logs API
 * GET — Returns the authenticated owner's unit QR scan activity
 */
export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("unit_id, role")
        .eq("id", user.id)
        .single();

    if (!profile || !profile.unit_id) {
        return NextResponse.json({ error: "No unit assigned" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const offset = (page - 1) * limit;

    const { data: logs, count, error: queryErr } = await supabase
        .from("qr_access_logs")
        .select(`
            id, access_point, event_type, scanned_at, metadata
        `, { count: "exact" })
        .eq("unit_id", profile.unit_id)
        .order("scanned_at", { ascending: false })
        .range(offset, offset + limit - 1);

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
