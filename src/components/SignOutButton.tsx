"use client";

import { getSupabaseClientComponent } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = getSupabaseClientComponent();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-xs sm:text-sm bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
    >
      Sign Out
    </button>
  );
}
