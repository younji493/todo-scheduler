import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "../../../components/dashboard/Dashboard.js";
import { TodoProvider } from "../../../features/todos/TodoProvider.jsx";

const initialData = {
  date: "2026-11-09T09:00:00+09:00", timeZone: "Asia/Seoul", user: { name: "민지" },
  tasks: [
    { id: "report", title: "보고서 정리", startDate: "2026-11-09", dueDate: "2026-11-09", startAt: "2026-11-09T10:00:00+09:00", endAt: "2026-11-09T11:00:00+09:00", durationMinutes: 60, completed: false },
    { id: "plain", title: "책 반납", startDate: "2026-11-09", dueDate: "2026-11-12", durationMinutes: 30, completed: false },
    { id: "future", title: "미래의 일", startDate: "2026-11-10", dueDate: "2026-11-10", durationMinutes: 30, completed: false },
  ],
};
function show(data = initialData) {
  return render(<TodoProvider initialTasks={data.tasks}><Dashboard initialData={data} /></TodoProvider>);
}
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async (url, options) => ({ ok: true, json: async () => options?.method === "PATCH" ? { ...initialData.tasks[0], completed: true } : initialData.tasks })));
});
afterEach(() => vi.unstubAllGlobals());

describe("Dashboard", () => {
  it("preserves legacy undated tasks without retaining the Inbox UI", () => {
    show({ ...initialData, tasks: [{ id: "legacy", title: "날짜 없는 기존 할 일", category: "Inbox", completed: false }] });
    expect(screen.queryByText("Inbox")).not.toBeInTheDocument();
    expect(screen.getByText("날짜 확인 필요")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "날짜 없는 기존 할 일 완료" })).toBeInTheDocument();
  });
  it("hides the legacy Inbox badge without hiding the scheduled task", () => {
    show({ ...initialData, tasks: [{ ...initialData.tasks[0], category: "Inbox" }] });
    expect(screen.queryByText("Inbox")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "보고서 정리 완료" })).toBeInTheDocument();
  });
  it("separates today's date-only and timed tasks, keeping future work out", () => {
    show();
    expect(screen.getByText("1개의 약속")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "책 반납 완료" })).toBeInTheDocument();
    expect(screen.queryByText("미래의 일")).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Inbox" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "할일 추가" })).not.toBeInTheDocument();
  });
  it("updates completion after saving and keeps the timeline readable", async () => {
    show();
    const checkbox = screen.getByRole("checkbox", { name: "보고서 정리 완료" });
    fireEvent.click(checkbox);
    await waitFor(() => expect(checkbox).toBeChecked());
    expect(checkbox.closest("article")).not.toHaveClass("opacity-60");
  });
  it("preserves a timeline task if completion cannot be saved", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    show();
    fetch.mockResolvedValueOnce({ ok: false });
    fireEvent.click(screen.getByRole("checkbox", { name: "보고서 정리 완료" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/todos/report", expect.anything()));
    expect(screen.getByRole("checkbox", { name: "보고서 정리 완료" })).not.toBeChecked();
    vi.restoreAllMocks();
  });
  it("keeps orphaned events visible on their date", () => {
    show({ ...initialData, tasks: [], events: [{ id: "orphan", taskId: "missing", start: "2026-11-09T18:00:00+09:00", end: "2026-11-09T18:30:00+09:00" }] });
    expect(screen.getByText("알 수 없는 할 일")).toBeInTheDocument();
    expect(screen.getByText("18:00 — 18:30")).toBeInTheDocument();
  });
});
