import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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
            .select("role")
            .eq("id", user.id)
            .single();

        // Only SuperAdmin and Guard can pulse the gate
        const allowedRoles = ["SuperAdmin", "Guard"];
        if (!profile || !allowedRoles.includes(profile.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { door, action } = body;

        const bridgeUrl = process.env.BRIDGE_URL || "http://localhost:5000";

        const res = await fetch(`${bridgeUrl}/api/opendoor`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ door: door || 1, action: action || "pulse" }),
            signal: AbortSignal.timeout(5000), // 5s timeout for local hardware interaction
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Hardware Bridge Error:", errorText);
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
