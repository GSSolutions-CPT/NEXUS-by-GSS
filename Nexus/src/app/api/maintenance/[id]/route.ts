import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
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

        // Currently, only SuperAdmins can move tickets across the board
        if (profile?.role !== 'SuperAdmin') {
            return NextResponse.json({ error: "Forbidden: SuperAdmin access required" }, { status: 403 });
        }

        // Await the params before using them as required by Next.js 15
        const params = await context.params;
        const ticketId = params.id;

        const body = await request.json();
        const { status } = body;

        if (!status || !['Open', 'In Progress', 'Resolved'].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("maintenance_tickets")
            .update({ status })
            .eq("id", ticketId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, ticket: data });

    } catch (err) {
        console.error("PATCH /api/maintenance/[id] err:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
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
            return NextResponse.json({ error: "Forbidden: SuperAdmin access required" }, { status: 403 });
        }

        const params = await context.params;
        const ticketId = params.id;

        const { error } = await supabase
            .from("maintenance_tickets")
            .delete()
            .eq("id", ticketId);

        if (error) throw error;

        return NextResponse.json({ success: true, message: "Ticket deleted successfully" });

    } catch (err) {
        console.error("DELETE /api/maintenance/[id] err:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
