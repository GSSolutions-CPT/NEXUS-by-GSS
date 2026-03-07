import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';

// GET /api/admin/users — List all users with profiles
export async function GET() {
    try {
        const supabase = await createServerClient();

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

        // Use service role to list all users
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Fetch all profiles — no embedded join (avoids PostgREST FK cache issues)
        const { data: profiles, error: profErr } = await supabaseAdmin
            .from("profiles")
            .select("id, first_name, last_name, role, unit_id, created_at")
            .order("created_at", { ascending: true });

        if (profErr) {
            console.error("Failed to fetch profiles:", profErr);
            return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
        }

        // Fetch auth users to get emails and last sign in
        const { data: authUsers, error: authListErr } = await supabaseAdmin.auth.admin.listUsers();

        if (authListErr) {
            console.error("Failed to list auth users:", authListErr);
        }

        // Fetch all units for the dropdown
        const { data: units } = await supabaseAdmin
            .from("units")
            .select("id, name, type")
            .order("name", { ascending: true });

        // Merge profiles with auth data, resolving unit names locally
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const enrichedUsers = (profiles || []).map((p: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const authUser = authUsers?.users?.find((u: any) => u.id === p.id);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const unit = (units || []).find((u: any) => u.id === p.unit_id);
            return {
                ...p,
                email: authUser?.email || "Unknown",
                last_sign_in: authUser?.last_sign_in_at || null,
                unit_name: unit?.name || null,
            };
        });

        return NextResponse.json({
            users: enrichedUsers,
            units: units || [],
        });

    } catch (err) {
        console.error("Critical error in GET /api/admin/users:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/admin/users — Create a new user
export async function POST(request: Request) {
    try {
        const supabase = await createServerClient();

        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
            console.warn("Unauthorized API access attempt");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile, error: profErr } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profErr || profile?.role !== 'SuperAdmin') {
            return NextResponse.json({ error: "Forbidden: SuperAdmin access required" }, { status: 403 });
        }

        const body = await request.json();
        const { email, firstName, lastName, role, unitId } = body;

        if (!email || !firstName || !lastName || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Generate a secure temporary password server-side
        const tempPassword = `Nex${randomInt(100000, 999999)}!`;

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { first_name: firstName, last_name: lastName }
        });

        if (createErr || !newUser.user) {
            console.error(`[Admin User Creation Failed] ID: ${user.id} | Err:`, createErr);
            return NextResponse.json({ error: "Failed to provision user account." }, { status: 500 });
        }

        // Update the profile with role & unit
        const profilePayload: Record<string, unknown> = {
            first_name: firstName,
            last_name: lastName,
            role,
        };
        if (unitId) profilePayload.unit_id = unitId;

        const { error: profileUpdateErr } = await supabaseAdmin
            .from("profiles")
            .update(profilePayload)
            .eq("id", newUser.user.id);

        if (profileUpdateErr) {
            console.error("Failed to update user profile:", profileUpdateErr);
            return NextResponse.json({
                success: true,
                warning: "User created but profile role mapping failed.",
                userId: newUser.user.id,
                tempPassword,
            });
        }

        return NextResponse.json({
            success: true,
            message: "User created successfully.",
            userId: newUser.user.id,
            tempPassword,
        });

    } catch (err) {
        console.error("Critical API Route Error in /api/admin/users:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/admin/users — Delete a user
export async function DELETE(request: Request) {
    try {
        const supabase = await createServerClient();

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
        const userId = searchParams.get("id");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required." }, { status: 400 });
        }

        // Prevent self-deletion
        if (userId === user.id) {
            return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
        }

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Delete from auth (cascade to profiles via FK)
        const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteErr) {
            console.error("Failed to delete user:", deleteErr);
            return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error("Critical error in DELETE /api/admin/users:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
