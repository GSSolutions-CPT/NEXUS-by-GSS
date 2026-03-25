import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    // CSRF protection: verify the request originates from our own domain
    const origin = request.headers.get("origin");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "";
    const normalizedSite = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;

    if (origin && !normalizedSite.includes(origin) && origin !== "null") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createClient()
    await supabase.auth.signOut()

    return NextResponse.redirect(new URL('/', request.url), {
        status: 302,
    })
}
