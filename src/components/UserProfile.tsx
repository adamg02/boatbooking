"use client";

import { useEffect, useState } from "react";
import { getSupabaseClientComponent } from "@/lib/supabase-client";

interface UserProfileProps {
  isAdmin?: boolean;
  className?: string;
}

export default function UserProfile({ isAdmin, className }: UserProfileProps) {
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
    <div className={className || "text-sm text-gray-600 dark:text-gray-400 hidden sm:block"}>
      {userName} {isAdmin && '(Admin)'}
    </div>
  );
}
