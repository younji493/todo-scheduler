"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { submitAuth } from "../../features/auth/authClient.js";
import AuthCard from "./AuthCard.jsx";
import AuthForm from "./AuthForm.js";
import AuthShell from "../layout/AuthShell.jsx";

export default function AuthScreen({ mode }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (new URLSearchParams(window.location.search).get("error") === "confirmation") setError("인증 링크가 만료되었거나 유효하지 않습니다. 가입한 이메일을 확인하고 다시 로그인해주세요."); }, []);
  const handleSubmit = async values => {
    setPending(true); setError("");
    try {
      const result = await submitAuth(mode, values);
      if (result.requiresEmailConfirmation) setConfirmation(true);
      else { router.replace("/"); router.refresh(); }
    } catch (error) { setError(error.message || "서버에 연결하지 못했습니다."); }
    finally { setPending(false); }
  };
  return <AuthShell><AuthCard mode={mode}>
    {confirmation ? <div className="space-y-4">
      <p role="status" className="rounded-xl bg-[#edf6ef] p-4 text-sm leading-6 text-[#416a50]">가입 확인 이메일을 확인해주세요. 이메일의 인증 링크를 누르면 가입을 마치고 로그인할 수 있어요. 메일이 없으면 스팸함이나 기존 가입 여부도 확인해주세요.</p>
      <Link href="/login" className="block rounded-xl bg-[#2d3559] px-4 py-3.5 text-center text-sm font-bold text-white">로그인 화면으로</Link>
    </div> : <AuthForm key={mode} mode={mode} onSuccess={handleSubmit} pending={pending} />}
    {error && <p role="alert" className="mt-4 text-sm text-[#a84f38]">{error}</p>}
  </AuthCard></AuthShell>;
}
