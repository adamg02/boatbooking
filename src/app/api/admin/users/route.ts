import { NextResponse } from "next/server";
import { getSupabaseClient, getSupabaseAdminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { updateUserSchema, safeValidateRequest } from "@/lib/validation";

// GET all users with their groups (scoped to the admin's club)
export async function GET() {
  try {
    const adminUser = await requireAdmin();
    const supabase = await getSupabaseClient();

    const { data: users, error } = await supabase
      .from('User')
      .select(`
        *,
        userGroups:UserGroup(
          group:Group(id, name)
        )
      `)
      .eq('clubId', adminUser.clubId)
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
    const adminUser = await requireAdmin();
    const supabase = await getSupabaseClient();
    const body = await request.json();
    
    // Validate input
    const validation = safeValidateRequest(updateUserSchema, body);
    if (!validation.success) {
      console.error('Update user validation errors:', JSON.stringify(validation.error.errors, null, 2));
      console.error('Update user body received:', JSON.stringify(body, null, 2));
      return NextResponse.json(
        { 
          error: "Invalid input data",
          details: validation.error.errors.map(e => e.message)
        },
        { status: 400 }
      );
    }
    
    const { userId, groupIds, isActive } = validation.data;

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
      // Ensure the target user exists in the User table before touching UserGroup.
      // Users who signed up before the DB trigger was installed may be missing.
      const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingUser) {
        // Pull the user from auth and sync them now.
        try {
          const adminClient = getSupabaseAdminClient();
          const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
          if (authUser?.user) {
            const u = authUser.user;
            await adminClient.from('User').upsert(
              {
                id: u.id,
                email: u.email ?? '',
                name:
                  u.user_metadata?.full_name ??
                  u.user_metadata?.name ??
                  u.email?.split('@')[0] ??
                  'Unknown',
                image: u.user_metadata?.avatar_url ?? null,
                emailVerified: u.email_confirmed_at ?? null,
                updatedAt: new Date().toISOString(),
              },
              { onConflict: 'id', ignoreDuplicates: false }
            );
          } else {
            return NextResponse.json(
              { error: "User not found in auth system" },
              { status: 404 }
            );
          }
        } catch (syncError) {
          console.error('Assign user sync error:', syncError);
          return NextResponse.json(
            { error: "Failed to sync user record before assigning groups" },
            { status: 500 }
          );
        }
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
