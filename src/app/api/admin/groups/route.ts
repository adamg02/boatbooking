import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";

const idArray = z.array(z.string().uuid("Invalid ID format")).optional().default([]);

const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100, "Group name too long").transform(s => s.trim()),
  userIds: idArray,
  boatIds: idArray,
});

const updateGroupSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
  name: z.string().min(1, "Group name is required").max(100, "Group name too long").transform(s => s.trim()),
  userIds: idArray,
  boatIds: idArray,
});

// GET all groups with boat/user counts (scoped to the admin's club)
export async function GET() {
  try {
    const adminUser = await requireAdmin();
    const supabase = await getSupabaseClient();

    const { data: groups, error } = await supabase
      .from('Group')
      .select(`
        *,
        boatGroups:BoatGroup(count),
        userGroups:UserGroup(count)
      `)
      .eq('clubId', adminUser.clubId)
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

// POST - Create new group
export async function POST(request: Request) {
  try {
    const adminUser = await requireAdmin();
    const body = await request.json();

    const validation = createGroupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors.map(e => e.message) },
        { status: 400 }
      );
    }

    const { name, userIds, boatIds } = validation.data;
    const supabase = await getSupabaseClient();

    // Create the group
    const { data: group, error: createError } = await supabase
      .from('Group')
      .insert({ name, clubId: adminUser.clubId })
      .select()
      .single();

    if (createError) {
      console.error('Create group error:', createError);
      return NextResponse.json(
        { error: "Failed to create group" },
        { status: 500 }
      );
    }

    // Add users to group
    if (userIds.length > 0) {
      const userGroupInserts = userIds.map((userId: string) => ({
        userId,
        groupId: group.id,
      }));

      const { error: userError } = await supabase
        .from('UserGroup')
        .insert(userGroupInserts);

      if (userError) {
        console.error('Add users to group error:', userError);
      }
    }

    // Add boats to group
    if (boatIds.length > 0) {
      const boatGroupInserts = boatIds.map((boatId: string) => ({
        boatId,
        groupId: group.id,
      }));

      const { error: boatError } = await supabase
        .from('BoatGroup')
        .insert(boatGroupInserts);

      if (boatError) {
        console.error('Add boats to group error:', boatError);
      }
    }

    return NextResponse.json({ success: true, group });
  } catch (error: any) {
    console.error("Create group error:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

// PUT - Update group
export async function PUT(request: Request) {
  try {
    const adminUser = await requireAdmin();
    const body = await request.json();

    const validation = updateGroupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors.map(e => e.message) },
        { status: 400 }
      );
    }

    const { groupId, name, userIds, boatIds } = validation.data;
    const supabase = await getSupabaseClient();

    // Verify the group belongs to the admin's club before mutating
    const { data: existingGroup } = await supabase
      .from('Group')
      .select('id')
      .eq('id', groupId)
      .eq('clubId', adminUser.clubId)
      .single();

    if (!existingGroup) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Update group name
    const { error: updateError } = await supabase
      .from('Group')
      .update({ name })
      .eq('id', groupId);

    if (updateError) {
      console.error('Update group error:', updateError);
      return NextResponse.json(
        { error: "Failed to update group" },
        { status: 500 }
      );
    }

    // Update user associations
    await supabase.from('UserGroup').delete().eq('groupId', groupId);
    
    if (userIds.length > 0) {
      const userGroupInserts = userIds.map((userId: string) => ({
        userId,
        groupId,
      }));

      await supabase.from('UserGroup').insert(userGroupInserts);
    }

    // Update boat associations
    await supabase.from('BoatGroup').delete().eq('groupId', groupId);
    
    if (boatIds.length > 0) {
      const boatGroupInserts = boatIds.map((boatId: string) => ({
        boatId,
        groupId,
      }));

      await supabase.from('BoatGroup').insert(boatGroupInserts);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update group error:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

// DELETE - Delete group
export async function DELETE(request: Request) {
  try {
    const adminUser = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("id");

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();

    // Verify the group belongs to the admin's club before operating
    const { data: group } = await supabase
      .from('Group')
      .select('name, clubId')
      .eq('id', groupId)
      .eq('clubId', adminUser.clubId)
      .single();

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group?.name.toLowerCase() === 'admin') {
      return NextResponse.json(
        { error: "Cannot delete the admin group" },
        { status: 400 }
      );
    }

    // Check if group has boats
    const { data: boatGroups } = await supabase
      .from('BoatGroup')
      .select('id')
      .eq('groupId', groupId)
      .limit(1);

    if (boatGroups && boatGroups.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete group with assigned boats. Remove boats from this group first." },
        { status: 400 }
      );
    }

    // Delete user associations first
    await supabase.from('UserGroup').delete().eq('groupId', groupId);

    // Delete the group
    const { error: deleteError } = await supabase
      .from('Group')
      .delete()
      .eq('id', groupId);

    if (deleteError) {
      console.error('Delete group error:', deleteError);
      return NextResponse.json(
        { error: "Failed to delete group" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete group error:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
