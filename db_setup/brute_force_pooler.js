const { Client } = require('pg');

const regions = [
  'af-south-1', // Prioritize
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'eu-central-2',
  'eu-south-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-southeast-2',
  'ap-south-1',
  'sa-east-1',
  'ca-central-1'
];

async function tryConnect() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    // Using Supavisor pooler connection string format
    const connectionString = `postgresql://postgres.fgpwdseanjsviyonyovc:llW6q88vwkKdGMDZ@${host}:6543/postgres`;
    
    console.log(`Trying region ${region}...`);
    const client = new Client({
      connectionString,
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      console.log(`✅ Successfully connected to Supabase in region: ${region}`);
      
      // Execute the required SQL commands
      await client.query("ALTER FUNCTION process_hardware_queue SET search_path = '';");
      console.log('✅ process_hardware_queue fix applied.');
      
      const neededColumns = {
        access_pattern_name: 'TEXT',
        area_name: 'TEXT',
        start_time: 'TEXT',
        duration: 'TEXT',
        mon: 'BOOLEAN DEFAULT false',
        tue: 'BOOLEAN DEFAULT false',
        wed: 'BOOLEAN DEFAULT false',
        thu: 'BOOLEAN DEFAULT false',
        fri: 'BOOLEAN DEFAULT false',
        sat: 'BOOLEAN DEFAULT false',
        sun: 'BOOLEAN DEFAULT false',
        hol: 'BOOLEAN DEFAULT false',
        max_capacity: 'TEXT',
      };

      for (const [col, type] of Object.entries(neededColumns)) {
        await client.query(`ALTER TABLE public.access_groups ADD COLUMN IF NOT EXISTS ${col} ${type};`);
      }
      console.log('✅ access_groups table columns added.');

      await client.end();
      process.exit(0);
    } catch (e) {
      console.log(`❌ Failed for ${region}: ${e.message}`);
      await client.end().catch(()=>{}).finally(()=>{});
    }
  }
  console.log("Could not connect to any pooler region.");
}

tryConnect();
