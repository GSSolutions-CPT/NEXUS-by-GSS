const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres:llW6q88vwkKdGMDZ@db.fgpwdseanjsviyonyovc.supabase.co:5432/postgres';
const sqlFilePath = process.argv[2] || 'C:\\Users\\User\\OneDrive\\Desktop\\V5API\\supabase_schema.sql';

const client = new Client({
  connectionString: connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL...');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    await client.query(sql);
    console.log('Schema executed successfully!');
  } catch (error) {
    console.error('Error executing schema:', error);
  } finally {
    await client.end();
  }
}

run();
