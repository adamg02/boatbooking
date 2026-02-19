import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";

// GET /api/admin/subscription/payments – list all payments for the club
export async function GET() {
  try {
    const adminUser = await requireAdmin();
    const supabase = await getSupabaseClient();

    const { data: payments, error } = await supabase
      .from("Payment")
      .select(
        "id, amount, currency, status, description, billingInterval, periodStart, periodEnd, receiptUrl, hostedInvoiceUrl, createdAt"
      )
      .eq("clubId", adminUser.clubId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Fetch payments error:", error);
      return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
    }

    return NextResponse.json(payments ?? []);
  } catch (error: any) {
    console.error("Payments list error:", error);
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Unauthorized") ? 401 : 403 }
    );
  }
}
