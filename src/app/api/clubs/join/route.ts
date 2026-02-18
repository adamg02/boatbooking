import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { z } from "zod";

const joinClubSchema = z.object({
  joinCode: z.string().min(1, "Join code is required").max(20, "Invalid join code"),
});

// POST /api/clubs/join - Join an existing club using a join code
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
    const result = joinClubSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.errors.map((e) => e.message) },
        { status: 400 }
      );
    }

    const { joinCode } = result.data;

    // Look up the club by join code (case-insensitive)
    const { data: club, error: clubError } = await supabase
      .from("Club")
      .select("id, name")
      .eq("joinCode", joinCode.toUpperCase())
      .single();

    if (clubError || !club) {
      return NextResponse.json(
        { error: "Invalid join code. Please check the code and try again." },
        { status: 404 }
      );
    }

    // Assign user to the club
    const { error: updateError } = await supabase
      .from("User")
      .update({ clubId: club.id })
      .eq("id", user.id);

    if (updateError) {
      console.error("Assign user to club error:", updateError);
      return NextResponse.json({ error: "Failed to join club" }, { status: 500 });
    }

    return NextResponse.json({ club });
  } catch (error: any) {
    console.error("Join club error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
