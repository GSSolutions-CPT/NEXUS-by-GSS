import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET: If someone navigates here directly, redirect to login
export async function GET(request: Request) {
    return NextResponse.redirect(new URL('/', request.url), { status: 302 })
}

export async function POST(request: Request) {
    // CSRF protection: verify the request originates from our own domain
    const origin = request.headers.get("origin");

    if (origin && origin !== "null") {
        const host = request.headers.get("host"); // The hostname the user is currently visiting
        if (host) {
            const originHost = new URL(origin).host; // .host includes port if present, matching the Host header format
            if (host !== originHost) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }
    }

    const supabase = await createClient()
    await supabase.auth.signOut()

    return NextResponse.redirect(new URL('/', request.url), {
        status: 302,
    })
}
