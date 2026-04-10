const { Client } = require('pg');

const connectionString = 'postgresql://postgres:llW6q88vwkKdGMDZ@db.fgpwdseanjsviyonyovc.supabase.co:5432/postgres';

const client = new Client({
  connectionString: connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL...');
    await client.query("ALTER FUNCTION process_hardware_queue SET search_path = '';");
    console.log('SQL function updated executed successfully!');
    
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

    console.log('Table altered successfully.');
  } catch (error) {
    console.error('Error executing schema:', error);
  } finally {
    await client.end();
  }
}

run();
