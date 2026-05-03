import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { randomUUID } from "crypto";

/**
 * Admin QR Code Management API
 * Handles CRUD operations for unit QR codes.
 * All endpoints require SuperAdmin role.
 */

async function assertSuperAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized", status: 401, supabase: null, user: null };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role, first_name, last_name")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "SuperAdmin") {
        return { error: "Forbidden — SuperAdmin only", status: 403, supabase: null, user: null };
    }

    return { error: null, status: 200, supabase, user, actorName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'SuperAdmin' };
}

// GET — List all QR codes with unit info
export async function GET() {
    const { error, status, supabase } = await assertSuperAdmin();
    if (error || !supabase) return NextResponse.json({ error }, { status });

    // Fetch all units with their QR codes and access groups
    const { data: units, error: unitsErr } = await supabase
        .from("units")
        .select(`
            id, name, type, floor,
            qr_codes ( id, qr_value, status, created_at, updated_at ),
            unit_access_mapping ( access_group_id, access_groups ( id, name ) ),
            profiles!profiles_unit_id_fkey ( first_name, last_name )
        `)
        .order("name");

    if (unitsErr) {
        return NextResponse.json({ error: unitsErr.message }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = (units || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        type: u.type,
        floor: u.floor,
        qr_code: Array.isArray(u.qr_codes) ? u.qr_codes[0] || null : u.qr_codes || null,
        access_groups: (u.unit_access_mapping || []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (m: any) => m.access_groups
        ).filter(Boolean),
        owner: Array.isArray(u.profiles) ? u.profiles[0] || null : u.profiles || null,
    }));

    return NextResponse.json({ units: formatted });
}

// POST — Generate QR code for a unit (or bulk generate)
export async function POST(req: NextRequest) {
    const { error, status, supabase, actorName } = await assertSuperAdmin();
    if (error || !supabase) return NextResponse.json({ error }, { status });

    const body = await req.json();
    const { unit_id, bulk } = body;

    if (bulk) {
        // Bulk generate: find all units without QR codes
        const { data: allUnits } = await supabase.from("units").select("id");
        const { data: existingQr } = await supabase.from("qr_codes").select("unit_id");

        const existingUnitIds = new Set((existingQr || []).map(q => q.unit_id));
        const unitsWithoutQr = (allUnits || []).filter(u => !existingUnitIds.has(u.id));

        if (unitsWithoutQr.length === 0) {
            return NextResponse.json({ message: "All units already have QR codes", generated: 0 });
        }

        const qrInserts = unitsWithoutQr.map(u => ({
            unit_id: u.id,
            qr_value: `NEXUS-${randomUUID().replace(/-/g, "").substring(0, 16).toUpperCase()}`,
            status: "active",
        }));

        const { error: insertErr } = await supabase.from("qr_codes").insert(qrInserts);
        if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

        return NextResponse.json({ message: `Generated ${qrInserts.length} QR codes`, generated: qrInserts.length });
    }

    // Single unit
    if (!unit_id) {
        return NextResponse.json({ error: "unit_id is required" }, { status: 400 });
    }

    // Check if unit already has a QR
    const { data: existing } = await supabase
        .from("qr_codes")
        .select("id")
        .eq("unit_id", unit_id)
        .single();

    if (existing) {
        return NextResponse.json({ error: "Unit already has a QR code. Delete it first to regenerate." }, { status: 409 });
    }

    const qrValue = `NEXUS-${randomUUID().replace(/-/g, "").substring(0, 16).toUpperCase()}`;
    const { data: qr, error: insertErr } = await supabase
        .from("qr_codes")
        .insert({ unit_id, qr_value: qrValue, status: "active" })
        .select()
        .single();

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    // Audit log for single QR generation
    await supabase.from("audit_logs").insert({
        unit_id,
        event_type: "qr_generated",
        actor_name: actorName,
        details: `QR code generated: ${qrValue}`,
    });

    return NextResponse.json({ qr_code: qr }, { status: 201 });
}

// PATCH — Update QR code status (activate/deactivate)
export async function PATCH(req: NextRequest) {
    const { error, status, supabase, actorName } = await assertSuperAdmin();
    if (error || !supabase) return NextResponse.json({ error }, { status });

    const body = await req.json();
    const { qr_id, status: newStatus } = body;

    if (!qr_id || !newStatus) {
        return NextResponse.json({ error: "qr_id and status are required" }, { status: 400 });
    }

    if (!["active", "inactive"].includes(newStatus)) {
        return NextResponse.json({ error: "status must be 'active' or 'inactive'" }, { status: 400 });
    }

    const { error: updateErr } = await supabase
        .from("qr_codes")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", qr_id);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Audit log for status toggle
    await supabase.from("audit_logs").insert({
        event_type: "qr_status_changed",
        actor_name: actorName,
        details: `QR code ${qr_id} ${newStatus === "active" ? "activated" : "deactivated"}`,
    });

    return NextResponse.json({ message: `QR code ${newStatus === "active" ? "activated" : "deactivated"}` });
}

// DELETE — Delete and optionally regenerate QR code
export async function DELETE(req: NextRequest) {
    const { error, status, supabase, actorName } = await assertSuperAdmin();
    if (error || !supabase) return NextResponse.json({ error }, { status });

    const { searchParams } = new URL(req.url);
    const qrId = searchParams.get("id");
    const regenerate = searchParams.get("regenerate") === "true";
    const unitId = searchParams.get("unit_id");

    if (!qrId) {
        return NextResponse.json({ error: "QR code id is required" }, { status: 400 });
    }

    const { error: deleteErr } = await supabase.from("qr_codes").delete().eq("id", qrId);
    if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });

    // Optionally regenerate immediately
    if (regenerate && unitId) {
        const qrValue = `NEXUS-${randomUUID().replace(/-/g, "").substring(0, 16).toUpperCase()}`;
        const { data: newQr, error: insertErr } = await supabase
            .from("qr_codes")
            .insert({ unit_id: unitId, qr_value: qrValue, status: "active" })
            .select()
            .single();

        if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

        // Audit log for regeneration
        await supabase.from("audit_logs").insert({
            unit_id: unitId,
            event_type: "qr_regenerated",
            actor_name: actorName,
            details: `QR code regenerated: ${qrValue}`,
        });

        return NextResponse.json({ message: "QR code regenerated", qr_code: newQr });
    }

    // Audit log for deletion
    await supabase.from("audit_logs").insert({
        event_type: "qr_deleted",
        actor_name: actorName,
        details: `QR code ${qrId} deleted`,
    });

    return NextResponse.json({ message: "QR code deleted" });
}
