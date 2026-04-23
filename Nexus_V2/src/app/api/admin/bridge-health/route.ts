import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { portalGetVersionInfo, portalLogin } from "@/lib/impro/client";

// GET /api/admin/bridge-health — server-side proxy to check Bridge status
// Now uses direct XML API connection to Impro Portal instead of C# Bridge
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const portalHost = process.env.PORTAL_HOST || "127.0.0.1";
        const portalUser = process.env.PORTAL_USER || "sysdba";
        const portalPass = process.env.PORTAL_PASS || "masterkey";

        // Try to authenticate directly to the portal
        try {
            await portalLogin({ host: portalHost, username: portalUser, password: portalPass });
            const versionInfo = await portalGetVersionInfo();
            return NextResponse.json({ 
                status: "online", 
                last_check_in: new Date().toISOString(),
                portal_version: versionInfo?.rawXml ? "Connected" : "Unknown"
            });
        } catch (portalErr) {
            console.error("Portal direct health error:", portalErr);
            return NextResponse.json({ status: "offline", last_check_in: null });
        }
    } catch (error) {
        console.error("Health check wrapper error:", error);
        return NextResponse.json({ status: "offline", last_check_in: null });
    }
}
