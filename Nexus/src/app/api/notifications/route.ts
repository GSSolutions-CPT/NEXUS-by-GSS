import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// GET: Fetch persistent notifications
export async function GET() {
    try {
        const supabase = await createServerClient();

        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch from the new persistent notifications table
        const { data: notifications, error: notifErr } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20);

        if (notifErr && notifErr.code === 'PGRST116') {
             // Table might not exist yet — return empty for safety
             return NextResponse.json({ notifications: [] });
        }

        return NextResponse.json({ notifications: notifications || [] });

    } catch (err) {
        console.error("Error in GET /api/notifications:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH: Mark notification as read
export async function PATCH(req: Request) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { id, read } = body;

        if (!id) return NextResponse.json({ error: "Missing notification ID" }, { status: 400 });

        const { error } = await supabase
            .from("notifications")
            .update({ read: !!read })
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Error in PATCH /api/notifications:", err);
        return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
    }
}
