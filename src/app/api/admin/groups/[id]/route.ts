import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";

// GET group details with users and boats
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const supabase = await getSupabaseClient();

    const { data: group, error } = await supabase
      .from('Group')
      .select(`
        *,
        userGroups:UserGroup(
          user:User(id, name, email)
        ),
        boatGroups:BoatGroup(
          boat:Boat(id, name)
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Fetch group details error:', error);
      return NextResponse.json(
        { error: "Failed to fetch group details" },
        { status: 500 }
      );
    }

    return NextResponse.json(group);
  } catch (error: any) {
    console.error("Admin group details error:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes('Unauthorized') ? 401 : 403 }
    );
  }
}
