import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { resolveLocale, LOCALE_COOKIE } from '@/lib/locales'
import { checkManagementAccess } from '@/lib/management'

// Paths that are accessible without belonging to a club
const ONBOARDING_EXEMPT_PATHS = ['/onboarding', '/auth', '/api/clubs', '/api/stripe', '/management', '/api/management'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Management IP gate ──────────────────────────────────────────────
  // /management pages and /api/management routes are restricted to
  // IP addresses in the ManagementIpAllowlist table (or bypass key).
  if (pathname.startsWith('/management') || pathname.startsWith('/api/management')) {
    const { getClientIp } = await import('@/lib/management');
    const detectedIp = getClientIp(request);
    console.log('[management-gate] Detected IP:', detectedIp);
    console.log('[management-gate] x-forwarded-for:', request.headers.get('x-forwarded-for'));
    console.log('[management-gate] x-real-ip:', request.headers.get('x-real-ip'));
    console.log('[management-gate] cf-connecting-ip:', request.headers.get('cf-connecting-ip'));

    const allowed = await checkManagementAccess(request);
    if (!allowed) {
      // Return 403 for API calls, redirect to a simple error page for browser navigation
      if (pathname.startsWith('/api/management')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }

  // ── Locale detection ───────────────────────────────────────────────
  // Always re-detect from Accept-Language so that a browser language
  // change takes effect immediately. The cookie is written on every
  // request so server components and API routes can read it cheaply
  // without inspecting the header themselves.
  const detectedLocale = resolveLocale(request.headers.get("accept-language"));

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Write (or refresh) the locale cookie so server components / API
  // routes can read it via cookies(). Short max-age so it tracks the
  // browser language closely without requiring a large payload.
  response.cookies.set(LOCALE_COOKIE, detectedLocale, {
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours – re-detected on next visit
    sameSite: "lax",
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session and check user status
  const { data: { user } } = await supabase.auth.getUser()

  // If user is logged in, check their status and club membership
  if (user) {
    try {
      const { data: userData } = await supabase
        .from('User')
        .select('isActive, lastLogin, clubId')
        .eq('id', user.id)
        .single()

      // Update last login timestamp
      if (userData) {
        await supabase
          .from('User')
          .update({ lastLogin: new Date().toISOString() })
          .eq('id', user.id)
      }

      // If user is inactive, sign them out and redirect to sign-in
      if (userData && userData.isActive === false) {
        await supabase.auth.signOut()
        const redirectUrl = new URL('/auth/signin', request.url)
        redirectUrl.searchParams.set('error', 'account_disabled')
        return NextResponse.redirect(redirectUrl)
      }

      // If user has no club and is not already on an exempt path, redirect to onboarding
      const isExemptPath = ONBOARDING_EXEMPT_PATHS.some((p) => pathname.startsWith(p));
      if (userData && !userData.clubId && !isExemptPath) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    } catch (error) {
      // Log error but don't expose to user
      console.error('Error checking user status:', error)
      // Continue with request - don't block user on transient errors
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/stripe (Stripe webhooks — no session needed, must not be redirected)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/stripe|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
