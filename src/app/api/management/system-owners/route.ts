import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { z } from "zod";

const setOwnerSchema = z.object({
  email: z.string().email("Must be a valid email address"),
  isSystemOwner: z.boolean(),
});

/**
 * GET /api/management/system-owners
 * Returns all accounts that have isSystemOwner = true.
 * Only returns id, email, name and createdAt — never club membership or
 * other club-specific private data.
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("User")
      .select("id, email, name, createdAt")
      .eq("isSystemOwner", true)
      .order("createdAt", { ascending: true });

    if (error) {
      console.error("system-owners GET error:", error);
      return NextResponse.json({ error: "Failed to fetch system owners" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err: any) {
    console.error("system-owners GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/management/system-owners
 * Body: { email: string, isSystemOwner: boolean }
 * Looks up the account by email and sets/clears the isSystemOwner flag.
 * Deliberately does NOT expose club membership or any other club data.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = setOwnerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.errors.map((e) => e.message) },
        { status: 400 }
      );
    }

    const { email, isSystemOwner } = result.data;
    const supabase = getSupabaseAdminClient();

    // Look up the user by email – return only id so we don't leak club data
    const { data: users, error: findError } = await supabase
      .from("User")
      .select("id, email, name")
      .eq("email", email)
      .limit(1);

    if (findError) {
      console.error("system-owners user lookup error:", findError);
      return NextResponse.json({ error: "Failed to look up user" }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "No account found with that email address" },
        { status: 404 }
      );
    }

    const user = users[0];

    const { error: updateError } = await supabase
      .from("User")
      .update({ isSystemOwner })
      .eq("id", user.id);

    if (updateError) {
      console.error("system-owners update error:", updateError);
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      isSystemOwner,
    });
  } catch (err: any) {
    console.error("system-owners POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
