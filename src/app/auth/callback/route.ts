import { getSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await getSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to boats page
  return NextResponse.redirect(new URL("/boats", requestUrl.origin));
}
