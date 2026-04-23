import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import * as z from 'zod';

const unitSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    type: z.string().min(1, "Type is required").max(50),
    floor: z.string().max(50).optional().nullable(),
    accessGroupIds: z.array(z.number().int().positive()).optional()
});

const patchUnitSchema = unitSchema.extend({
    id: z.string().uuid("Invalid unit ID")
});

// GET /api/admin/units — Fetch all units with their access groups and owner info
export async function GET() {
    try {
        const supabase = await createClient();

        // Authenticate
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Optimization: Use JWT claims instead of querying the 'profiles' table (saves ~20-50ms)
        const userRole = user.app_metadata?.user_role;

        if (userRole !== 'SuperAdmin') {
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

        // Optimization: Use JWT claims instead of querying the 'profiles' table (saves ~20-50ms)
        const userRole = user.app_metadata?.user_role;

        if (userRole !== 'SuperAdmin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const parseResult = unitSchema.safeParse(body);
        
        if (!parseResult.success) {
            return NextResponse.json({ 
                error: "Invalid input data", 
                details: parseResult.error.flatten() 
            }, { status: 400 });
        }

        const { name, type, floor, accessGroupIds } = parseResult.data;

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

        // Optimization: Use JWT claims instead of querying the 'profiles' table (saves ~20-50ms)
        const userRole = user.app_metadata?.user_role;

        if (userRole !== 'SuperAdmin') {
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

// PATCH /api/admin/units — Update an existing unit
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Optimization: Use JWT claims instead of querying the 'profiles' table (saves ~20-50ms)
        const userRole = user.app_metadata?.user_role;
        if (userRole !== 'SuperAdmin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await request.json();
        const parseResult = patchUnitSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json({ 
                error: "Invalid input data", 
                details: parseResult.error.flatten() 
            }, { status: 400 });
        }

        const { id, name, type, floor, accessGroupIds } = parseResult.data;

        // 1. Update the unit record
        const { error: updateErr } = await supabase
            .from("units")
            .update({ name, type, floor })
            .eq("id", id);

        if (updateErr) throw updateErr;

        // 2. Sync access group mappings
        // First delete all existing mappings for this unit
        const { error: deleteMappingsErr } = await supabase
            .from("unit_access_mapping")
            .delete()
            .eq("unit_id", id);

        if (deleteMappingsErr) throw deleteMappingsErr;

        // Then insert new mappings if any
        if (accessGroupIds && accessGroupIds.length > 0) {
            const newMappings = accessGroupIds.map((groupId: number) => ({
                unit_id: id,
                access_group_id: groupId,
            }));

            const { error: insertMappingsErr } = await supabase
                .from("unit_access_mapping")
                .insert(newMappings);

            if (insertMappingsErr) throw insertMappingsErr;
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Critical error in PATCH /api/admin/units:", err);
        return NextResponse.json({ error: "Failed to update unit." }, { status: 500 });
    }
}
