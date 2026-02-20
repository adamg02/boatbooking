"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fireEvent } from "@/lib/gtag";

export default function ClubCreatedPage() {
  const router = useRouter();

  useEffect(() => {
    fireEvent("club_created", { event_category: "onboarding", event_label: "new_club" });

    // Replace this page in history so the back button skips it,
    // preventing the conversion from being counted more than once.
    router.replace("/boats");
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Club created!</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Taking you to your boats…</p>
      </div>
    </div>
  );
}
