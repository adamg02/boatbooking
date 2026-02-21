import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { getClientIp } from "@/lib/management";
import { z } from "zod";

const addIpSchema = z.object({
  ip: z
    .string()
    .min(1, "IP address is required")
    .refine(
      (val) => {
        // IPv4: each octet must be 0-255
        const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
        const m = val.match(ipv4);
        if (m) {
          return m.slice(1).every((octet) => parseInt(octet, 10) <= 255);
        }
        // IPv6: basic format check (groups of hex digits separated by colons,
        // with at most one :: abbreviation)
        const ipv6 = /^([\da-fA-F]{0,4}:){2,7}[\da-fA-F]{0,4}$|^::[\da-fA-F]{0,4}$|^[\da-fA-F]{0,4}::$/;
        return ipv6.test(val);
      },
      "Must be a valid IPv4 (0–255 octets) or IPv6 address"
    ),
  label: z.string().max(100).optional(),
});

// GET /api/management/ip-allowlist – list all allowed IPs
export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("ManagementIpAllowlist")
      .select("id, ip, label, createdAt")
      .order("createdAt", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch allowlist" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error: any) {
    console.error("IP allowlist GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/management/ip-allowlist – add an IP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = addIpSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.errors.map((e) => e.message) },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("ManagementIpAllowlist")
      .insert({ ip: result.data.ip, label: result.data.label ?? null })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "IP address already in allowlist" }, { status: 409 });
      }
      console.error("IP allowlist insert error:", error);
      return NextResponse.json({ error: "Failed to add IP" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("IP allowlist POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/management/ip-allowlist – remove an IP by id
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Safety check: prevent removing the current caller's own IP if it is the last one
    const { data: remaining } = await supabase
      .from("ManagementIpAllowlist")
      .select("id, ip");

    if ((remaining?.length ?? 0) <= 1) {
      const callerIp = getClientIp(request);
      const targetRow = remaining?.find((r: any) => r.id === id);
      if (targetRow && targetRow.ip === callerIp) {
        return NextResponse.json(
          { error: "Cannot remove the last IP that matches your current IP — you would lock yourself out" },
          { status: 409 }
        );
      }
    }

    const { error } = await supabase
      .from("ManagementIpAllowlist")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("IP allowlist delete error:", error);
      return NextResponse.json({ error: "Failed to remove IP" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("IP allowlist DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
