import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { randomBytes } from "node:crypto";

function generateJoinCode(): string {
  // Cryptographically secure 8-character alphanumeric code
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

// GET /api/admin/club - Get the current club settings
export async function GET() {
  try {
    const adminUser = await requireAdmin();
    const supabase = await getSupabaseClient();

    const { data: club, error } = await supabase
      .from("Club")
      .select("id, name, description, joinCode, createdAt")
      .eq("id", adminUser.clubId)
      .single();

    if (error || !club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    return NextResponse.json(club);
  } catch (error: any) {
    console.error("Get club error:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Unauthorized") ? 401 : 403 }
    );
  }
}

// PATCH /api/admin/club - Regenerate the join code or update club details
export async function PATCH(request: Request) {
  try {
    const adminUser = await requireAdmin();
    const supabase = await getSupabaseClient();
    const body = await request.json();
    const { action, name, description } = body;

    if (action === "regenerateJoinCode") {
      // Generate a unique new join code
      let joinCode = generateJoinCode();
      let attempts = 0;
      while (attempts < 5) {
        const { data: existing } = await supabase
          .from("Club")
          .select("id")
          .eq("joinCode", joinCode)
          .neq("id", adminUser.clubId)
          .single();
        if (!existing) break;
        joinCode = generateJoinCode();
        attempts++;
      }

      const { data: club, error } = await supabase
        .from("Club")
        .update({ joinCode, updatedAt: new Date().toISOString() })
        .eq("id", adminUser.clubId)
        .select("id, name, description, joinCode, createdAt")
        .single();

      if (error || !club) {
        console.error("Regenerate join code error:", error);
        return NextResponse.json({ error: "Failed to regenerate join code" }, { status: 500 });
      }

      return NextResponse.json(club);
    }

    // Update club name/description
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    const { data: club, error } = await supabase
      .from("Club")
      .update(updates)
      .eq("id", adminUser.clubId)
      .select("id, name, description, joinCode, createdAt")
      .single();

    if (error || !club) {
      console.error("Update club error:", error);
      return NextResponse.json({ error: "Failed to update club" }, { status: 500 });
    }

    return NextResponse.json(club);
  } catch (error: any) {
    console.error("Update club error:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Unauthorized") ? 401 : 403 }
    );
  }
}
