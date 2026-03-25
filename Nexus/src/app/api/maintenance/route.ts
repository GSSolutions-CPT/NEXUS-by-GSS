import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();

        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch user profile to check role
        const { data: profile } = await supabase
            .from("profiles")
            .select("role, unit_id")
            .eq("id", user.id)
            .single();

        let query = supabase
            .from("maintenance_tickets")
            .select(`
                *,
                units ( name ),
                profiles!maintenance_tickets_reported_by_fkey ( first_name, last_name )
            `)
            .order("created_at", { ascending: false });

        // If not admin, only fetch their own unit's tickets
        if (profile?.role !== 'SuperAdmin') {
            if (!profile?.unit_id) {
                return NextResponse.json({ tickets: [] }); // No unit assigned
            }
            query = query.eq("unit_id", profile.unit_id);
        }

        const { data: tickets, error } = await query;

        if (error) throw error;

        // Transform data for easier consumption
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedTickets = tickets?.map((t: any) => ({
            ...t,
            unit_name: t.units?.name || 'Unknown Unit',
            reported_by_name: t.profiles ? `${t.profiles.first_name} ${t.profiles.last_name}` : 'Unknown Reporter'
        })) || [];

        return NextResponse.json({ tickets: formattedTickets });

    } catch (err) {
        console.error("GET /api/maintenance err:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();

        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("unit_id")
            .eq("id", user.id)
            .single();

        if (!profile?.unit_id) {
            return NextResponse.json({ error: "No unit assigned. Cannot create ticket." }, { status: 400 });
        }

        const body = await request.json();
        const { title, description, priority, category, image_url } = body;

        if (!title || !description) {
            return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("maintenance_tickets")
            .insert({
                title,
                description,
                priority: priority || 'Medium',
                category: category || 'General',
                status: 'Open',
                unit_id: profile.unit_id,
                reported_by: user.id,
                image_url: image_url || null
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, ticket: data });

    } catch (err) {
        console.error("POST /api/maintenance err:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
