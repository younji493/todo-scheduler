import { Inbox } from "lucide-react";

import Card from "../ui/Card";

const priorityDots = {
  high: "bg-[#ff9170]",
  medium: "bg-[#9d8aef]",
  low: "bg-[#75c595]",
};

export default function InboxPanel({ tasks, onToggleComplete }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff1e8] text-[#a84f38]">
            <Inbox size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-black tracking-[-0.035em] text-[#2d3559]">
              Inbox
            </h2>
            <p className="text-xs text-[#5f6680]">아직 시간을 정하지 않은 일</p>
          </div>
        </div>
        <span className="rounded-full bg-[#f4f0eb] px-2.5 py-1 text-xs font-bold text-[#7d827f]">
          {tasks.length}
        </span>
      </div>
      <ul className="mt-5 space-y-2.5" aria-label="Inbox">
        {tasks.length === 0 ? (
          <li className="rounded-xl bg-[#faf7f2] px-3 py-6 text-center text-xs text-[#5f6680]">
            Inbox가 비었어요. 잘했어요!
          </li>
        ) : (
          tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition hover:border-[#eee6dc] hover:bg-[#fffdfa]"
            >
              <input
                type="checkbox"
                checked={Boolean(task.completed)}
                onChange={() => onToggleComplete(task.id)}
                aria-label={`${task.title} 완료`}
              />

              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  priorityDots[task.priority] || priorityDots.medium
                }`}
                aria-hidden="true"
              />

              <span
                className={`min-w-0 flex-1 truncate text-sm font-semibold text-[#4d5577] ${
                  task.completed ? "line-through opacity-60" : ""
                }`}
              >
                {task.title}
              </span>

              {task.durationMinutes > 0 && (
                <span className="text-[11px] font-medium text-[#5f6680]">
                  {task.durationMinutes}분
                </span>
              )}
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
