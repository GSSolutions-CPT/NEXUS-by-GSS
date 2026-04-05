import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabaseAdmin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function setup() {
    const email = 'owner@nexustest.co.za';
    const password = 'Nexus@Password123';

    console.log(`Setting up test user: ${email}`);

    // Update user password in Auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) return console.error("Auth Error:", userError);

    const user = userData.users.find(u => u.email === email);
    if (!user) return console.error("User not found in Auth:", email);

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password });
    if (updateError) return console.error("Update Auth Error:", updateError);

    // Update role in profiles
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'SuperAdmin' })
        .eq('id', user.id);

    if (profileError) return console.error("Profile Error:", profileError);

    console.log(`Success! User ${email} is now a SuperAdmin with password ${password}`);
}

setup();
