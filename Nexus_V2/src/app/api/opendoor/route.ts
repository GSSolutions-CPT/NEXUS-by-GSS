import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { portalLogin, portalSendCommand } from "@/lib/impro/client";

// POST /api/opendoor — signed proxy to the local C# Bridge
// Guards call this endpoint; the secret never leaves the server.
export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile?.role !== "Guard" && profile?.role !== "SuperAdmin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const portalHost = process.env.PORTAL_HOST || "127.0.0.1";
        const portalUser = process.env.PORTAL_USER || "sysdba";
        const portalPass = process.env.PORTAL_PASS || "masterkey";

        // For simplicity, we hardcode the fixedAddr to the main gate relay or read from env
        const fixedAddr = process.env.PORTAL_MAIN_GATE_ADDR || "C1:D1:B2:M0:T0:R0";

        await portalLogin({ host: portalHost, username: portalUser, password: portalPass });
        await portalSendCommand('OPEN_DOOR', fixedAddr, '1');

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[Bridge] Error calling /api/impro/door/open:", err);
        return NextResponse.json({ error: "Bridge unreachable" }, { status: 503 });
    }
}
