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

        const allowedRoles = ["SuperAdmin", "Guard"];
        if (!userRole || !allowedRoles.includes(userRole)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Note: We still fetch first_name and last_name for the audit log actor name.
        const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", user.id)
            .single();

        const body = await request.json().catch(() => ({}));
        const { action = "lock" } = body;

        const bridgeUrl = process.env.BRIDGE_URL || "http://localhost:5000";
        const secret = process.env.BRIDGE_SHARED_SECRET;

        if (!secret) {
            console.error("CRITICAL: BRIDGE_SHARED_SECRET is not configured.");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const endpoint = "lockdown"; // HMAC covers the endpoint name
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const message = `${timestamp}:${endpoint}`;
        const signature = createHmac("sha256", secret).update(message).digest("hex");

        // Send lockdown command to the C# Hardware Bridge
        const res = await fetch(`${bridgeUrl}/api/lockdown`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-Bridge-Timestamp": timestamp,
                "X-Bridge-Signature": signature,
            },
            body: JSON.stringify({ action }),
            signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Hardware Bridge Lockdown Error:", errorText);
            return NextResponse.json({ error: "Hardware bridge failed to execute lockdown" }, { status: 502 });
        }

        // Write audit log for the lockdown event
        const actorName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || user.email;
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
