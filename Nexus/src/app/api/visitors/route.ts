import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { visitorSchema } from '@/lib/validations';

// Initialize Redis and Ratelimit outside the request handler for better performance
const redisClient = (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    })
    : null;

const ratelimit = redisClient
    ? new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        analytics: false,
    })
    : null;

// GET /api/visitors — Fetch visitors for the logged-in owner's unit
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const unitId = user.app_metadata?.user_unit_id;

        if (!unitId) {
            return NextResponse.json({ error: "No unit associated with this account." }, { status: 400 });
        }

        const { data: visitors, error: fetchErr } = await supabase
            .from("visitors")
            .select("id, first_name, last_name, phone, start_time, expiry_time, needs_parking, status, pin_code")
            .eq("unit_id", unitId)
            .order("created_at", { ascending: false });

        if (fetchErr) {
            console.error("Failed to fetch visitors:", fetchErr);
            return NextResponse.json({ error: "Failed to fetch visitors." }, { status: 500 });
        }

        return NextResponse.json({ visitors: visitors || [] });

    } catch (err) {
        console.error("Critical error in GET /api/visitors:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/visitors — Invite a new visitor
export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
            console.warn("Unauthorized API access attempt");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        
        const parseResult = visitorSchema.safeParse(body);
        if (!parseResult.success) {
            console.warn(`[${user.id}] Validation Error:`, parseResult.error.flatten());
            return NextResponse.json({ error: "Invalid input data", details: parseResult.error.flatten() }, { status: 400 });
        }
        
        const { firstName, lastName, phone, validFrom, validUntil, needsParking, accessWindows } = parseResult.data;

        // Compute overall start_time and expiry_time from access windows (or use legacy fields)
        let computedStart: string;
        let computedExpiry: string;

        if (accessWindows && Array.isArray(accessWindows) && accessWindows.length > 0) {
            // Sort windows by date, derive earliest start and latest end
            const sorted = [...accessWindows].sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date));
            computedStart = new Date(`${sorted[0].date}T${sorted[0].from}:00`).toISOString();
            const last = sorted[sorted.length - 1];
            computedExpiry = new Date(`${last.date}T${last.to}:00`).toISOString();
        } else if (validFrom && validUntil) {
            computedStart = new Date(validFrom).toISOString();
            computedExpiry = new Date(validUntil).toISOString();
        } else {
            return NextResponse.json({ error: "Either access windows or valid dates are required." }, { status: 400 });
        }

        const unitId = user.app_metadata?.user_unit_id;

        if (!unitId) {
            console.error(`[${user.id}] Could not determine unit association from app_metadata.`);
            return NextResponse.json({ error: "Could not determine unit association." }, { status: 400 });
        }

        // Rate Limiting (10 requests per minute per unit)
        if (!ratelimit) {
            console.error("CRITICAL: Redis KV credentials missing. Rate limiting is disabled.");
            if (process.env.NODE_ENV === 'production') {
                return NextResponse.json({ error: "Internal Server Configuration Error" }, { status: 500 });
            }
        } else {
            try {
                const { success: limitSuccess } = await ratelimit.limit(`visitors_post_${unitId}`);
                if (!limitSuccess) {
                    console.warn(`[${user.id}] Rate limit exceeded for unit ${unitId}`);
                    return NextResponse.json({ error: "Rate limit exceeded. Please wait 1 minute." }, { status: 429 });
                }
            } catch (err) {
                console.error("Rate limiting error — failing closed in production:", err);
                if (process.env.NODE_ENV === 'production') {
                    return NextResponse.json({ error: "Internal Server Configuration Error" }, { status: 500 });
                }
            }
        }

        // Validate access groups exist (non-blocking)
        try {
            const { data: unitMapping } = await supabase
                .from("unit_access_mapping")
                .select("access_group_id")
                .eq("unit_id", unitId);

            if (!unitMapping || unitMapping.length === 0) {
                console.warn(`[${user.id}] No access groups mapped for unit ${unitId}.`);
            }
        } catch (err) {
            console.error(`[${user.id}] Failed to validate unit mapping.`, err);
        }

        let generatedPin = "";
        let insertErr = null;
        let insertedId: string | null = null;
        let success = false;
        let retries = 0;

        while (retries < 3 && !success) {
            generatedPin = randomInt(10000, 100000).toString();

            const visitorPayload: Record<string, unknown> = {
                unit_id: unitId,
                first_name: firstName,
                last_name: lastName,
                phone: phone,
                pin_code: generatedPin,
                start_time: computedStart,
                expiry_time: computedExpiry,
                needs_parking: needsParking,
                status: 'Pending',
            };

            // Only include access_windows if provided
            if (accessWindows && Array.isArray(accessWindows) && accessWindows.length > 0) {
                visitorPayload.access_windows = accessWindows;
            }

            const result = await supabase.from("visitors").insert([visitorPayload]).select("id").single();
            insertErr = result.error;

            if (!insertErr && result.data) {
                success = true;
                insertedId = result.data.id;
            } else if (insertErr?.code === '23505') {
                retries++;
                console.warn(`[${user.id}] PIN collision detected. Retrying... (${retries}/3)`);
            } else {
                break; // Non-collision database error
            }
        }

        if (!success || !insertedId) {
            console.error(`[${user.id}] Supabase Insert Error:`, insertErr);
            return NextResponse.json({ error: "Database failed to save visitor after retries." }, { status: 500 });
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
        const guestLink = siteUrl ? `${siteUrl}/guest/${insertedId}` : `/guest/${insertedId}`;

        return NextResponse.json({
            success: true,
            message: "Visitor invited. Awaiting hardware synchronization.",
            pinCode: generatedPin,
            visitorId: insertedId,
            guestLink: guestLink,
        });

    } catch (err: unknown) {
        console.error("Critical API Route Error in /api/visitors:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/visitors?id=xxx — Revoke a visitor pass
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const visitorId = searchParams.get("id");
        if (!visitorId) return NextResponse.json({ error: "Visitor ID required." }, { status: 400 });

        // Ownership check — prevent IDOR attacks
        const unitId = user.app_metadata?.user_unit_id;

        const { data: visitor } = await supabase
            .from("visitors").select("unit_id").eq("id", visitorId).single();

        if (!visitor || visitor.unit_id !== unitId) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 });
        }

        const { error: updateErr } = await supabase
            .from("visitors")
            .update({ status: "Revoked" })
            .eq("id", visitorId);

        if (updateErr) {
            return NextResponse.json({ error: "Failed to revoke visitor." }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error("Critical error in DELETE /api/visitors:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
