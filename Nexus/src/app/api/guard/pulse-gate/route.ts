import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createHmac } from "crypto";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        
        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Optimization: Use JWT claims instead of querying the 'profiles' table for role (saves ~20-50ms)
        const userRole = user.app_metadata?.user_role;

        // Only SuperAdmin and Guard can pulse the gate
        const allowedRoles = ["SuperAdmin", "Guard"];
        if (!userRole || !allowedRoles.includes(userRole)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch user names for audit logging
        const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", user.id)
            .single();

        const body = await request.json();
        const { door, action } = body;

        const bridgeUrl = process.env.BRIDGE_URL || "http://localhost:5000";
        const secret = process.env.BRIDGE_SHARED_SECRET;

        if (!secret) {
            console.error("CRITICAL: BRIDGE_SHARED_SECRET is not configured.");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const endpoint = "opendoor"; // The remote endpoint is actually opendoor
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const message = `${timestamp}:${endpoint}`;
        const signature = createHmac("sha256", secret).update(message).digest("hex");

        const res = await fetch(`${bridgeUrl}/api/opendoor`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-Bridge-Timestamp": timestamp,
                "X-Bridge-Signature": signature,
            },
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
            actor_name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || user.email,
            details: `Manual gate pulse triggered via Guard Dashboard (Door: ${door || 1})`,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("API Gate Pulse Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
