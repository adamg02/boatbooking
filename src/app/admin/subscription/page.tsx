"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import SubscriptionSection from "@/components/SubscriptionSection";

function SubscriptionPageContent() {
  const searchParams = useSearchParams();
  const subscriptionResult = searchParams.get("subscription");

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Subscription</h2>

        {subscriptionResult === "success" && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm font-medium">
            🎉 Subscription activated! You now have access to unlimited boats.
          </div>
        )}
        {subscriptionResult === "cancelled" && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            Checkout was cancelled. You remain on the free plan.
          </div>
        )}

        <SubscriptionSection />
      </div>
    </AdminLayout>
  );
}

export default function AdminSubscriptionPage() {
  return (
    <Suspense fallback={null}>
      <SubscriptionPageContent />
    </Suspense>
  );
}
