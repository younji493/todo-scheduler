import { createSupabaseServerClient } from "../../../lib/supabase/server.js";
import { apiError } from "../../../features/auth/serverAuth.js";
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) throw error;
    return Response.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error, "로그아웃하지 못했습니다. 다시 시도해주세요."); }
}
