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

// POST update user groups or status
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const supabase = await getSupabaseClient();
    const { userId, groupIds, isActive } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // If isActive is provided, update user status
    if (typeof isActive === 'boolean') {
      const { error: updateError } = await supabase
        .from('User')
        .update({ isActive })
        .eq('id', userId);

      if (updateError) {
        console.error('Update user status error:', updateError);
        return NextResponse.json(
          { error: "Failed to update user status" },
          { status: 500 }
        );
      }
    }

    // If groupIds is provided, update user groups
    if (Array.isArray(groupIds)) {
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
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes('Unauthorized') ? 401 : 403 }
    );
  }
}
