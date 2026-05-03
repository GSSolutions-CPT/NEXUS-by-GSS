import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createHmac } from "crypto";

// POST /api/opendoor — signed proxy to the local C# Bridge
// Guards call this endpoint; the secret never leaves the server.
export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Optimization: Use JWT claims instead of querying the 'profiles' table (saves ~20-50ms)
        const userRole = user.app_metadata?.user_role;
        if (userRole !== "Guard" && userRole !== "SuperAdmin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const bridgeUrl = process.env.NEXT_PUBLIC_BRIDGE_URL || "http://localhost:5000";
        const secret = process.env.BRIDGE_SHARED_SECRET;
        if (!secret) {
            console.error("CRITICAL: BRIDGE_SHARED_SECRET is not configured.");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }
        
        const endpoint = "door/open"; // HMAC covers the endpoint name

        const timestamp = Math.floor(Date.now() / 1000).toString();
        const message = `${timestamp}:${endpoint}`;
        const signature = createHmac("sha256", secret).update(message).digest("hex");

        const bridgeRes = await fetch(`${bridgeUrl}/api/impro/door/open`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Bridge-Timestamp": timestamp,
                "X-Bridge-Signature": signature,
            },
            body: JSON.stringify({ relayId: 1 }),
            signal: AbortSignal.timeout(5000),
        });

        if (!bridgeRes.ok) {
            const body = await bridgeRes.text();
            console.error("[Bridge] Door open failed:", bridgeRes.status, body);
            return NextResponse.json({ error: "Bridge command failed" }, { status: 502 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[Bridge] Error calling /api/impro/door/open:", err);
        return NextResponse.json({ error: "Bridge unreachable" }, { status: 503 });
    }
}
