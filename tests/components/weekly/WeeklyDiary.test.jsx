vi.mock("../../../features/auth/AccountMenu.jsx", () => ({ default: () => null }));
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AppShell from "../../../components/layout/AppShell.jsx";
import WeeklyDiary from "../../../components/weekly/WeeklyDiary.jsx";
import { TodoProvider } from "../../../features/todos/TodoProvider.jsx";

const data = { date: "2026-09-22T09:00:00+09:00", timeZone: "Asia/Seoul" };
const tasks = [
  { id: "timed", title: "보고서 정리", startDate: "2026-09-22", dueDate: "2026-09-22", startAt: "2026-09-22T13:00:00+09:00", endAt: "2026-09-22T13:30:00+09:00", completed: false },
  { id: "plain", title: "책 반납", startDate: "2026-09-23", dueDate: "2026-09-25", completed: false },
  { id: "future", title: "다음 주 할 일", startDate: "2026-09-28", dueDate: "2026-09-28", completed: false },
];
beforeEach(() => vi.stubGlobal("fetch", vi.fn(async (url, options) => ({ ok: true, json: async () => options?.method === "PATCH" ? { ...tasks[0], completed: true } : tasks }))));
afterEach(() => vi.unstubAllGlobals());
function show() { render(<TodoProvider initialTasks={tasks}><AppShell activeSection="week"><WeeklyDiary initialData={data} /></AppShell></TodoProvider>); }
describe("WeeklyDiary", () => {
  it("places date-only work in its weekday and timed work in the grid", async () => {
    show();
    expect(within(screen.getByLabelText("2026-09-23 시간 미정")).getByText("책 반납")).toBeInTheDocument();
    expect(screen.queryByText("다음 주 할 일")).not.toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox", { name: "보고서 정리 완료" });
    fireEvent.click(checkbox);
    await waitFor(() => expect(checkbox).toBeChecked());
  });
  it("keeps a short time block proportional and exposes monthly navigation", () => {
    show();
    expect(screen.getByRole("article", { name: "보고서 정리, 13:00 — 13:30" }).style.height).toBe("4.166666666666666%");
    expect(within(screen.getByRole("navigation", { name: "모바일 주요 메뉴" })).getByRole("link", { name: "월별" })).toHaveAttribute("href", "/month");
    expect(screen.queryByRole("button", { name: "할일 추가" })).not.toBeInTheDocument();
  });
  it("moves weeks and returns to today's week", () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "다음 주" }));
    expect(screen.getByText("다음 주 할 일")).toBeInTheDocument();
    expect(screen.queryByText("책 반납")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "오늘" }));
    expect(screen.getByText("책 반납")).toBeInTheDocument();
  });
});
