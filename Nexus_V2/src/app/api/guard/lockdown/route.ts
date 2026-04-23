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

        const { data: profile } = await supabase
            .from("profiles")
            .select("role, first_name, last_name")
            .eq("id", user.id)
            .single();

        const allowedRoles = ["SuperAdmin", "Guard"];
        if (!profile || !allowedRoles.includes(profile.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json().catch(() => ({}));
        const { action = "lock" } = body;

        const portalHost = process.env.PORTAL_HOST || "127.0.0.1";
        const portalUser = process.env.PORTAL_USER || "sysdba";
        const portalPass = process.env.PORTAL_PASS || "masterkey";
        const fixedAddr = process.env.PORTAL_MAIN_GATE_ADDR || "C1:D1:B2:M0:T0:R0";

        try {
            await portalLogin({ host: portalHost, username: portalUser, password: portalPass });
            // Send LOCK or NORMAL command depending on action
            await portalSendCommand(action === "unlock" ? 'NORMAL' : 'LOCK', fixedAddr, '1');
        } catch (err) {
            console.error("Hardware Bridge Lockdown Error:", err);
            return NextResponse.json({ error: "Hardware bridge failed to execute lockdown" }, { status: 502 });
        }

        // Write audit log for the lockdown event
        const actorName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || user.email;
        await supabase.from("audit_logs").insert({
            event_type: "LOCKDOWN_ACTIVATED",
            actor_id: user.id,
            actor_name: actorName,
            details: `Site lockdown ${action === "unlock" ? "DEACTIVATED" : "ACTIVATED"} via Guard Dashboard by ${actorName}`,
        });

        return NextResponse.json({
            success: true,
            message: action === "unlock" ? "Lockdown lifted." : "Site lockdown activated.",
        });
    } catch (error) {
        console.error("API Lockdown Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
