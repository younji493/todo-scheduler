import SidebarNav from "./SidebarNav";
import Logo from "../ui/Logo";
import Link from "next/link";

const mobileItems = [
  { href: "/", label: "오늘", section: "today" },
  { href: "/week", label: "이번 주", section: "week" },
];

export default function AppShell({ activeSection = "today", children }) {
  return (
    <div className="min-h-screen p-3 sm:p-5 lg:p-7">
      <div className="mx-auto min-h-[calc(100vh-1.5rem)] max-w-[1500px] overflow-hidden rounded-[2rem] border border-white/80 bg-[#fffaf3]/80 shadow-[0_24px_70px_rgba(80,65,105,0.12)] sm:min-h-[calc(100vh-2.5rem)] lg:flex lg:min-h-[calc(100vh-3.5rem)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#ece4d9] bg-white/60 px-4 py-3 sm:px-5 sm:py-4 lg:hidden">
          <Logo />
          <nav className="flex items-center gap-1 rounded-full bg-[#f5f1ec] p-1" aria-label="모바일 주요 메뉴">
            {mobileItems.map((item) => (
              <Link
                key={item.section}
                href={item.href}
                aria-current={item.section === activeSection ? "page" : undefined}
                className={`rounded-full px-2.5 py-1.5 text-xs font-bold transition sm:px-3 ${item.section === activeSection ? "bg-[#ede9ff] text-[#6d5abc]" : "text-[#727895]"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden lg:block"><SidebarNav activeSection={activeSection} /></div>
        <main className="min-w-0 flex-1 overflow-auto pb-24">{children}</main>
      </div>
    </div>
  );
}
