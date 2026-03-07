import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createServerClient();

        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role, unit_id")
            .eq("id", user.id)
            .single();

        const isSuperAdmin = profile?.role === 'SuperAdmin';
        const isGroupAdmin = profile?.role === 'GroupAdmin';

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const notifications: {
            id: string;
            type: 'warning' | 'info' | 'error';
            title: string;
            message: string;
            timestamp: string;
        }[] = [];

        const now = new Date().toISOString();

        // --- 1. Pending visitors (not yet synced to hardware) ---
        {
            let query = supabaseAdmin
                .from("visitors")
                .select("id, first_name, last_name, created_at, units(name)")
                .eq("status", "Pending");

            if (isGroupAdmin && profile.unit_id) {
                query = query.eq("unit_id", profile.unit_id);
            }

            const { data: pending } = await query.order("created_at", { ascending: false }).limit(5);

            (pending || []).forEach((v: Record<string, unknown>) => {
                const unitName = (v.units as Record<string, unknown>)?.name || "Unknown Unit";
                notifications.push({
                    id: `pending-${v.id}`,
                    type: 'warning',
                    title: 'Pending Visitor Sync',
                    message: `${v.first_name} ${v.last_name} (${unitName}) is waiting to be pushed to hardware`,
                    timestamp: v.created_at as string,
                });
            });
        }

        // --- 2. Expired visitors still marked Active (stale data) ---
        {
            let query = supabaseAdmin
                .from("visitors")
                .select("id, first_name, last_name, expiry_time, units(name)")
                .eq("status", "Active")
                .lt("expiry_time", now);

            if (isGroupAdmin && profile.unit_id) {
                query = query.eq("unit_id", profile.unit_id);
            }

            const { data: expired } = await query.order("expiry_time", { ascending: false }).limit(5);

            (expired || []).forEach((v: Record<string, unknown>) => {
                const unitName = (v.units as Record<string, unknown>)?.name || "Unknown Unit";
                notifications.push({
                    id: `expired-${v.id}`,
                    type: 'error',
                    title: 'Stale Active Pass',
                    message: `${v.first_name} ${v.last_name} (${unitName}) — pass expired but still marked Active`,
                    timestamp: v.expiry_time as string,
                });
            });
        }

        // --- 3. Recent audit events (access denied) — SuperAdmin only ---
        if (isSuperAdmin) {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: denied } = await supabaseAdmin
                .from("audit_logs")
                .select("id, action, timestamp, units(name)")
                .ilike("action", "%denied%")
                .gte("timestamp", oneDayAgo)
                .order("timestamp", { ascending: false })
                .limit(5);

            (denied || []).forEach((e: Record<string, unknown>) => {
                const unitName = (e.units as Record<string, unknown>)?.name || "Unknown";
                notifications.push({
                    id: `audit-${e.id}`,
                    type: 'error',
                    title: 'Access Denied Event',
                    message: `${e.action} at ${unitName}`,
                    timestamp: e.timestamp as string,
                });
            });
        }

        // Sort by recency
        notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return NextResponse.json({ notifications: notifications.slice(0, 10) });

    } catch (err) {
        console.error("Error in GET /api/notifications:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
