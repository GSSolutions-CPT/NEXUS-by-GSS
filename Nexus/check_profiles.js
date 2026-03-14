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

async function check() {
    const { data, error } = await supabaseAdmin.from('profiles').select('id, role');
    if (error) console.error("Error fetching profiles:", error);
    console.log("Profiles:", data);
    
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    console.log("Auth Users:", authUsers.users.map(u => ({ email: u.email, id: u.id })));
}

check();
