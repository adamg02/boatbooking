import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";

// GET all users with their groups
export async function GET() {
  try {
    await requireAdmin();
    const supabase = await getSupabaseClient();

    const { data: users, error } = await supabase
      .from('User')
      .select(`
        *,
        userGroups:UserGroup(
          group:Group(id, name)
        )
      `)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Fetch users error:', error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    return NextResponse.json(users || []);
  } catch (error: any) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes('Unauthorized') ? 401 : 403 }
    );
  }
}

// POST update user groups
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const supabase = await getSupabaseClient();
    const { userId, groupIds } = await request.json();

    if (!userId || !Array.isArray(groupIds)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Delete existing user groups
    await supabase
      .from('UserGroup')
      .delete()
      .eq('userId', userId);

    // Insert new user groups
    if (groupIds.length > 0) {
      const userGroups = groupIds.map(groupId => ({
        userId,
        groupId,
      }));

      const { error: insertError } = await supabase
        .from('UserGroup')
        .insert(userGroups);

      if (insertError) {
        console.error('Insert user groups error:', insertError);
        return NextResponse.json(
          { error: "Failed to update user groups" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update user groups error:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes('Unauthorized') ? 401 : 403 }
    );
  }
}
