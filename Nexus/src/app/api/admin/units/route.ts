import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/admin/units — Fetch all units with their access groups and owner info
export async function GET() {
    try {
        const supabase = await createClient();

        // Authenticate
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify SuperAdmin role
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== 'SuperAdmin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch all units
        const { data: units, error: unitsErr } = await supabase
            .from("units")
            .select("*")
            .order("created_at", { ascending: true });

        if (unitsErr) {
            console.error("Failed to fetch units:", unitsErr);
            return NextResponse.json({ error: "Failed to fetch units." }, { status: 500 });
        }

        // Fetch all access group mappings
        const { data: mappings } = await supabase
            .from("unit_access_mapping")
            .select("unit_id, access_group_id, access_groups(id, name)");

        // Fetch all profiles that are GroupAdmins (to show owners)
        const { data: owners } = await supabase
            .from("profiles")
            .select("unit_id, first_name, last_name")
            .eq("role", "GroupAdmin");

        // Fetch all available access groups 
        const { data: accessGroups } = await supabase
            .from("access_groups")
            .select("*")
            .order("id", { ascending: true });

        // Combine data
        const enrichedUnits = (units || []).map((unit: Record<string, unknown>) => {
            const unitMappings = (mappings || []).filter((m: Record<string, unknown>) => m.unit_id === unit.id);
            const unitOwner = (owners || []).find((o: Record<string, unknown>) => o.unit_id === unit.id);

            return {
                ...unit,
                access_groups: unitMappings.map((m: Record<string, unknown>) => m.access_groups),
                owner: unitOwner ? { first_name: unitOwner.first_name, last_name: unitOwner.last_name } : null,
            };
        });

        return NextResponse.json({
            units: enrichedUnits,
            available_access_groups: accessGroups || []
        });

    } catch (err) {
        console.error("Critical error in GET /api/admin/units:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/admin/units — Create a new unit
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

        if (profile?.role !== 'SuperAdmin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { name, type, floor, accessGroupIds } = body;

        if (!name || !type) {
            return NextResponse.json({ error: "Name and type are required." }, { status: 400 });
        }

        // Create the unit
        const { data: newUnit, error: insertErr } = await supabase
            .from("units")
            .insert([{ name, type, floor }])
            .select()
            .single();

        if (insertErr || !newUnit) {
            console.error("Failed to create unit:", insertErr);
            return NextResponse.json({ error: "Failed to create unit." }, { status: 500 });
        }

        // Map access groups if provided
        if (accessGroupIds && accessGroupIds.length > 0) {
            const mappings = accessGroupIds.map((groupId: number) => ({
                unit_id: newUnit.id,
                access_group_id: groupId,
            }));

            const { error: mapErr } = await supabase
                .from("unit_access_mapping")
                .insert(mappings);

            if (mapErr) {
                console.error("Failed to map access groups:", mapErr);
            }
        }

        return NextResponse.json({ success: true, unit: newUnit });

    } catch (err) {
        console.error("Critical error in POST /api/admin/units:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/admin/units — Delete a unit
export async function DELETE(request: Request) {
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

        if (profile?.role !== 'SuperAdmin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const unitId = searchParams.get("id");

        if (!unitId) {
            return NextResponse.json({ error: "Unit ID is required." }, { status: 400 });
        }

        const { error: deleteErr } = await supabase
            .from("units")
            .delete()
            .eq("id", unitId);

        if (deleteErr) {
            console.error("Failed to delete unit:", deleteErr);
            return NextResponse.json({ error: "Failed to delete unit." }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error("Critical error in DELETE /api/admin/units:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
