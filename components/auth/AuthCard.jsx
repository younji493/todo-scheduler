import Link from "next/link";

import Logo from "../ui/Logo";

const COPY = {
  login: {
    description: "오늘의 할 일을 차분히 정리해 볼까요?",
    linkHref: "/signup",
    linkLabel: "아직 계정이 없으신가요? 회원가입",
    title: "다시 만나 반가워요",
  },
  signup: {
    description: "나만의 하루를 계획할 준비를 시작해 보세요.",
    linkHref: "/login",
    linkLabel: "이미 계정이 있으신가요? 로그인",
    title: "회원가입",
  },
};

export default function AuthCard({ children, mode }) {
  const copy = COPY[mode] ?? COPY.login;

  return (
    <section
      aria-labelledby="auth-title"
      className="mx-auto w-full max-w-md rounded-[2rem] border border-white/90 bg-white/95 p-6 shadow-[0_24px_70px_rgba(45,53,89,0.14)] backdrop-blur-sm sm:p-9"
    >
      <Logo />
      <p className="mt-7 mb-3 text-sm font-black text-[#8f7ce7]">나만의 다이어리, 가볍게 시작하기</p>
      <h1 id="auth-title" className="text-3xl font-black tracking-[-0.06em] text-[#2d3559]">
        {copy.title}
      </h1>
      <p className="mt-3 leading-6 text-[#727895]">{copy.description}</p>
      <p className="mt-2 rounded-xl bg-[#fff7ef] px-3 py-2.5 text-xs leading-5 text-[#977466]">
        가입한 계정으로 로그인하면 내 일정을 저장하고 다시 확인할 수 있어요.
      </p>
      <div className="mt-8">{children}</div>
      <Link
        href={copy.linkHref}
        className="mt-6 inline-block text-sm font-bold text-[#725fca] underline-offset-4 transition hover:text-[#5d4caf] hover:underline"
      >
        {copy.linkLabel}
      </Link>
    </section>
  );
}
