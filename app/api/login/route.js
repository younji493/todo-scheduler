import { createSupabaseServerClient } from "../../../lib/supabase/server.js";
import { apiError, publicUser } from "../../../features/auth/serverAuth.js";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (typeof body?.email !== "string" || typeof body?.password !== "string" || !body.email.trim() || !body.password) {
    return Response.json({ message: "이메일과 비밀번호를 입력해주세요." }, { status: 400 });
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: body.email.trim(), password: body.password });
    if (error) return Response.json({ message: error.code === "email_not_confirmed" ? "이메일 인증을 완료한 뒤 로그인해주세요." : "이메일 또는 비밀번호를 확인해주세요." }, { status: 400 });
    return Response.json({ success: true, user: publicUser(data.user) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error, "로그인 서버에 연결하지 못했습니다."); }
}
