import { getSupabaseClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import BookingCalendar from "@/components/BookingCalendar";
import Link from "next/link";

export default async function BoatBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: { date?: string; time?: string; fullDay?: string };
}) {
  const supabase = await getSupabaseClient();
  const { id } = await params;
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/signin");
  }

  // Get boat with related data
  const { data: boat } = await supabase
    .from('Boat')
    .select('*, boatGroups:BoatGroup(groupId, group:Group(*)), bookings:Booking(*)')
    .eq('id', id)
    .single();

  if (!boat) {
    redirect("/boats");
  }

  // Filter bookings to only show confirmed and future bookings
  boat.bookings = boat.bookings?.filter((b: any) => 
    b.status === 'CONFIRMED' && new Date(b.endTime) >= new Date()
  ).sort((a: any, b: any) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  ) || [];

  // Check if user has access to this boat
  const { data: userGroups } = await supabase
    .from('UserGroup')
    .select('groupId')
    .eq('userId', user.id);

  const userGroupIds = userGroups?.map(ug => ug.groupId) || [];
  const boatGroupIds = boat.boatGroups?.map((bg: any) => bg.groupId) || [];

  const hasAccess =
    boatGroupIds.length === 0 || // No restrictions
    boatGroupIds.some((id: string) => userGroupIds.includes(id)); // User in allowed group

  if (!hasAccess) {
    redirect("/boats");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/boats"
            className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to boats
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{boat.name}</h1>
            {!boat.isActive && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                Not Available
              </span>
            )}
          </div>
          {boat.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {boat.description}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!boat.isActive ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <svg
              className="w-12 h-12 text-yellow-600 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              This boat is currently unavailable
            </h3>
            <p className="text-gray-600">
              New bookings cannot be made for this boat at this time. Please check back later or contact an administrator.
            </p>
          </div>
        ) : (
          <BookingCalendar
            boat={boat}
            userId={user.id}
            initialDate={searchParams?.date}
            initialTime={searchParams?.time}
            initialFullDay={searchParams?.fullDay === "1"}
          />
        )}
      </main>
    </div>
  );
}
