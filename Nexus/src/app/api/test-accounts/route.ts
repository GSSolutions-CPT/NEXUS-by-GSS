import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// CAUTION: This route uses the Service Role key to bypass RLS and create accounts directly.
// In a production environment, this file MUST be deleted.

export async function GET() {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY! // MUST have Service Role for admin auth creation
        );

        const accounts = [
            { email: 'superadmin@globalsecurity.co.za', password: 'Password123!', role: 'SuperAdmin' },
            { email: 'admin@globalsecurity.co.za', password: 'Password123!', role: 'GroupAdmin' },
            { email: 'guard@globalsecurity.co.za', password: 'Password123!', role: 'Guard' }
        ];

        const results = [];

        for (const acc of accounts) {
            // 1. Create the Auth User
            const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
                email: acc.email,
                password: acc.password,
                email_confirm: true,
                user_metadata: { role: acc.role }
            });

            if (authErr) {
                // If it already exists, just log it and move on
                if (authErr.message.includes('already exists')) {
                    results.push(`${acc.role} account already exists.`);
                    continue;
                }
                throw new Error(`Failed to create ${acc.role} auth: ${authErr.message}`);
            }

            // 2. The database trigger (handle_new_user) will automatically create the profile.
            // But we need to update the role manually because it might default to 'Guard' or 'Resident'.
            if (authData?.user) {
                const { error: profileErr } = await supabaseAdmin
                    .from('profiles')
                    .update({ role: acc.role })
                    .eq('id', authData.user.id);

                if (profileErr) throw new Error(`Failed to set role for ${acc.role}: ${profileErr.message}`);
                
                results.push(`${acc.role} account created successfully.`);
            }
        }

        return NextResponse.json({ success: true, messages: results });

    } catch (err: unknown) {
        console.error("Failed to seed dummy accounts:", err);
        return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
    }
}
