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
    const { data: profiles, error: pError } = await supabaseAdmin.from('profiles').select('id, role, first_name, last_name');
    if (pError) console.error("Profiles Error:", pError);
    
    const { data: auth, error: aError } = await supabaseAdmin.auth.admin.listUsers();
    if (aError) console.error("Auth Error:", aError);

    const merged = (profiles || []).map(p => {
        const authUser = auth.users.find(u => u.id === p.id);
        return {
            email: authUser?.email,
            role: p.role,
            full_name: `${p.first_name || ''} ${p.last_name || ''}`.trim()
        };
    });

    console.log(JSON.stringify(merged, null, 2));
}

check();
