import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { portalLogin, portalSendCommand } from "@/lib/impro/client";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        
        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch user role
        const { data: profile } = await supabase
            .from("profiles")
            .select("role, first_name, last_name")
            .eq("id", user.id)
            .single();

        // Only SuperAdmin and Guard can pulse the gate
        const allowedRoles = ["SuperAdmin", "Guard"];
        if (!profile || !allowedRoles.includes(profile.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { door, action } = body;

        const portalHost = process.env.PORTAL_HOST || "127.0.0.1";
        const portalUser = process.env.PORTAL_USER || "sysdba";
        const portalPass = process.env.PORTAL_PASS || "masterkey";

        // For simplicity, we hardcode the fixedAddr to the main gate relay or read from env
        const fixedAddr = process.env.PORTAL_MAIN_GATE_ADDR || "C1:D1:B2:M0:T0:R0";

        try {
            await portalLogin({ host: portalHost, username: portalUser, password: portalPass });
            await portalSendCommand('OPEN_DOOR', fixedAddr, '1');
        } catch (err) {
            console.error("Hardware Bridge Error:", err);
            return NextResponse.json({ error: "Hardware bridge failed to respond" }, { status: 502 });
        }

        // Log the action
        await supabase.from("audit_logs").insert({
            event_type: "Gate Pulse",
            actor_id: user.id,
            actor_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || user.email,
            details: `Manual gate pulse triggered via Guard Dashboard (Door: ${door || 1})`,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("API Gate Pulse Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
