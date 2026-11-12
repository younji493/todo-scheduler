export async function submitAuth(mode, values, fetchImpl = fetch) {
  const response = await fetchImpl(`/api/${mode}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values), cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "인증 요청에 실패했습니다.");
  return result;
}
