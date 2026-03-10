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

// POST /api/admin/users — Create a new user via invite link
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

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Step 1: Create the user account (confirmed) with a server-side temp password.
        // The user will reset it via the magic link we generate below.
        const tempPassword = `Nex${randomInt(100000, 999999)}!Tmp`;

        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { first_name: firstName, last_name: lastName }
        });

        if (createErr || !newUser.user) {
            console.error(`[Admin User Creation Failed] ID: ${user.id} | Err:`, createErr);
            // Handle duplicate email gracefully
            if (createErr?.message?.toLowerCase().includes("already")) {
                return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
            }
            return NextResponse.json({ error: "Failed to provision user account." }, { status: 500 });
        }

        // Step 2: Set role & unit on the profile immediately
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
        }

        // Step 3: Generate a password-reset (magic) link so the user sets their own password.
        // Use a robust fallback chain — never rely on a single env var that may point to a dead preview deployment.
        const PRODUCTION_URL = "https://nexus-by-gss.vercel.app";
        const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
        // Reject preview-deployment URLs (they are ephemeral and die after redeploys)
        const isDeadPreview = rawSiteUrl && /[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+\.vercel\.app/.test(rawSiteUrl);
        const siteUrl = (!rawSiteUrl || isDeadPreview) ? PRODUCTION_URL : rawSiteUrl.startsWith("http") ? rawSiteUrl : `https://${rawSiteUrl}`;

        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: "recovery",
            email,
            options: { redirectTo: `${siteUrl}/` },
        });

        if (linkErr || !linkData?.properties?.action_link) {
            console.error("Failed to generate magic link:", linkErr);
            // Still a success — user exists, just no magic link
            return NextResponse.json({
                success: true,
                invited: false,
                message: "User created. Could not generate invite link — ask them to use 'Forgot Password' on the login page.",
                userId: newUser.user.id,
            });
        }

        return NextResponse.json({
            success: true,
            invited: true,
            message: "User created successfully.",
            userId: newUser.user.id,
            inviteLink: linkData.properties.action_link,
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
