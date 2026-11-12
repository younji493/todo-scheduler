"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "./AuthGuard.jsx";
export default function AccountMenu() {
  const user = useAuthUser();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const logout = async () => {
    setPending(true); setError("");
    try {
      const response = await fetch("/api/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      router.replace("/login"); router.refresh();
    } catch { setError("로그아웃하지 못했어요. 다시 시도해주세요."); setPending(false); }
  };
  return <div className="flex flex-wrap items-center justify-end gap-3 px-5 pt-4 text-sm text-[#5f6680]">
    <span>{user?.name}님</span><button className="rounded-lg border border-[#ece4d9] bg-white px-3 py-2" disabled={pending} onClick={logout}>{pending ? "로그아웃 중…" : "로그아웃"}</button>
    {error && <p role="alert">{error}</p>}
  </div>;
}
