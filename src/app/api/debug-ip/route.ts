/**
 * Temporary debug endpoint — shows the IP address the server detects from
 * your request. Use this to find the correct value to insert into
 * ManagementIpAllowlist. Remove this file once you've configured the allowlist.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getClientIp } from "@/lib/management";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  return NextResponse.json({
    detectedIp: ip,
    headers: {
      "x-forwarded-for": request.headers.get("x-forwarded-for"),
      "x-real-ip": request.headers.get("x-real-ip"),
      "cf-connecting-ip": request.headers.get("cf-connecting-ip"),
    },
    note: "Add 'detectedIp' to ManagementIpAllowlist, then delete this file.",
  });
}
