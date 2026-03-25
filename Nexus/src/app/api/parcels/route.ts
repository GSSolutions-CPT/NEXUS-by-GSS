import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();

        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role, unit_id")
            .eq("id", user.id)
            .single();

        let query = supabase
            .from("parcels")
            .select(`
                *,
                units ( name ),
                logged_by_profile:profiles!parcels_logged_by_fkey ( first_name, last_name ),
                collected_by_profile:profiles!parcels_collection_signature_uid_fkey ( first_name, last_name )
            `)
            .order("logged_at", { ascending: false });

        if (profile?.role !== 'SuperAdmin' && profile?.role !== 'Guard') {
            if (!profile?.unit_id) {
                return NextResponse.json({ parcels: [] });
            }
            query = query.eq("unit_id", profile.unit_id);
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

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== 'SuperAdmin' && profile?.role !== 'Guard') {
            return NextResponse.json({ error: "Forbidden. Only guards can log parcels." }, { status: 403 });
        }

        const body = await request.json();
        const { unit_id, courier_name, recipient_name } = body;

        if (!unit_id || !courier_name) {
            return NextResponse.json({ error: "Unit ID and Courier Name are required" }, { status: 400 });
        }

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
