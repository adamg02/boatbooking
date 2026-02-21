/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // Build Content-Security-Policy
    // Note: 'unsafe-inline' and 'unsafe-eval' are required for Next.js SSR + Tailwind.
    // Nonce-based CSP would remove these but requires middleware injection.
    const csp = [
      "default-src 'self'",
      // Next.js hydration + GA consent mode script requires unsafe-inline/unsafe-eval
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      // Allow images from HTTPS (user-supplied boat images) and data URIs
      "img-src 'self' data: blob: https:",
      // API/WebSocket connections to Supabase and analytics
      "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://api.stripe.com",
      "font-src 'self' data:",
      // Stripe payment element uses an iframe
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      // Only allow forms to submit to self (blocks reflected XSS via form action)
      "form-action 'self'",
      // Prevent this app from being embedded in foreign frames (belt-and-braces with X-Frame-Options)
      "frame-ancestors 'self'",
      // Block all plugins (Flash etc.)
      "object-src 'none'",
      // Upgrade any remaining http: sub-resources to https:
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },
};

export default nextConfig;
