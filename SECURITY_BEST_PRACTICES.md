# Security Best Practices for Developers

This document outlines security best practices to follow when contributing to this project.

## Input Validation

### Always Use Zod Schemas
- Import validation schemas from `/src/lib/validation.ts`
- Use `safeValidateRequest()` for validation with error handling
- Example:
```typescript
import { createBookingSchema, safeValidateRequest } from "@/lib/validation";

const validation = safeValidateRequest(createBookingSchema, body);
if (!validation.success) {
  return NextResponse.json(
    { 
      error: "Invalid input data",
      details: validation.error.errors.map(e => e.message)
    },
    { status: 400 }
  );
}
const { boatId, startTime, endTime } = validation.data;
```

### Create New Schemas
When adding new endpoints, create appropriate Zod schemas:
- Use `.uuid()` for ID validation
- Use `.datetime()` for timestamp validation
- Use `.min()` and `.max()` for string length limits
- Use `.refine()` for cross-field validation

## Output Encoding

### HTML Context
- Use `sanitizeForEmail()` from `/src/lib/html-sanitize.ts` for email content
- Never insert user data directly into HTML without escaping
- Example:
```typescript
import { sanitizeForEmail } from './html-sanitize';
const safeName = sanitizeForEmail(userName);
```

### Never Use
- `dangerouslySetInnerHTML` in React components
- `innerHTML` in vanilla JavaScript
- `eval()` or `Function()` constructor
- `new Function()` with user input

## Authentication & Authorization

### Server-Side Checks
Always check authentication server-side:
```typescript
const supabase = await getSupabaseClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Admin Endpoints
Use `requireAdmin()` for admin-only endpoints:
```typescript
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  try {
    await requireAdmin(); // Throws if not admin
    // ... admin logic
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes('Unauthorized') ? 401 : 403 }
    );
  }
}
```

### Authorization Checks
Verify resource ownership before operations:
```typescript
// Get resource
const { data: resource } = await supabase
  .from('Booking')
  .select('*')
  .eq('id', id)
  .single();

// Verify ownership
if (resource.userId !== user.id) {
  return NextResponse.json(
    { error: "Forbidden" },
    { status: 403 }
  );
}
```

## Error Handling

### Don't Expose Internals
```typescript
// ❌ BAD - exposes internal details
catch (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}

// ✅ GOOD - generic error
catch (error) {
  console.error('Operation failed:', error); // Log server-side
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
```

### Handle Expected Errors
Return appropriate status codes:
- 400 - Bad Request (validation errors)
- 401 - Unauthorized (not authenticated)
- 403 - Forbidden (not authorized)
- 404 - Not Found
- 409 - Conflict (e.g., booking conflict)
- 500 - Internal Server Error

## Database Access

### Use Supabase Client
- Always use the Supabase client for database operations
- Never concatenate user input into queries
- Use parameterized queries through Supabase methods

```typescript
// ✅ GOOD - parameterized
const { data } = await supabase
  .from('Booking')
  .select('*')
  .eq('userId', userId);

// ❌ NEVER DO - vulnerable to SQL injection
const query = `SELECT * FROM Booking WHERE userId = '${userId}'`;
```

## Secrets Management

### Environment Variables
- Store all secrets in environment variables
- Never commit `.env` files
- Use `.env.example` for documentation
- Validate env vars at startup

### API Keys
- Prefix public keys with `NEXT_PUBLIC_`
- Keep private keys without the prefix
- Rotate keys regularly

## Dependencies

### Keep Updated
```bash
npm audit                    # Check vulnerabilities
npm audit fix               # Auto-fix when possible
npm audit fix --force       # Force update (test thoroughly)
```

### Review Before Adding
- Check package popularity and maintenance
- Review security advisories
- Consider alternatives for abandoned packages
- Use exact versions in production

## Rate Limiting (TODO)

When implementing rate limiting:
- Limit login attempts (3-5 per 15 minutes)
- Limit booking creation (10 per hour per user)
- Limit admin operations (100 per hour per admin)
- Use sliding window or token bucket algorithms

## HTTPS & Headers

### Always Use HTTPS
- Enforce HTTPS in production
- Use `Strict-Transport-Security` header (already configured)

### Security Headers
Security headers are configured in `next.config.ts`:
- `Strict-Transport-Security` - Force HTTPS
- `X-Content-Type-Options` - Prevent MIME sniffing
- `X-Frame-Options` - Prevent clickjacking
- `Referrer-Policy` - Control referrer information
- `Permissions-Policy` - Restrict browser features

## Logging & Monitoring

### What to Log
- ✅ Authentication events (login, logout)
- ✅ Authorization failures
- ✅ Admin actions
- ✅ Error details (server-side only)

### What NOT to Log
- ❌ Passwords or tokens
- ❌ Session IDs
- ❌ Credit card numbers
- ❌ Personal health information

## Code Review Checklist

Before submitting a PR, verify:
- [ ] All inputs are validated with Zod schemas
- [ ] User-provided data in HTML is escaped
- [ ] Authentication is checked server-side
- [ ] Authorization verifies resource ownership
- [ ] Errors don't expose sensitive information
- [ ] No hardcoded secrets
- [ ] Dependencies are up-to-date
- [ ] New endpoints have appropriate rate limiting plans

## Security Testing

### Manual Testing
- Test with invalid inputs (SQL injection, XSS payloads)
- Test authentication bypass attempts
- Test authorization with different user roles
- Test error cases and verify no information leakage

### Automated Testing
```bash
npm audit                    # Dependency vulnerabilities
npm run lint                # Code quality
npx tsc --noEmit           # Type checking
```

## Incident Response

If you discover a security vulnerability:
1. **DO NOT** create a public issue
2. Contact maintainers privately
3. Provide details:
   - Vulnerability description
   - Steps to reproduce
   - Impact assessment
   - Suggested fix (if any)
4. Allow time for fix before disclosure

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Zod Documentation](https://zod.dev/)

## Questions?

If you're unsure about a security decision, ask before implementing. Security is everyone's responsibility!
