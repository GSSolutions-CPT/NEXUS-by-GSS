import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { parcelSchema } from '@/lib/validations';

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
            .from("parcels")
            .select(`
                *,
                units ( name ),
                logged_by_profile:profiles!parcels_logged_by_fkey ( first_name, last_name ),
                collected_by_profile:profiles!parcels_collection_signature_uid_fkey ( first_name, last_name )
            `)
            .order("logged_at", { ascending: false });

        if (userRole !== 'SuperAdmin' && userRole !== 'Guard') {
            if (!unitId) {
                return NextResponse.json({ parcels: [] });
            }
            query = query.eq("unit_id", unitId);
        }

        const { data: parcels, error } = await query;

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedParcels = parcels?.map((p: any) => ({
            ...p,
            unit_name: p.units?.name || 'Unknown Unit',
            logged_by_name: p.logged_by_profile ? `${p.logged_by_profile.first_name} ${p.logged_by_profile.last_name}` : 'Unknown Guard',
            collected_by_name: p.collected_by_profile ? `${p.collected_by_profile.first_name} ${p.collected_by_profile.last_name}` : null
        })) || [];

        return NextResponse.json({ parcels: formattedParcels });
    } catch (err) {
        console.error("GET /api/parcels err:", err);
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
        const userRole = user.app_metadata?.user_role;

        if (userRole !== 'SuperAdmin' && userRole !== 'Guard') {
            return NextResponse.json({ error: "Forbidden. Only guards can log parcels." }, { status: 403 });
        }

        const body = await request.json();
        
        const parseResult = parcelSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json({ error: "Invalid input data", details: parseResult.error.flatten() }, { status: 400 });
        }
        
        const { unit_id, courier_name, recipient_name } = parseResult.data;

        const { data, error } = await supabase
            .from("parcels")
            .insert({
                unit_id,
                courier_name,
                recipient_name: recipient_name || null,
                status: 'Pending Collection',
                logged_by: user.id
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, parcel: data });
    } catch (err) {
        console.error("POST /api/parcels err:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
