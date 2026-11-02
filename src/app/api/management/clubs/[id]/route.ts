import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

// GET /api/management/clubs/[id] – detailed view of a single club.
// Access is protected by the management middleware gate
// (IP allowlist + system-owner check) applied to all /api/management routes.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();

    const { data: club, error: clubError } = await supabase
      .from("Club")
      .select(
        "id, name, joinCode, subscriptionTier, subscriptionStatus, billingInterval, subscriptionCurrentPeriodEnd, stripeCustomerId, createdAt"
      )
      .eq("id", id)
      .single();

    if (clubError || !club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const [usersRes, boatsRes, paymentsRes] = await Promise.all([
      supabase
        .from("User")
        .select("id, name, email, provider, isActive, lastLogin, createdAt")
        .eq("clubId", id)
        .order("createdAt", { ascending: true }),
      supabase
        .from("Boat")
        .select("id, name, boatType, capacity, isActive, createdAt")
        .eq("clubId", id)
        .order("name", { ascending: true }),
      supabase
        .from("Payment")
        .select("amount, createdAt")
        .eq("clubId", id)
        .eq("status", "succeeded")
        .order("createdAt", { ascending: true }),
    ]);

    const users = usersRes.data ?? [];
    const boats = boatsRes.data ?? [];
    const payments = paymentsRes.data ?? [];

    const userIds = users.map((u: any) => u.id);
    const boatIds = boats.map((b: any) => b.id);

    // Group memberships for the club's users
    const groupsByUser: Record<string, string[]> = {};
    if (userIds.length > 0) {
      const { data: userGroups } = await supabase
        .from("UserGroup")
        .select("userId, group:Group(name)")
        .in("userId", userIds);
      for (const ug of userGroups ?? []) {
        const groupName = (ug as any).group?.name;
        if (!groupName) continue;
        (groupsByUser[(ug as any).userId] ??= []).push(groupName);
      }
    }

    // Booking stats
    let totalBookings = 0;
    let openBookings = 0;
    let lastBookingAt: string | null = null;
    const bookingsByBoat: Record<string, number> = {};
    if (boatIds.length > 0) {
      const [totalRes, openRes, lastRes, perBoatRes] = await Promise.all([
        supabase
          .from("Booking")
          .select("id", { count: "exact", head: true })
          .in("boatId", boatIds),
        supabase
          .from("Booking")
          .select("id", { count: "exact", head: true })
          .in("boatId", boatIds)
          .eq("status", "CONFIRMED")
          .gte("endTime", now),
        supabase
          .from("Booking")
          .select("createdAt")
          .in("boatId", boatIds)
          .order("createdAt", { ascending: false })
          .limit(1),
        supabase.from("Booking").select("boatId").in("boatId", boatIds),
      ]);
      totalBookings = totalRes.count ?? 0;
      openBookings = openRes.count ?? 0;
      lastBookingAt = lastRes.data?.[0]?.createdAt ?? null;
      for (const b of perBoatRes.data ?? []) {
        bookingsByBoat[(b as any).boatId] =
          (bookingsByBoat[(b as any).boatId] ?? 0) + 1;
      }
    }

    const totalPaidPence = payments.reduce(
      (sum: number, p: any) => sum + (p.amount ?? 0),
      0
    );

    return NextResponse.json({
      club: {
        id: club.id,
        name: club.name,
        joinCode: club.joinCode,
        createdAt: club.createdAt,
        subscriptionTier: club.subscriptionTier ?? "free",
        subscriptionStatus: club.subscriptionStatus ?? null,
        billingInterval: club.billingInterval ?? null,
        subscriptionCurrentPeriodEnd: club.subscriptionCurrentPeriodEnd ?? null,
        hasStripe: !!club.stripeCustomerId,
      },
      stats: {
        activeUsers: users.filter((u: any) => u.isActive).length,
        totalUsers: users.length,
        boatCount: boats.length,
        totalBookings,
        openBookings,
        lastBookingAt,
        totalPaidPence,
        firstPaymentAt: payments.length > 0 ? payments[0].createdAt : null,
      },
      users: users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        provider: u.provider ?? null,
        isActive: u.isActive,
        lastLogin: u.lastLogin,
        createdAt: u.createdAt,
        groups: groupsByUser[u.id] ?? [],
      })),
      boats: boats.map((b: any) => ({
        id: b.id,
        name: b.name,
        boatType: b.boatType ?? null,
        capacity: b.capacity ?? null,
        isActive: b.isActive,
        createdAt: b.createdAt,
        bookingCount: bookingsByBoat[b.id] ?? 0,
      })),
    });
  } catch (error: any) {
    console.error("Management club detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
