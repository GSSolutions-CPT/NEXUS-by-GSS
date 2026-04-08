import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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

        const bridgeUrl = process.env.BRIDGE_URL || "http://localhost:5000";

        // Send lockdown command to the C# Hardware Bridge
        const res = await fetch(`${bridgeUrl}/api/lockdown`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
            signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Hardware Bridge Lockdown Error:", errorText);
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
