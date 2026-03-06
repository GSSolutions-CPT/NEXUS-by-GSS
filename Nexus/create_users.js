const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fgpwdseanjsviyonyovc.supabase.co';
const supabaseKey = 'sb_publishable_Mu9n25pVTRrXrG830e9LDg_Wob22cYf';
const supabase = createClient(supabaseUrl, supabaseKey);

const usersToCreate = [
    { email: 'superadmin@gssolutions.co.za', password: 'Password123!', role: 'superadmin' },
    { email: 'admin@gssolutions.co.za', password: 'Password123!', role: 'admin' },
    { email: 'guard@gssolutions.co.za', password: 'Password123!', role: 'guard' }
];

async function main() {
    for (const user of usersToCreate) {
        const { data, error } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
        });

        if (error) {
            console.error(`Error creating ${user.email}:`, error.message);
        } else {
            console.log(`Created ${user.email} with ID: ${data.user.id}`);
        }
    }
}

main();
