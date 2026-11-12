import { createSupabaseServerClient } from "../../../lib/supabase/server.js";
import { apiError, publicUser } from "../../../features/auth/serverAuth.js";
import { validateAuthForm } from "../../../features/auth/authValidation.js";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body || ["name", "email", "password", "passwordConfirmation"].some(key => typeof body[key] !== "string")) {
    return Response.json({ message: "회원가입 정보를 확인해주세요." }, { status: 400 });
  }
  const errors = validateAuthForm("signup", body);
  if (Object.keys(errors).length || body.password.length < 8) {
    return Response.json({ message: Object.values(errors)[0] || "비밀번호는 8자 이상 입력해주세요." }, { status: 400 });
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: body.email.trim(), password: body.password,
      options: { data: { name: body.name.trim() }, emailRedirectTo: `${new URL(request.url).origin}/auth/callback` },
    });
    if (error) return Response.json({ message: error.status === 429 ? "요청이 많습니다. 잠시 후 다시 시도해주세요." : "회원가입을 완료하지 못했습니다. 입력 정보 또는 기존 가입 여부를 확인해주세요." }, { status: 400 });
    return Response.json({ success: true, requiresEmailConfirmation: !data.session, user: data.user ? publicUser(data.user) : null }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error, "회원가입 서버에 연결하지 못했습니다."); }
}
