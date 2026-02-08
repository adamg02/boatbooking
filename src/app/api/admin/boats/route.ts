import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";

// GET all boats with their groups
export async function GET() {
  try {
    await requireAdmin();
    const supabase = await getSupabaseClient();

    const { data: boats, error } = await supabase
      .from('Boat')
      .select(`
        *,
        boatGroups:BoatGroup(
          group:Group(id, name)
        )
      `)
      .order('name', { ascending: true });

    if (error) {
      console.error('Fetch boats error:', error);
      return NextResponse.json(
        { error: "Failed to fetch boats" },
        { status: 500 }
      );
    }

    return NextResponse.json(boats || []);
  } catch (error: any) {
    console.error("Admin boats error:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes('Unauthorized') ? 401 : 403 }
    );
  }
}

// POST update boat details and groups
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const supabase = await getSupabaseClient();
    const { boatId, name, description, capacity, imageUrl, isActive, groupIds } = await request.json();

    if (!boatId) {
      return NextResponse.json(
        { error: "Boat ID required" },
        { status: 400 }
      );
    }

    // Update boat details
    const { error: updateError } = await supabase
      .from('Boat')
      .update({
        name,
        description,
        capacity,
        imageUrl,
        isActive: isActive !== undefined ? isActive : true,
      })
      .eq('id', boatId);

    if (updateError) {
      console.error('Update boat error:', updateError);
      return NextResponse.json(
        { error: "Failed to update boat" },
        { status: 500 }
      );
    }

    // Update boat groups if provided
    if (Array.isArray(groupIds)) {
      // Delete existing boat groups
      await supabase
        .from('BoatGroup')
        .delete()
        .eq('boatId', boatId);

      // Insert new boat groups
      if (groupIds.length > 0) {
        const boatGroups = groupIds.map(groupId => ({
          boatId,
          groupId,
        }));

        const { error: insertError } = await supabase
          .from('BoatGroup')
          .insert(boatGroups);

        if (insertError) {
          console.error('Insert boat groups error:', insertError);
          return NextResponse.json(
            { error: "Failed to update boat groups" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update boat error:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes('Unauthorized') ? 401 : 403 }
    );
  }
}

// PUT create new boat
export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const supabase = await getSupabaseClient();
    const { name, description, capacity, imageUrl, isActive, groupIds } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Boat name required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('Boat')
      .insert({
        name,
        description: description || null,
        capacity: capacity || 1,
        imageUrl: imageUrl || null,
        isActive: isActive !== undefined ? isActive : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Create boat error:', error);
      return NextResponse.json(
        { error: "Failed to create boat" },
        { status: 500 }
      );
    }

    // Add boat to groups if provided
    if (Array.isArray(groupIds) && groupIds.length > 0) {
      const boatGroups = groupIds.map(groupId => ({
        boatId: data.id,
        groupId,
      }));

      const { error: insertError } = await supabase
        .from('BoatGroup')
        .insert(boatGroups);

      if (insertError) {
        console.error('Insert boat groups error:', insertError);
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Create boat error:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes('Unauthorized') ? 401 : 403 }
    );
  }
}
