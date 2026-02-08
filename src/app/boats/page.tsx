import { getSupabaseClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import BoatCard from "@/components/BoatCard";
import SignOutButton from "@/components/SignOutButton";
import { isAdmin } from "@/lib/admin";
import Link from "next/link";

export default async function BoatsPage() {
  const supabase = await getSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/signin");
  }

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold">Available Boats</h1>
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
