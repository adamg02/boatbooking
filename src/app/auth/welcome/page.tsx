"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fireEvent } from "@/lib/gtag";

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fireEvent("sign_up", { method: "oauth" });

    // New users have no club yet, so go straight to onboarding (honouring an
    // invite link's ?next) instead of bouncing /boats → middleware → onboarding.
    // Replace this page in history so the back button skips it,
    // preventing the conversion from being counted more than once.
    const rawNext = searchParams.get("next");
    const next =
      rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/onboarding";
    router.replace(next);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="text-5xl mb-4">👋</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to RowBook!</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Setting up your account…</p>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400">Loading…</p>
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
