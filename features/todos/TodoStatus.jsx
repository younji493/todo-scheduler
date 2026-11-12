"use client";
import Link from "next/link";
import { useTodos } from "./TodoProvider.jsx";
export default function TodoStatus() {
  const { error, isLoading, refreshTodos } = useTodos();
  if (isLoading) return <p role="status" className="px-5 py-3 text-sm text-[#727895]">일정을 불러오고 있어요.</p>;
  if (!error) return null;
  return <div className="m-4 rounded-xl bg-[#fff1e8] p-4 text-sm text-[#934a39]" role="alert">
    <p>{error}</p><div className="mt-2 flex gap-4"><button onClick={() => refreshTodos().catch(() => {})}>다시 불러오기</button><Link href="/login">로그인 화면으로</Link></div>
  </div>;
}
