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
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "";
        // Only enforce CSRF if we have a site URL configured
        if (siteUrl) {
            const normalizedSite = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
            const siteHost = new URL(normalizedSite).hostname;
            const originHost = new URL(origin).hostname;
            if (siteHost !== originHost) {
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
