import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";

// GET all groups
export async function GET() {
  try {
    await requireAdmin();
    const supabase = await getSupabaseClient();

    const { data: groups, error } = await supabase
      .from('Group')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Fetch groups error:', error);
      return NextResponse.json(
        { error: "Failed to fetch groups" },
        { status: 500 }
      );
    }

    return NextResponse.json(groups || []);
  } catch (error: any) {
    console.error("Admin groups error:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes('Unauthorized') ? 401 : 403 }
    );
  }
}
