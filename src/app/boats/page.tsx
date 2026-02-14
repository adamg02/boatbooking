import { getSupabaseClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import BoatCard from "@/components/BoatCard";
import { isAdmin } from "@/lib/admin";
import { format } from "date-fns";
import MobileNavBar from "@/components/MobileNavBar";

export default async function BoatsPage() {
  const supabase = await getSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/signin");
  }

  // Get user details from User table
  const { data: userData } = await supabase
    .from('User')
    .select('name, email')
    .eq('id', user.id)
    .single();

  // Check if user is admin
  const adminCheck = await isAdmin(user.id);

  // Get user's groups
  const { data: userGroups } = await supabase
    .from('UserGroup')
    .select('groupId, group:Group(*)')
    .eq('userId', user.id);

  const userGroupIds = userGroups?.map(ug => ug.groupId) || [];

  // Get boats the user can access
  // Users can book boats that either:
  // 1. Have no group restrictions
  // 2. Have groups that the user belongs to
  const { data: allBoats } = await supabase
    .from('Boat')
    .select('*, boatGroups:BoatGroup(groupId, group:Group(*))')
    .eq('isActive', true);

  // Filter boats based on permissions
  const boats = allBoats?.filter((boat: any) => {
    const boatGroupIds = boat.boatGroups?.map((bg: any) => bg.groupId) || [];
    return boatGroupIds.length === 0 || boatGroupIds.some((id: string) => userGroupIds.includes(id));
  }).sort((a: any, b: any) =>
    (a.name || "").localeCompare(b.name || "", undefined, { numeric: true, sensitivity: "base" })
  ) || [];

  // Get user's next booking
  const { data: nextBooking } = await supabase
    .from('Booking')
    .select('*, boat:Boat(id, name)')
    .eq('userId', user.id)
    .eq('status', 'CONFIRMED')
    .gte('startTime', new Date().toISOString())
    .order('startTime', { ascending: true })
    .limit(1)
    .single();

  const nextBookingStart = nextBooking ? new Date(nextBooking.startTime) : null;
  const nextBookingEnd = nextBooking ? new Date(nextBooking.endTime) : null;
  const nextBookingDate = nextBookingStart ? format(nextBookingStart, "yyyy-MM-dd") : null;
  const nextBookingTime = nextBookingStart ? format(nextBookingStart, "HH:mm") : null;
  const nextBookingDurationHours =
    nextBookingStart && nextBookingEnd
      ? (nextBookingEnd.getTime() - nextBookingStart.getTime()) / (1000 * 60 * 60)
      : null;
  const nextBookingIsFullDay = nextBookingDurationHours === 14;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MobileNavBar 
        title="Available Boats" 
        subtitle={userData?.name ? `Welcome, ${userData.name}` : undefined}
        isAdmin={adminCheck}
        userName={userData?.name}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {nextBooking && (
          <Link
            href={`/boats/${nextBooking.boat?.id}?date=${nextBookingDate}&time=${nextBookingTime}${
              nextBookingIsFullDay ? "&fullDay=1" : ""
            }`}
            className="block bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 hover:border-blue-300 hover:bg-blue-100/60 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Your next booking
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  <span className="font-semibold">{nextBooking.boat?.name}</span> on{" "}
                  {format(new Date(nextBooking.startTime), "EEEE, MMMM d 'at' h:mm a")}
                </p>
              </div>
            </div>
          </Link>
        )}

        {boats.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No boats available for booking at this time.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boats.map((boat) => (
              <BoatCard key={boat.id} boat={boat} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
