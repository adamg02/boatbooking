import { redirect } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import AdminLayout from "@/components/AdminLayout";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/signin");
  }
  
  const adminCheck = await isAdmin(user.id);
  if (!adminCheck) {
    redirect("/boats");
  }
  
  // Get dashboard stats
  const [usersResult, boatsResult, bookingsResult] = await Promise.all([
    supabase.from('User').select('id', { count: 'exact', head: true }),
    supabase.from('Boat').select('id', { count: 'exact', head: true }),
    supabase.from('Booking').select('id', { count: 'exact', head: true }).eq('status', 'CONFIRMED'),
  ]);

  const stats = [
    {
      title: "Total Users",
      value: usersResult.count || 0,
      href: "/admin/users",
      icon: "👥",
      color: "bg-blue-500",
    },
    {
      title: "Total Boats",
      value: boatsResult.count || 0,
      href: "/admin/boats",
      icon: "🚣",
      color: "bg-green-500",
    },
    {
      title: "Active Bookings",
      value: bookingsResult.count || 0,
      href: "/admin/bookings",
      icon: "📅",
      color: "bg-purple-500",
    },
  ];

  return (
    <AdminLayout>
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Admin Dashboard
        </h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <Link
              key={stat.title}
              href={stat.href}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`${stat.color} text-white text-4xl w-16 h-16 rounded-full flex items-center justify-center`}
                >
                  {stat.icon}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/admin/users"
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <h4 className="font-semibold text-gray-900">Manage Users</h4>
              <p className="text-sm text-gray-600 mt-1">
                View and assign users to groups
              </p>
            </Link>
            <Link
              href="/admin/boats"
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-500 hover:bg-green-50 transition-all"
            >
              <h4 className="font-semibold text-gray-900">Manage Boats</h4>
              <p className="text-sm text-gray-600 mt-1">
                Edit boats and assign permissions
              </p>
            </Link>
            <Link
              href="/admin/bookings"
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-500 hover:bg-purple-50 transition-all"
            >
              <h4 className="font-semibold text-gray-900">View Bookings</h4>
              <p className="text-sm text-gray-600 mt-1">
                See all bookings across all boats
              </p>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
