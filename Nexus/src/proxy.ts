import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Edge-compatible rate limiter for auth routes (5 req/min per IP)
const authRatelimit = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  ? new Ratelimit({
      redis: new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      }),
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: false,
    })
  : null;

const ROLE_HOME: Record<string, string> = {
    SuperAdmin: '/admin',
    GroupAdmin: '/owner',
    Guard: '/guard',
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // API routes and static assets handle their own auth
    if (pathname.startsWith('/api/') || pathname.startsWith('/guest')) {
        return NextResponse.next({ request })
    }

    // Rate-limit auth-related routes to prevent brute-force attacks
    if (authRatelimit && (pathname.startsWith('/auth') || (pathname === '/' && request.method === 'POST'))) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
        const { success } = await authRatelimit.limit(`auth_rate_${ip}`)
        if (!success) {
            return new NextResponse("Too Many Requests", { status: 429 })
        }
    }

    let response = NextResponse.next({
        request: { headers: request.headers },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    // Refresh session on every request (keeps tokens fresh)
    const { data: { user } } = await supabase.auth.getUser()

    // — Root (login page) — if already logged in, redirect to dashboard
    if (pathname === '/') {
        if (user) {
            const role = user.app_metadata?.user_role || ''
            const dest = ROLE_HOME[role as string]
            if (dest) return NextResponse.redirect(new URL(dest, request.url))
        }
        return response
    }

    // — auth/reset-password — always public
    if (pathname.startsWith('/auth/')) {
        return response
    }

    // — Protected routes — unauthenticated users go to login
    if (!user) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // — Fetch role from the custom JWT claims (zero database hits)
    const role = (user.app_metadata?.user_role as string) || ''

    // Block cross-role access (e.g., Guard trying to reach /admin)
    if (pathname.startsWith('/admin') && role !== 'SuperAdmin') {
        return NextResponse.redirect(new URL(ROLE_HOME[role] || '/', request.url))
    }
    if (pathname.startsWith('/owner') && role !== 'GroupAdmin' && role !== 'SuperAdmin') {
        return NextResponse.redirect(new URL(ROLE_HOME[role] || '/', request.url))
    }
    if (pathname.startsWith('/guard') && role !== 'Guard' && role !== 'SuperAdmin') {
        return NextResponse.redirect(new URL(ROLE_HOME[role] || '/', request.url))
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|logo|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
