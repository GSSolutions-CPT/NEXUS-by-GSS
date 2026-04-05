import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/admin/bridge-health — server-side proxy to check Bridge status
// This prevents leaking the internal Bridge IP to the browser.
export async function GET() {
    try {
        const supabase = await createClient();
        
        // Fetch the most recent heartbeat/health check
        const { data, error } = await supabase
            .from("bridge_health")
            .select("status, last_check_in")
            .order("last_check_in", { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return NextResponse.json({ status: "offline", last_check_in: null });
        }

        // Staleness Check: If last check-in was > 2 minutes ago, consider it offline
        const lastCheckIn = new Date(data.last_check_in);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastCheckIn.getTime()) / (1000 * 60);

        if (diffMinutes > 2) {
            return NextResponse.json({ 
                status: "offline", 
                last_check_in: data.last_check_in,
                is_stale: true 
            });
        }

        return NextResponse.json({ 
            status: data.status, 
            last_check_in: data.last_check_in 
        });
    } catch (error) {
        console.error("Bridge health error:", error);
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}
