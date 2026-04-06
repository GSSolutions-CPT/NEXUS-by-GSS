import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/admin/bridge-health — server-side proxy to check Bridge status
// This prevents leaking the internal Bridge IP to the browser.
export async function GET() {
    try {
        const bridgeUrl = process.env.BRIDGE_URL || process.env.NEXT_PUBLIC_BRIDGE_URL || "http://localhost:5000";
        
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
        
        return NextResponse.json({ 
            status: data.status, 
            last_check_in: data.timestamp 
        });
    } catch (error) {
        console.error("Bridge health error:", error);
        return NextResponse.json({ status: "offline", last_check_in: null });
    }
}
