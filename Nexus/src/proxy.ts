import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ── Role → allowed path prefixes ─────────────────────────────────────────────
const ROLE_PATHS: Record<string, string> = {
    SuperAdmin: "/admin",
    GroupAdmin: "/owner",
    Guard: "/guard",
};

// Paths that are public (no auth required)
const PUBLIC_PATHS = ["/", "/auth", "/guest", "/privacy", "/terms"];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public paths and all API routes (API routes do their own auth)
    if (
        pathname.startsWith("/api/") ||
        pathname.startsWith("/_next/") ||
        pathname.startsWith("/favicon") ||
        pathname.startsWith("/logo") ||
        pathname.startsWith("/icons") ||
        pathname.startsWith("/manifest") ||
        PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
    ) {
        return NextResponse.next();
    }

    // Build a Supabase client that reads/writes cookies on the request
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    // We're only reading, but the client needs this callback
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                    });
                },
            },
        }
    );

    // Get the current session
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Not authenticated → redirect to login
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/";
        return NextResponse.redirect(loginUrl);
    }

    // Fetch the user's role from profiles
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const role = profile?.role as string | undefined;

    if (!role || !ROLE_PATHS[role]) {
        // Unknown or missing role → send back to login
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/";
        return NextResponse.redirect(loginUrl);
    }

    const allowedPrefix = ROLE_PATHS[role];

    // Check if the user is trying to access a path they're not allowed to
    const isAdminPath = pathname.startsWith("/admin");
    const isOwnerPath = pathname.startsWith("/owner");
    const isGuardPath = pathname.startsWith("/guard");

    const accessingProtectedPath = isAdminPath || isOwnerPath || isGuardPath;

    if (accessingProtectedPath && !pathname.startsWith(allowedPrefix)) {
        // Wrong role for this path → redirect to their own dashboard
        const correctUrl = request.nextUrl.clone();
        correctUrl.pathname = allowedPrefix;
        return NextResponse.redirect(correctUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths EXCEPT for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
