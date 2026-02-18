import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { z } from "zod";

const createClubSchema = z.object({
  name: z.string().min(2, "Club name must be at least 2 characters").max(100, "Club name too long"),
  description: z.string().max(500, "Description too long").optional(),
});

function generateJoinCode(): string {
  // 8 character alphanumeric join code (uppercase)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // omit ambiguous chars
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// POST /api/clubs - Create a new club; the creator becomes the Admin
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already belongs to a club
    const { data: existingUser } = await supabase
      .from("User")
      .select("clubId")
      .eq("id", user.id)
      .single();

    if (existingUser?.clubId) {
      return NextResponse.json(
        { error: "You are already a member of a club" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = createClubSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.errors.map((e) => e.message) },
        { status: 400 }
      );
    }

    const { name, description } = result.data;

    // Generate a unique join code (retry if collision)
    let joinCode = generateJoinCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from("Club")
        .select("id")
        .eq("joinCode", joinCode)
        .single();
      if (!existing) break;
      joinCode = generateJoinCode();
      attempts++;
    }

    // Create the club
    const { data: club, error: clubError } = await supabase
      .from("Club")
      .insert({ name, description: description || null, joinCode })
      .select()
      .single();

    if (clubError || !club) {
      console.error("Create club error:", clubError);
      return NextResponse.json({ error: "Failed to create club" }, { status: 500 });
    }

    // Create an "Admin" group for this club
    const { data: adminGroup, error: groupError } = await supabase
      .from("Group")
      .insert({ name: "Admin", description: "Club administrators", clubId: club.id })
      .select()
      .single();

    if (groupError || !adminGroup) {
      console.error("Create admin group error:", groupError);
      // Rollback club
      await supabase.from("Club").delete().eq("id", club.id);
      return NextResponse.json({ error: "Failed to set up club" }, { status: 500 });
    }

    // Assign user to the club and to the Admin group (all in parallel)
    const [userUpdateResult, userGroupResult] = await Promise.all([
      supabase.from("User").update({ clubId: club.id }).eq("id", user.id),
      supabase.from("UserGroup").insert({ userId: user.id, groupId: adminGroup.id }),
    ]);

    if (userUpdateResult.error || userGroupResult.error) {
      console.error("Assign user error:", userUpdateResult.error, userGroupResult.error);
      return NextResponse.json({ error: "Failed to assign user to club" }, { status: 500 });
    }

    return NextResponse.json({ club }, { status: 201 });
  } catch (error: any) {
    console.error("Create club error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
