"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
const AuthContext = createContext(null);
export function useAuthUser() { return useContext(AuthContext); }

export default function AuthGuard({ children }) {
  const { replace } = useRouter();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    fetch("/api/auth/me", { cache: "no-store", signal: controller.signal }).then(async response => {
      if (response.status === 401) { replace("/login"); return; }
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setUser(result.user);
    }).catch(error => { if (error.name !== "AbortError") setError(error.message || "로그인 상태를 확인하지 못했습니다."); });
    return () => controller.abort();
  }, [replace, attempt]);
  if (error) return <main className="p-8"><p role="alert">{error}</p><button onClick={() => setAttempt(value => value + 1)}>다시 시도</button></main>;
  if (!user) return <main className="flex min-h-screen items-center justify-center text-[#727895]" role="status">로그인 상태를 확인하고 있어요.</main>;
  return <AuthContext.Provider key={user.id} value={user}>{children}</AuthContext.Provider>;
}
