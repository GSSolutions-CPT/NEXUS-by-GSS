import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createServerClient();

        // 1. Authenticate Request - Only SuperAdmins can do this
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
            console.warn(`[${user.id}] Forbidden. Only SuperAdmins can invite users.`);
            return NextResponse.json({ error: "Forbidden: SuperAdmin access required" }, { status: 403 });
        }

        const body = await request.json();
        const { email, password, firstName, lastName, role, unitId } = body;

        if (!email || !password || !firstName || !lastName || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 2. Initialize the Supabase Service Role client to bypass RLS & Auto-Confirm
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            console.error("SUPABASE_SERVICE_ROLE_KEY is missing.");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // 3. Create user in Supabase Auth via Admin API
        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Auto-confirm for this managed enterprise system
            user_metadata: {
                first_name: firstName,
                last_name: lastName,
            }
        });

        if (createErr || !newUser.user) {
            console.error(`[Admin User Creation Failed] ID: ${user.id} | Err:`, createErr);
            // Do not leak createErr?.message to the client
            return NextResponse.json({ error: "Failed to provision user account. Please contact system support." }, { status: 500 });
        }

        // 4. Update the trigger-created profile with role & unit
        const profilePayload: any = {
            first_name: firstName,
            last_name: lastName,
            role: role // 'SuperAdmin', 'GroupAdmin', or 'Guard'
        };

        if (unitId) {
            profilePayload.unit_id = unitId;
        }

        const { error: profileUpdateErr } = await supabaseAdmin
            .from("profiles")
            .update(profilePayload)
            .eq("id", newUser.user.id);

        if (profileUpdateErr) {
            console.error("Failed to update user profile:", profileUpdateErr);
            // Non-fatal, they can still log in, but role won't be set correctly.
            return NextResponse.json({
                success: true,
                warning: "User created but profile role mapping failed. Please edit user manually.",
                userId: newUser.user.id
            });
        }

        return NextResponse.json({
            success: true,
            message: "User invited successfully.",
            userId: newUser.user.id
        });

    } catch (err: unknown) {
        console.error("Critical API Route Error in /api/admin/users:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
