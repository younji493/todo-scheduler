"use client";

import { CalendarDays, CircleHelp, LayoutDashboard, Settings2, Sparkles } from "lucide-react";
import Link from "next/link";

import Logo from "../ui/Logo";

const items = [
  { label: "오늘", icon: LayoutDashboard, href: "/", section: "today" },
  { label: "이번 주", icon: CalendarDays, href: "/week", section: "week" },
  { label: "나의 루틴", icon: Sparkles },
  { label: "설정", icon: Settings2 },
];

export default function SidebarNav({ activeSection = "today" }) {
  return (
    <aside className="flex h-full min-h-[44rem] flex-col border-r border-[#ece4d9] bg-white/55 px-4 py-6 backdrop-blur-sm lg:w-60">
      <div className="px-3"><Logo /></div>
      <nav className="mt-10 space-y-1.5" aria-label="주요 메뉴">
        {items.map(({ href, icon: Icon, label, section }) =>
          href ? (
            <Link
              key={label}
              href={href}
              aria-current={section === activeSection ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${section === activeSection ? "bg-[#ede9ff] text-[#6252b5]" : "text-[#727895] hover:bg-white"}`}
            >
              <Icon size={18} strokeWidth={2.2} aria-hidden="true" />
              {label}
            </Link>
          ) : (
            <span key={label} className="flex cursor-default items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#9ea3b8]" title="곧 준비됩니다">
              <Icon size={18} strokeWidth={2} aria-hidden="true" />
              {label}
              <small className="ml-auto rounded-full bg-[#f5f1ec] px-1.5 py-0.5 text-[10px] font-bold text-[#9b8f85]">soon</small>
            </span>
          ),
        )}
      </nav>
      <div className="mt-auto rounded-2xl bg-[#fff1e8] p-4 text-sm text-[#826356]">
        <div className="mb-2 flex items-center gap-2 font-bold text-[#6e5247]">
          <CircleHelp size={16} aria-hidden="true" />
          오늘의 작은 팁
        </div>
        가장 중요한 일 하나만 골라, 가장 먼저 적어보세요.
      </div>
    </aside>
  );
}
