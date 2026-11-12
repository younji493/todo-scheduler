import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server.js";
export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  try {
    const supabase = await createSupabaseServerClient();
    let result;
    if (code) result = await supabase.auth.exchangeCodeForSession(code);
    else if (tokenHash && ["signup", "email"].includes(url.searchParams.get("type"))) {
      result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: url.searchParams.get("type") });
    }
    if (result && !result.error) return NextResponse.redirect(new URL("/", url.origin));
  } catch { /* Return to login with a user-facing message. */ }
  return NextResponse.redirect(new URL("/login?error=confirmation", url.origin));
}
