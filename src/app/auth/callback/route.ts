import { getSupabaseClient, getSupabaseAdminClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

/**
 * Validates if a URL is safe for redirection
 * Prevents open redirect vulnerabilities
 */
function isSafeRedirectUrl(url: string, origin: string): boolean {
  try {
    const redirectUrl = new URL(url, origin);
    const originUrl = new URL(origin);
    
    // Only allow same-origin redirects
    return redirectUrl.origin === originUrl.origin;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  
  // Get the actual host from forwarded headers (for proxy/load balancers like Render)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  
  // Construct the proper origin URL
  const origin = forwardedHost && forwardedProto
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  if (code) {
    const supabase = await getSupabaseClient();
    const { data: sessionData } = await supabase.auth.exchangeCodeForSession(code);

    // Ensure the user exists in the public User table.
    // The DB trigger handles new sign-ups, but users created before the trigger
    // was installed may be missing. Upsert defensively on every sign-in.
    if (sessionData?.user) {
      const { user } = sessionData;

      // Detect new accounts: created_at and last_sign_in_at are within 5 seconds
      // of each other only on the very first sign-in.
      const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
      const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
      const isNewUser = Math.abs(createdAt - lastSignIn) < 5000;

      try {
        const adminClient = getSupabaseAdminClient();
        await adminClient.from('User').upsert(
          {
            id: user.id,
            email: user.email ?? '',
            name:
              user.user_metadata?.full_name ??
              user.user_metadata?.name ??
              user.email?.split('@')[0] ??
              'Unknown',
            image: user.user_metadata?.avatar_url ?? null,
            emailVerified: user.email_confirmed_at ?? null,
            updatedAt: new Date().toISOString(),
          },
          { onConflict: 'id', ignoreDuplicates: false }
        );

        // Record login event for platform analytics (recorded for all users,
        // but system owner logins are excluded from dashboard metrics at query time)
        try {
          await adminClient.from('LoginEvent').insert({ userId: user.id });
        } catch (loginEventError) {
          console.error('LoginEvent insert error:', loginEventError);
        }
      } catch (syncError) {
        // Non-fatal: log and continue so the user can still sign in.
        console.error('User sync error:', syncError);
      }

      // Send new users through the welcome page so a GA sign_up event fires
      // before they reach the main app.
      if (isNewUser) {
        return NextResponse.redirect(`${origin}/auth/welcome`);
      }

      // Send returning users through the signed-in page so a GA login event fires.
      const next = requestUrl.searchParams.get("next");
      let destinationPath = '/boats';
      if (next && isSafeRedirectUrl(next, origin)) {
        const nextUrl = new URL(next, origin);
        destinationPath = nextUrl.pathname + nextUrl.search;
      }
      const signedInUrl = new URL('/auth/signed-in', origin);
      signedInUrl.searchParams.set('next', destinationPath);
      return NextResponse.redirect(signedInUrl.toString());
    }
  }

  // Check for next parameter and validate it
  const next = requestUrl.searchParams.get("next");
  let redirectPath = '/boats'; // Default safe path
  
  if (next && isSafeRedirectUrl(next, origin)) {
    // Extract just the pathname to ensure it's a relative URL
    const nextUrl = new URL(next, origin);
    redirectPath = nextUrl.pathname + nextUrl.search;
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}${redirectPath}`);
}
