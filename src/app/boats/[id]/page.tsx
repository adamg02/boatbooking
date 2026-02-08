import { getSupabaseClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import BookingCalendar from "@/components/BookingCalendar";
import Link from "next/link";

export default async function BoatBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
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
          <h1 className="text-2xl font-bold">{boat.name}</h1>
          {boat.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {boat.description}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookingCalendar boat={boat} userId={user.id} />
      </main>
    </div>
  );
}
