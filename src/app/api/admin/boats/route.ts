import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { updateBoatSchema, createBoatSchema, safeValidateRequest } from "@/lib/validation";
import { FREE_TIER_BOAT_LIMIT } from "@/lib/stripe";

// GET all boats with their groups (scoped to the admin's club)
export async function GET() {
  try {
    const adminUser = await requireAdmin();
    const supabase = await getSupabaseClient();

    const { data: boats, error } = await supabase
      .from('Boat')
      .select(`
        *,
        boatGroups:BoatGroup(
          group:Group(id, name)
        )
      `)
      .eq('clubId', adminUser.clubId)
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
    const adminUser = await requireAdmin();
    const supabase = await getSupabaseClient();
    const body = await request.json();

    // Sanitise optional string fields: treat empty strings as undefined
    const sanitisedBody = {
      boatId: body.boatId,
      name: body.name,
      description: body.description === '' ? undefined : body.description,
      capacity: typeof body.capacity === 'number' ? body.capacity : undefined,
      imageUrl: body.imageUrl === '' ? undefined : body.imageUrl,
      isActive: body.isActive,
      groupIds: body.groupIds,
    };

    // Validate input
    const validation = safeValidateRequest(updateBoatSchema, sanitisedBody);
    if (!validation.success) {
      console.error('Update boat validation errors:', JSON.stringify(validation.error.errors, null, 2));
      return NextResponse.json(
        { 
          error: "Invalid input data",
          details: validation.error.errors.map(e => e.message)
        },
        { status: 400 }
      );
    }
    
    const { boatId, name, description, capacity, imageUrl, isActive, groupIds } = validation.data;

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
    const adminUser = await requireAdmin();
    const supabase = await getSupabaseClient();
    const body = await request.json();

    // Enforce free-tier boat limit
    const { data: club } = await supabase
      .from("Club")
      .select("subscriptionTier")
      .eq("id", adminUser.clubId)
      .single();

    const tier = club?.subscriptionTier ?? "free";
    if (tier === "free") {
      const { count: boatCount } = await supabase
        .from("Boat")
        .select("id", { count: "exact", head: true })
        .eq("clubId", adminUser.clubId);

      if ((boatCount ?? 0) >= FREE_TIER_BOAT_LIMIT) {
        return NextResponse.json(
          {
            error: `Free plan is limited to ${FREE_TIER_BOAT_LIMIT} boats. Upgrade to the paid plan for unlimited boats.`,
            limitReached: true,
          },
          { status: 403 }
        );
      }
    }

    const { name, description, capacity, imageUrl, isActive, groupIds } = body;

    // Sanitise optional fields: treat empty strings as null/undefined
    const sanitisedBody = {
      name,
      description: description === '' ? undefined : description,
      capacity: typeof capacity === 'number' ? capacity : undefined,
      imageUrl: imageUrl === '' ? undefined : imageUrl,
      isActive,
      groupIds,
    };

    // Validate input
    const validation = safeValidateRequest(createBoatSchema, sanitisedBody);
    if (!validation.success) {
      console.error('Create boat validation errors:', JSON.stringify(validation.error.errors, null, 2));
      console.error('Create boat body received:', JSON.stringify(sanitisedBody, null, 2));
      return NextResponse.json(
        { 
          error: "Invalid input data",
          details: validation.error.errors.map(e => e.message)
        },
        { status: 400 }
      );
    }
    
    const { name: validName, description: validDescription, capacity: validCapacity, imageUrl: validImageUrl, isActive: validIsActive, groupIds: validGroupIds } = validation.data;

    const { data, error } = await supabase
      .from('Boat')
      .insert({
        name: validName,
        description: validDescription || null,
        capacity: validCapacity || 1,
        imageUrl: validImageUrl || null,
        isActive: validIsActive !== undefined ? validIsActive : true,
        clubId: adminUser.clubId,
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
    if (Array.isArray(validGroupIds) && validGroupIds.length > 0) {
      const boatGroups = validGroupIds.map(groupId => ({
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
