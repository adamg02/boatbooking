"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { fireEvent } from "@/lib/gtag";

function SignedInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/boats";

  useEffect(() => {
    // GA4 standard event name for a returning-user sign-in
    fireEvent("login", { method: "oauth" });
    router.replace(next);
  }, [router, next]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="text-5xl mb-4">🚣</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back!</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Signing you in…</p>
      </div>
    </div>
  );
}

export default function SignedInPage() {
  return (
    <Suspense>
      <SignedInContent />
    </Suspense>
  );
}
