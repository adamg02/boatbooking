import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { sendOnboardingReminderEmail } from "@/lib/email";

// POST /api/cron/onboarding-reminder
// Sends a one-off re-engagement email to users who signed up 3+ days ago
// but never joined or created a club. Protected by CRON_SECRET.
//
// Schedule it with any external cron service (e.g. Render Cron Job, GitHub
// Actions schedule, cron-job.org) hitting this endpoint daily:
//   curl -X POST https://<app-url>/api/cron/onboarding-reminder \
//     -H "Authorization: Bearer $CRON_SECRET"

const REMINDER_DELAY_DAYS = 3;
const BATCH_SIZE = 50;

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET not configured");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const cutoff = new Date(
      Date.now() - REMINDER_DELAY_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: users, error } = await supabase
      .from("User")
      .select("id, email, name")
      .is("clubId", null)
      .eq("isActive", true)
      .eq("isSystemOwner", false)
      .is("onboardingReminderSentAt", null)
      .lte("createdAt", cutoff)
      .limit(BATCH_SIZE);

    if (error) {
      console.error("Onboarding reminder query error:", error);
      return NextResponse.json({ error: "Query failed" }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    let sent = 0;
    let failed = 0;

    for (const user of users ?? []) {
      if (!user.email) continue;
      const result = await sendOnboardingReminderEmail({
        userName: user.name ?? "",
        userEmail: user.email,
        appUrl,
      });
      if (result.success) {
        // Mark only on success so transient failures are retried next run
        await supabase
          .from("User")
          .update({ onboardingReminderSentAt: new Date().toISOString() })
          .eq("id", user.id);
        sent++;
      } else {
        failed++;
      }
    }

    return NextResponse.json({ candidates: users?.length ?? 0, sent, failed });
  } catch (error: any) {
    console.error("Onboarding reminder error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
