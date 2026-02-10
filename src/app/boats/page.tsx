import { getSupabaseClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import BoatCard from "@/components/BoatCard";
import SignOutButton from "@/components/SignOutButton";
import { isAdmin } from "@/lib/admin";
import Link from "next/link";
import { format } from "date-fns";

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
  }) || [];

  // Get user's next booking
  const { data: nextBooking } = await supabase
    .from('Booking')
    .select('*, boat:Boat(name)')
    .eq('userId', user.id)
    .eq('status', 'CONFIRMED')
    .gte('startTime', new Date().toISOString())
    .order('startTime', { ascending: true })
    .limit(1)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Available Boats</h1>
              {userData?.name && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Welcome, {userData.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {adminCheck && (
                <Link
                  href="/admin"
                  className="text-xs sm:text-sm bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
                >
                  Admin
                </Link>
              )}
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {nextBooking && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
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
          </div>
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
