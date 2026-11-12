import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Dashboard from "../../../components/dashboard/Dashboard.js";
import WeeklyDiary from "../../../components/weekly/WeeklyDiary.jsx";
import MonthlyCalendar from "../../../features/calendar/MonthlyCalendar.jsx";
import ScheduleChat from "../../../features/chat/ScheduleChat.jsx";
import { TodoProvider } from "../../../features/todos/TodoProvider.jsx";

const json = data => ({ ok: true, json: async () => data });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-09T14:59:00Z"));
  vi.stubGlobal("fetch", vi.fn(async (url, options) => {
    if (url === "/api/ai-schedule") return json({ success: true, todo: { title: "책 반납", startDate: "2026-11-09", dueDate: "2026-11-09", durationMinutes: 30 } });
    if (options?.method === "POST") return json({ ...JSON.parse(options.body), id: "saved", completed: false });
    if (options?.method === "PATCH") return json({ id: "saved", title: "책 반납", startDate: "2026-11-09", dueDate: "2026-11-09", durationMinutes: 30, completed: true });
    return json([]);
  }));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it("adds through chat, shares completion in all three views, and offers no manual add", async () => {
  render(<TodoProvider><div data-testid="today"><Dashboard /></div><div data-testid="week"><WeeklyDiary /></div><div data-testid="month"><MonthlyCalendar /></div><ScheduleChat /></TodoProvider>);
  expect(screen.queryByRole("button", { name: "할일 추가" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /어떤 일정을 추가할까요/ }));
  fireEvent.change(screen.getByLabelText("일정 메시지"), { target: { value: "오늘 책 반납" } });
  fireEvent.click(screen.getByRole("button", { name: "메시지 전송" }));
  await screen.findByText(/일정을 추가했어요/);
  for (const view of ["today", "week", "month"]) expect(within(screen.getByTestId(view)).getByRole("checkbox", { name: "책 반납 완료" })).not.toBeChecked();
  await act(async () => { fireEvent.click(within(screen.getByTestId("today")).getByRole("checkbox", { name: "책 반납 완료" })); });
  for (const view of ["today", "week", "month"]) expect(within(screen.getByTestId(view)).getByRole("checkbox", { name: "책 반납 완료" })).toBeChecked();
}, 15000);

it("refreshes the real Korean day after midnight on window focus", async () => {
  render(<TodoProvider><Dashboard /></TodoProvider>);
  expect(screen.getByText("11월 9일 월요일")).toBeInTheDocument();
  vi.setSystemTime(new Date("2026-11-09T15:01:00Z"));
  act(() => { window.dispatchEvent(new Event("focus")); });
  expect(screen.getByText("11월 10일 화요일")).toBeInTheDocument();
});

it("rolls over at Korean midnight without a focus event", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-09T14:59:45Z"));
  render(<TodoProvider><Dashboard /></TodoProvider>);
  act(() => vi.advanceTimersByTime(15000));
  expect(screen.getByText("11월 10일 화요일")).toBeInTheDocument();
});

it("selects another month and returns to the actual day", () => {
  render(<TodoProvider initialTasks={[{ id: "future", title: "다음 달 일정", startDate: "2026-12-01", dueDate: "2026-12-01" }]}><MonthlyCalendar /></TodoProvider>);
  fireEvent.click(screen.getByRole("button", { name: "다음 달" }));
  fireEvent.click(screen.getByRole("button", { name: /^2026-12-01/ }));
  expect(screen.getByRole("checkbox", { name: "다음 달 일정 완료" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "오늘" }));
  expect(screen.queryByRole("checkbox", { name: "다음 달 일정 완료" })).not.toBeInTheDocument();
});

it("keeps late and overnight schedules visible in their week days", () => {
  render(<TodoProvider initialTasks={[{ id: "night", title: "야간 작업", startDate: "2026-11-09", dueDate: "2026-11-10", startAt: "2026-11-09T23:30:00+09:00", endAt: "2026-11-10T00:30:00+09:00" }]}><WeeklyDiary /></TodoProvider>);
  expect(screen.getAllByRole("checkbox", { name: "야간 작업 완료" })).toHaveLength(2);
});
