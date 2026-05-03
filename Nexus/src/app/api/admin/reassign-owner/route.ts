import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * Unit Owner Reassignment API (Admin)
 * POST — Reassign a unit to a new owner without deleting structure
 *  - Removes previous owner's unit_id link
 *  - Assigns new owner's profile to the unit
 *  - QR code, access groups, and unit structure remain intact
 *  - Optionally regenerates QR code for security
 */

async function assertSuperAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized", status: 401, supabase: null, userId: null };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "SuperAdmin") {
        return { error: "Forbidden — SuperAdmin only", status: 403, supabase: null, userId: null };
    }

    return { error: null, status: 200, supabase, userId: user.id };
}

export async function POST(req: NextRequest) {
    const { error, status, supabase, userId } = await assertSuperAdmin();
    if (error || !supabase) return NextResponse.json({ error }, { status });

    const body = await req.json();
    const { unit_id, new_owner_id, regenerate_qr } = body;

    if (!unit_id || !new_owner_id) {
        return NextResponse.json(
            { error: "unit_id and new_owner_id are required" },
            { status: 400 }
        );
    }

    // 1. Verify the unit exists
    const { data: unit, error: unitErr } = await supabase
        .from("units")
        .select("id, name")
        .eq("id", unit_id)
        .single();

    if (unitErr || !unit) {
        return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    // 2. Verify the new owner exists and is a GroupAdmin
    const { data: newOwner, error: ownerErr } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role, unit_id")
        .eq("id", new_owner_id)
        .single();

    if (ownerErr || !newOwner) {
        return NextResponse.json({ error: "New owner profile not found" }, { status: 404 });
    }

    if (newOwner.role !== "GroupAdmin") {
        return NextResponse.json(
            { error: "New owner must have the GroupAdmin role" },
            { status: 400 }
        );
    }

    if (newOwner.unit_id && newOwner.unit_id !== unit_id) {
        return NextResponse.json(
            { error: `New owner is already assigned to another unit. Remove them first.` },
            { status: 409 }
        );
    }

    // 3. Remove previous owner(s) from this unit (set unit_id to null)
    const { error: removeErr } = await supabase
        .from("profiles")
        .update({ unit_id: null })
        .eq("unit_id", unit_id)
        .neq("id", new_owner_id); // Don't unlink the new owner if they're already linked

    if (removeErr) {
        return NextResponse.json({ error: `Failed to remove previous owner: ${removeErr.message}` }, { status: 500 });
    }

    // 4. Assign the new owner to this unit
    const { error: assignErr } = await supabase
        .from("profiles")
        .update({ unit_id })
        .eq("id", new_owner_id);

    if (assignErr) {
        return NextResponse.json({ error: `Failed to assign new owner: ${assignErr.message}` }, { status: 500 });
    }

    // 5. Optionally regenerate QR code for security during handover
    let newQr = null;
    if (regenerate_qr) {
        const { randomUUID } = await import("crypto");
        // Delete old QR
        await supabase.from("qr_codes").delete().eq("unit_id", unit_id);
        // Generate new QR
        const qrValue = `NEXUS-${randomUUID().replace(/-/g, "").substring(0, 16).toUpperCase()}`;
        const { data: qr } = await supabase
            .from("qr_codes")
            .insert({ unit_id, qr_value: qrValue, status: "active" })
            .select()
            .single();
        newQr = qr;
    }

    // 6. Create an audit log entry
    await supabase.from("audit_logs").insert({
        unit_id,
        event_type: "owner_reassignment",
        actor_name: "SuperAdmin",
        details: `Unit "${unit.name}" reassigned to ${newOwner.first_name} ${newOwner.last_name}${regenerate_qr ? " (QR regenerated)" : ""}`,
        performed_by: userId,
    });

    return NextResponse.json({
        message: `Unit "${unit.name}" successfully reassigned to ${newOwner.first_name} ${newOwner.last_name}`,
        unit_id,
        new_owner: {
            id: newOwner.id,
            first_name: newOwner.first_name,
            last_name: newOwner.last_name,
        },
        qr_regenerated: !!regenerate_qr,
        new_qr: newQr,
    });
}
