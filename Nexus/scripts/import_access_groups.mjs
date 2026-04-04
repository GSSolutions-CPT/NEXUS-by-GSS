import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '../.env.local' });

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
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  
  // Find start of data
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('"Access Group Name"')) {
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
    
    // Split by commas taking into account quotes
    // This matches either quoted items or non-comma items
    const matches = line.match(/(?:\"([^\"]*)\")|([^\,]+)/g);
    if (!matches) continue;
    
    const values = matches.map(v => {
      // Remove leading/trailing quotes if they exist
      return v.replace(/^"|"$/g, '').trim();
    });

    if(values.length < 14) continue;

    records.push({
      name: values[0] || null,
      access_pattern_name: values[1] || null,
      area_name: values[2] || null,
      start_time: values[3] || null,
      duration: values[4] || null,
      mon: values[5] === 'Yes',
      tue: values[6] === 'Yes',
      wed: values[7] === 'Yes',
      thu: values[8] === 'Yes',
      fri: values[9] === 'Yes',
      sat: values[10] === 'Yes',
      sun: values[11] === 'Yes',
      hol: values[12] === 'Yes',
      max_capacity: values[13] || null,
    });
  }
  return records;
}

async function run() {
  console.log("Parsing CSV...");
  const csvPath = path.resolve('../../Access Group Rpt.csv');
  try {
    const records = parseCSV(csvPath);
    console.log(`Found ${records.length} access groups.`);

    for (const record of records) {
      console.log(`Upserting: ${record.name}`);
      const { error } = await supabase.from('access_groups').upsert(record, { onConflict: 'name' });
      if (error) {
        console.error(`Error upserting ${record.name}:`, error.message);
      } else {
        console.log(`✅ Success: ${record.name}`);
      }
    }
    console.log("Import complete.");
  } catch (err) {
    console.error("Failed to parse or import:", err);
  }
}

run();
