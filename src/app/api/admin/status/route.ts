import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminCheck = await isAdmin(user.id);
    return NextResponse.json({ isAdmin: adminCheck });
  } catch (error) {
    console.error("Admin status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
