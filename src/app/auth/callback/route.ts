import { getSupabaseClient } from "@/lib/supabase";
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
    await supabase.auth.exchangeCodeForSession(code);
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
