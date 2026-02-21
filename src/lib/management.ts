import { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "./supabase";

/**
 * Extract the real client IP from a Next.js request.
 * Respects x-forwarded-for (set by proxies/CDNs) and falls back to
 * the remote address headers added by Next.js.
 *
 * NOTE: x-forwarded-for can be spoofed unless the deployment sits behind
 * a trusted reverse proxy or CDN (e.g. nginx, Cloudflare) that strips or
 * overrides client-supplied values.  Ensure this is the case in production.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

/**
 * Check whether the given IP is on the management IP allowlist.
 *
 * If the allowlist table is empty the function returns true only when
 * the caller supplies the MANAGEMENT_BYPASS_KEY env var as a bearer
 * token (useful for the very first login / disaster recovery).
 */
export async function isAllowedManagementIp(
  ip: string,
  bypassKey?: string | null
): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("ManagementIpAllowlist")
      .select("ip");

    if (error) {
      console.error("ManagementIpAllowlist fetch error:", error);
      // Fail closed on DB errors — don't let anyone through
      return false;
    }

    const allowedIps: string[] = (data ?? []).map((row: any) => row.ip as string);

    // If the allowlist is empty, fall back to bypass key check
    if (allowedIps.length === 0) {
      const envKey = process.env.MANAGEMENT_BYPASS_KEY;
      if (!envKey) return false;
      return bypassKey === envKey;
    }

    return allowedIps.includes(ip);
  } catch (err) {
    console.error("isAllowedManagementIp error:", err);
    return false;
  }
}

/**
 * Convenience wrapper that extracts the IP from a request and checks it.
 * Also checks the Authorization: Bearer <MANAGEMENT_BYPASS_KEY> header so
 * that the initial setup request (before any IP is added) can still work.
 */
export async function checkManagementAccess(
  request: NextRequest
): Promise<boolean> {
  const ip = getClientIp(request);
  const authHeader = request.headers.get("authorization") ?? "";
  const bearerKey = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  return isAllowedManagementIp(ip, bearerKey);
}
