export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    const error = new Error("Supabase 연결 설정이 필요합니다. 프로젝트 URL과 공개 키를 설정해주세요.");
    error.status = 503;
    throw error;
  }
  return { url, key };
}
