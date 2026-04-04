import fs from 'fs';
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

// Basic CSV parser
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  
  // Find start of data
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('"Access Group Name"') || lines[i].includes('Access Group Name')) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) {
    throw new Error('Could not find CSV headers');
  }

  const dataLines = lines.slice(headerIdx + 1);
  const records = [];

  for (const line of dataLines) {
    if(!line.trim()) continue;
    
    // Split by commas, handling quoted values correctly
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if(values.length < 13) continue;

    records.push({
      name: values[0] || null,
      access_pattern_name: values[1] || null,
      area_name: values[2] || null,
      start_time: values[3] || null,
      duration: values[4] || null,
      mon: values[5]?.toLowerCase() === 'yes',
      tue: values[6]?.toLowerCase() === 'yes',
      wed: values[7]?.toLowerCase() === 'yes',
      thu: values[8]?.toLowerCase() === 'yes',
      fri: values[9]?.toLowerCase() === 'yes',
      sat: values[10]?.toLowerCase() === 'yes',
      sun: values[11]?.toLowerCase() === 'yes',
      hol: values[12]?.toLowerCase() === 'yes',
      max_capacity: values[13] || null,
    });
  }
  return records;
}

async function run() {
  console.log("Parsing CSV...");
  const csvPath = path.resolve(__dirname, '../../Access Group Rpt.csv');
  try {
    const records = parseCSV(csvPath);
    console.log(`Found ${records.length} access groups.`);

    for (const record of records) {
      process.stdout.write(`Upserting: ${record.name}... `);
      const { error } = await supabase.from('access_groups').upsert(record, { 
        onConflict: 'name',
        ignoreDuplicates: false 
      });
      
      if (error) {
        console.log(`❌ Error: ${error.message}`);
      } else {
        console.log(`✅ Success`);
      }
    }
    console.log("\nImport complete.");
  } catch (err) {
    console.error("Failed to parse or import:", err);
  }
}

run();
