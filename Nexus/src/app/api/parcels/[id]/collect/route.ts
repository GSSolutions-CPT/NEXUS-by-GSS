import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();

        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Optimization: Use JWT claims instead of querying the 'profiles' table (saves ~20-50ms)
        const userRole = user.app_metadata?.user_role;

        if (userRole !== 'SuperAdmin' && userRole !== 'Guard') {
            return NextResponse.json({ error: "Forbidden. Only guards can release parcels." }, { status: 403 });
        }

        const params = await context.params;
        const parcelId = params.id;
        
        const body = await request.json();
        const { collection_signature_uid } = body;

        if (!collection_signature_uid) {
            return NextResponse.json({ error: "Missing signature UID" }, { status: 400 });
        }

        // Verify the tenant actually belongs to the parcel's unit
        const { data: parcel } = await supabase
            .from("parcels")
            .select("unit_id, status")
            .eq("id", parcelId)
            .single();
            
        if (!parcel) {
            return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
        }
        
        if (parcel.status === 'Collected') {
            return NextResponse.json({ error: "Parcel already collected" }, { status: 400 });
        }

        const { data: tenantProfile } = await supabase
            .from("profiles")
            .select("unit_id")
            .eq("id", collection_signature_uid)
            .single();

        if (!tenantProfile || tenantProfile.unit_id !== parcel.unit_id) {
            return NextResponse.json({ error: "Tenant does not belong to the parcel's unit" }, { status: 403 });
        }

        // Update the parcel
        const { data, error } = await supabase
            .from("parcels")
            .update({
                status: 'Collected',
                collected_at: new Date().toISOString(),
                collection_signature_uid
            })
            .eq("id", parcelId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, parcel: data });

    } catch (err) {
        console.error("POST /api/parcels/collect err:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
