"use client";

import { useEffect } from "react";
import { getSupabaseClientComponent } from "@/lib/supabase-client";
import { identifyUser, resetUser, toAnalyticsUser } from "@/lib/mixpanel";

/** Keeps Mixpanel identity in sync with the Supabase auth session. */
export default function MixpanelIdentity() {
  useEffect(() => {
    const supabase = getSupabaseClientComponent();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        resetUser();
      } else if (session?.user) {
        identifyUser(toAnalyticsUser(session.user));
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return null;
}
