import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { maintenanceSchema } from '@/lib/validations';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();

        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Optimization: Use JWT claims instead of querying the 'profiles' table (saves ~20-50ms)
        const userRole = user.app_metadata?.user_role;
        const unitId = user.app_metadata?.user_unit_id;

        let query = supabase
            .from("maintenance_tickets")
            .select(`
                *,
                units ( name ),
                profiles!maintenance_tickets_reported_by_fkey ( first_name, last_name )
            `)
            .order("created_at", { ascending: false });

        // If not admin, only fetch their own unit's tickets
        if (userRole !== 'SuperAdmin') {
            if (!unitId) {
                return NextResponse.json({ tickets: [] }); // No unit assigned
            }
            query = query.eq("unit_id", unitId);
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

        // Optimization: Use JWT claims instead of querying the 'profiles' table (saves ~20-50ms)
        const unitId = user.app_metadata?.user_unit_id;

        if (!unitId) {
            return NextResponse.json({ error: "No unit assigned. Cannot create ticket." }, { status: 400 });
        }

        const body = await request.json();
        
        const parseResult = maintenanceSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json({ error: "Invalid input data", details: parseResult.error.flatten() }, { status: 400 });
        }
        
        const { title, description, category, priority, image_url } = parseResult.data;

        const { data, error } = await supabase
            .from("maintenance_tickets")
            .insert({
                title,
                description,
                priority: priority || 'Medium',
                category: category || 'General',
                status: 'Open',
                unit_id: unitId,
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
