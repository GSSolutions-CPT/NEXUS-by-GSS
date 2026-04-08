import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';

interface CsvRow {
    firstName: string;
    lastName: string;
    phone: string;
    validFrom: string;
    validUntil: string;
}

// Parse a CSV string into rows, skipping header
function parseCsv(text: string): CsvRow[] {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return []; // header only or empty

    // Skip the header row
    const rows = lines.slice(1);
    return rows.map(line => {
        // Basic CSV split — handles simple comma-separated values
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        return {
            firstName: cols[0] || '',
            lastName: cols[1] || '',
            phone: cols[2] || '',
            validFrom: cols[3] || '',
            validUntil: cols[4] || '',
        };
    }).filter(r => r.firstName && r.lastName);
}

// POST /api/visitors/bulk — Bulk invite visitors via CSV upload
export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile, error: profErr } = await supabase
            .from("profiles")
            .select("unit_id, role")
            .eq("id", user.id)
            .single();

        if (profErr || !profile?.unit_id) {
            return NextResponse.json({ error: "No unit associated with this account." }, { status: 400 });
        }

        if (!["GroupAdmin", "SuperAdmin"].includes(profile.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Parse multipart form — the CSV file is in 'file' field
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: "No CSV file provided. Include a 'file' field." }, { status: 400 });
        }

        if (!file.name.toLowerCase().endsWith('.csv')) {
            return NextResponse.json({ error: "Only .csv files are supported." }, { status: 400 });
        }

        const MAX_SIZE = 500 * 1024; // 500 KB
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: "File too large. Maximum size is 500 KB." }, { status: 400 });
        }

        const csvText = await file.text();
        const rows = parseCsv(csvText);

        if (rows.length === 0) {
            return NextResponse.json({ error: "CSV contains no valid rows. Expected columns: FirstName, LastName, Phone, ValidFrom, ValidUntil" }, { status: 400 });
        }

        if (rows.length > 100) {
            return NextResponse.json({ error: "Maximum 100 visitors per bulk upload." }, { status: 400 });
        }

        const results: { row: number; name: string; success: boolean; error?: string }[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; // +2 because row 1 is header
            const name = `${row.firstName} ${row.lastName}`;

            // Basic validation
            if (!row.validFrom || !row.validUntil) {
                results.push({ row: rowNum, name, success: false, error: "Missing ValidFrom or ValidUntil date." });
                continue;
            }

            const startDate = new Date(row.validFrom);
            const endDate = new Date(row.validUntil);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                results.push({ row: rowNum, name, success: false, error: "Invalid date format. Use YYYY-MM-DD." });
                continue;
            }

            if (endDate <= startDate) {
                results.push({ row: rowNum, name, success: false, error: "ValidUntil must be after ValidFrom." });
                continue;
            }

            // Generate a unique PIN with collision retry
            let pin = "";
            let success = false;
            for (let attempt = 0; attempt < 3; attempt++) {
                pin = randomInt(10000, 100000).toString();
                const { error: insertErr } = await supabase.from("visitors").insert({
                    unit_id: profile.unit_id,
                    first_name: row.firstName,
                    last_name: row.lastName,
                    phone: row.phone || null,
                    pin_code: pin,
                    start_time: startDate.toISOString(),
                    expiry_time: endDate.toISOString(),
                    needs_parking: false,
                    status: 'Pending',
                });

                if (!insertErr) { success = true; break; }
                if (insertErr.code !== '23505') {
                    results.push({ row: rowNum, name, success: false, error: insertErr.message });
                    break;
                }
            }

            if (success) {
                results.push({ row: rowNum, name, success: true });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;

        return NextResponse.json({
            success: true,
            message: `${successCount} visitor(s) created, ${errorCount} failed.`,
            results,
        });

    } catch (err) {
        console.error("Critical error in POST /api/visitors/bulk:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
