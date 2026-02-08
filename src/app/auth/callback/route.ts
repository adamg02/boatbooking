import { getSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await getSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/boats`);
}
