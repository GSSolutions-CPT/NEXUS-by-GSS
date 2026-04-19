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

        const bridgeUrl = process.env.BRIDGE_URL || "http://localhost:5000";
        
        // Timeout the fetch after 3 seconds so the dashboard doesn't hang if ngrok/bridge is down
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch(`${bridgeUrl}/health/impro`, { 
            signal: controller.signal,
            cache: 'no-store' 
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            return NextResponse.json({ status: "offline", last_check_in: null });
        }

        const data = await res.json();
        const isOnline = data.status === "online" || data.status === "connected";
        
        return NextResponse.json({ 
            status: isOnline ? "online" : "offline", 
            last_check_in: data.timestamp 
        });
    } catch (error) {
        console.error("Bridge health error:", error);
        return NextResponse.json({ status: "offline", last_check_in: null });
    }
}
