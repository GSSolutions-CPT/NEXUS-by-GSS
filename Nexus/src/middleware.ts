import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Verify session
    const { data: { user } } = await supabase.auth.getUser()

    // Determine path
    const url = request.nextUrl.clone()
    const path = url.pathname

    // We only want to protect /admin, /owner, and /guard paths (excluding auth/login pages inside those, if any)
    const isAdminRoute = path.startsWith('/admin')
    const isOwnerRoute = path.startsWith('/owner')
    const isGuardRoute = path.startsWith('/guard')

    if (!isAdminRoute && !isOwnerRoute && !isGuardRoute) {
        return supabaseResponse
    }

    // Unauthenticated Redirects
    if (!user) {
        if (isAdminRoute) url.pathname = '/login/admin'
        else if (isOwnerRoute) url.pathname = '/login/owner'
        else if (isGuardRoute) url.pathname = '/login/guard'
        
        return NextResponse.redirect(url)
    }

    // Authenticated Role Checks
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const role = profile?.role

    if (isAdminRoute && role !== 'SuperAdmin') {
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    if (isOwnerRoute && role !== 'GroupAdmin' && role !== 'SuperAdmin') {
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    if (isGuardRoute && role !== 'Guard' && role !== 'SuperAdmin') {
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
