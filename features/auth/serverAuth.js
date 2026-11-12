import { createSupabaseServerClient } from "../../lib/supabase/server.js";

export class HttpError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new HttpError("로그인이 필요합니다.", 401);
  return { supabase, user: data.user };
}

export function publicUser(user) {
  return { id: user.id, email: user.email, name: user.user_metadata?.name || "친구" };
}

export function apiError(error, fallback = "요청을 처리하지 못했습니다.") {
  const status = error?.status === 401 || error?.status === 503 ? error.status : 500;
  return Response.json({ success: false, message: status === 500 ? fallback : error.message }, {
    status, headers: { "Cache-Control": "private, no-store" },
  });
}
