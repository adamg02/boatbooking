import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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

  // If user is logged in, check if they're active
  if (user) {
    const { data: userData } = await supabase
      .from('User')
      .select('isActive, lastLogin')
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
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
