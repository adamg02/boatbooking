"use client";

import { useEffect, useState } from "react";
import { getSupabaseClientComponent } from "@/lib/supabase-client";

export default function UserProfile() {
  const [userName, setUserName] = useState<string | null>(null);
  const supabase = getSupabaseClientComponent();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('User')
          .select('name, email')
          .eq('id', user.id)
          .single();
        
        setUserName(userData?.name || userData?.email || null);
      }
    };

    fetchUser();
  }, [supabase]);

  if (!userName) {
    return null;
  }

  return (
    <div className="text-sm text-gray-600 hidden sm:block">
      {userName}
    </div>
  );
}
