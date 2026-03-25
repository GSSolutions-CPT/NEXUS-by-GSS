import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/admin/bridge-health — server-side proxy to check Bridge status
// This prevents leaking the internal Bridge IP to the browser.
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "SuperAdmin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const bridgeUrl = process.env.BRIDGE_URL || "http://localhost:5000";

        const res = await fetch(`${bridgeUrl}/health`, {
            signal: AbortSignal.timeout(3000),
        });

        return NextResponse.json({
            status: res.ok ? "online" : "offline",
        });
    } catch {
        return NextResponse.json({ status: "offline" });
    }
}
