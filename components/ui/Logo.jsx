"use client";

import { CheckCircle2 } from "lucide-react";

export default function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5" aria-label="하루결">
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#8f7ce7] text-white shadow-[0_8px_18px_rgba(143,124,231,0.28)]">
        <CheckCircle2 size={19} strokeWidth={2.4} aria-hidden="true" />
      </span>
      {!compact && (
        <span className="text-lg font-black tracking-[-0.07em] text-[#2d3559]">하루결</span>
      )}
    </div>
  );
}
