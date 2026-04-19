import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// POST /api/guest/[id]/redact
// Redacts the user's personal information (PII) to comply with the POPI Act's Data Subject Participation rights,
// while leaving the anonymous audit trail intact. Instantly revokes the pass.
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return NextResponse.json({ error: "Invalid pass ID." }, { status: 400 });
        }

        // Anonymize the PII fields.
        // Sets name to [REDACTED], nullifies contact info, and revokes access.
        const { error: updateErr } = await supabase
            .from("visitors")
            .update({
                first_name: "[REDACTED]",
                last_name: "[REDACTED]",
                phone: null,
                email: null,
                status: "Revoked"
            })
            .eq("id", id);

        if (updateErr) {
            console.error("Failed to redact visitor:", updateErr);
            return NextResponse.json({ error: "Failed to redact personal data." }, { status: 500 });
        }

        // Add a note to audit logs internally showing the user self-redacted
        await supabase.from("audit_logs").insert([{
            visitor_id: id,
            action: "Data Subject requested PII Redaction. Pass revoked."
            // unit_id cannot be pulled here securely without an extra query, but keeping log tied to visitor_id is enough
        }]);

        return NextResponse.json({ success: true, message: "Personal data successfully redacted." });

    } catch (err) {
        console.error("Critical error in POST /api/guest/[id]/redact:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
