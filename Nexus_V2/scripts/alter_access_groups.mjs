import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Adding missing columns to access_groups table...");

  // We'll use supabase-js to check current columns by selecting
  const { data, error } = await supabase.from('access_groups').select('*').limit(1);
  
  if (error) {
    console.error("Error querying table:", error.message);
    process.exit(1);
  }
  
  const existingCols = data.length > 0 ? Object.keys(data[0]) : [];
  console.log("Current columns:", existingCols);

  // Columns we need
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

  const missingCols = Object.entries(neededColumns).filter(
    ([col]) => !existingCols.includes(col)
  );

  if (missingCols.length === 0) {
    console.log("✅ All columns already exist!");
    return;
  }

  console.log(`Missing ${missingCols.length} columns:`, missingCols.map(c => c[0]));
  console.log("\n⚠️  You need to run the following SQL in the Supabase SQL Editor:\n");
  
  for (const [col, type] of missingCols) {
    console.log(`ALTER TABLE public.access_groups ADD COLUMN IF NOT EXISTS ${col} ${type};`);
  }
  
  console.log("\nAfter running the SQL above, re-run the import script.");
}

run();
