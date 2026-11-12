"use client";

import { useAuthUser } from "../../features/auth/AuthGuard.jsx";
import { createElement, useMemo } from "react";
import { getEventsOnDate, getTasksInRange, getTasksOnDate } from "../../features/todos/todoCalendar.js";
import TodoChecklist from "../todos/TodoChecklist.jsx";
import Card from "../ui/Card";

import { getWeekProgress } from "../../features/dashboard/dashboardModel.js";
import { getTodoEvents } from "../../features/todos/todoEvents.js";
import { useTodos } from "../../features/todos/TodoProvider.jsx";
import { getCalendarDateKey, getWeekDays } from "../../lib/weekCalendar.js";
import DashboardHeader from "./DashboardHeader";
import TodayTimeline from "./TodayTimeline";
import WeekProgressCard from "./WeekProgressCard";

const h = createElement;

export default function Dashboard({ initialData }) {
  const { tasks, toggleTodoComplete, todayDate } = useTodos();
  const authUser = useAuthUser();
  const timeZone = initialData?.timeZone ?? "Asia/Seoul";
  const date = initialData?.date ?? todayDate;
  const todayKey = getCalendarDateKey(date, timeZone);
  const allEvents = useMemo(
    () => [...(initialData?.events ?? []), ...getTodoEvents(tasks)],
    [initialData?.events, tasks],
  );
  const events = useMemo(
    () => getEventsOnDate(allEvents, todayKey, timeZone),
    [allEvents, todayKey, timeZone],
  );

  const taskById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );
  const timedIds = new Set(allEvents.map(event => event.taskId));
  const untimedTasks = getTasksOnDate(tasks, todayKey, timeZone).filter(task => !timedIds.has(task.id));
  const undatedTasks = tasks.filter(task => !task.startDate && !task.startAt && !timedIds.has(task.id));
  const days = getWeekDays(date, timeZone);
  const weekTasks = getTasksInRange(tasks, days[0]?.key, days.at(-1)?.key, timeZone);
  const weekEvents = allEvents.filter(event => {
    const start = getCalendarDateKey(event.start, timeZone);
    const end = getCalendarDateKey(new Date(Date.parse(event.end) - 1), timeZone);
    return start && end && start <= days.at(-1)?.key && end >= days[0]?.key;
  });
  const progress = getWeekProgress(weekTasks, weekEvents);
  const overdueTasks = tasks.filter(task => !task.completed && task.startDate && task.startDate < todayKey && (!task.endAt || getCalendarDateKey(new Date(Date.parse(task.endAt) - 1), timeZone) < todayKey));

  return h(
    "section",
    { className: "p-5 sm:p-8 lg:p-10" },
    h(DashboardHeader, {
      user: authUser || initialData?.user,
      dateValue: date,
      timeZone: initialData?.timeZone,
    }),
    h(
      "div",
      {
        className:
          "mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start",
      },
      h("div", { className: "space-y-5" },
      h(Card, { className: "p-5 sm:p-7" },
        h("h2", { className: "mb-4 text-lg font-black text-[#2d3559]" }, "오늘 할 일"),
        h(TodoChecklist, { tasks: untimedTasks, onToggleComplete: toggleTodoComplete, emptyMessage: "오늘의 시간 미정 할 일이 없어요. 일정 도우미에게 추가할 일을 말해보세요." })),
      h(TodayTimeline, {
        events,
        taskById,
        onToggleComplete: toggleTodoComplete,
        timeZone: initialData?.timeZone,
      })),
      h(
        "aside",
        { className: "space-y-5" },
        undatedTasks.length > 0 && h(Card, { className: "p-5" },
          h("h2", { className: "mb-2 font-bold text-[#934a39]" }, "날짜 확인 필요"),
          h("p", { className: "mb-4 text-xs text-[#727895]" }, "날짜가 없는 기존 할 일이에요. 데이터는 그대로 보관돼요."),
          h(TodoChecklist, { tasks: undatedTasks, onToggleComplete: toggleTodoComplete })),
        h(WeekProgressCard, { progress }),
        overdueTasks.length > 0 && h(Card, { className: "p-5" },
          h("details", null,
            h("summary", { className: "cursor-pointer font-bold text-[#934a39]" }, `지난 미완료 · ${overdueTasks.length}개`),
            h("div", { className: "mt-4" }, h(TodoChecklist, { tasks: overdueTasks, onToggleComplete: toggleTodoComplete })))),
      ),
    ),
  );
}
