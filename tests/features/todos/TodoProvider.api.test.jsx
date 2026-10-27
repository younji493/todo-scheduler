import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TodoProvider, useTodos } from "../../../features/todos/TodoProvider.jsx";

const seed = { id: "seed", title: "Seed", completed: false };
const draft = { title: "New", startDate: "2026-10-27", dueDate: "2026-10-28", durationMinutes: "60" };
const response = (data) => ({ ok: true, json: async () => data });

function setup() {
  return renderHook(() => useTodos(), {
    wrapper: ({ children }) => <TodoProvider initialTasks={[seed]}>{children}</TodoProvider>,
  });
}

describe("TodoProvider API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response([])));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("refreshes server tasks while preserving seed tasks and avoiding duplicates", async () => {
    const saved = { id: "saved", title: "Saved", completed: false };
    fetch.mockResolvedValueOnce(response([saved]));
    const { result } = setup();
    await waitFor(() => expect(result.current.tasks).toEqual([seed, saved]));
    const refresh = result.current.refreshTodos;
    const updated = { ...saved, completed: true };
    fetch.mockResolvedValueOnce(response([updated]));
    await act(async () => { await result.current.refreshTodos(); });
    expect(result.current.tasks).toEqual([seed, updated]);
    expect(result.current.refreshTodos).toBe(refresh);
    expect(fetch).toHaveBeenLastCalledWith("/api/todos", { cache: "no-store" });
  });

  it("propagates refresh failures to the caller and preserves tasks", async () => {
    const { result } = setup();
    await act(async () => {});
    fetch.mockResolvedValueOnce({ ok: false });
    await act(async () => {
      await expect(result.current.refreshTodos()).rejects.toThrow("할 일 목록 조회 실패");
    });
    expect(result.current.tasks).toEqual([seed]);
  });

  it("adds a todo returned by the server", async () => {
    const { result } = setup();
    await act(async () => {});
    const saved = { ...draft, id: "new", completed: false };
    fetch.mockResolvedValueOnce(response(saved));
    await act(async () => {
      expect(await result.current.addTodo(draft)).toEqual({ isValid: true, fieldErrors: {} });
    });
    expect(result.current.tasks).toEqual([seed, saved]);
    expect(fetch).toHaveBeenLastCalledWith("/api/todos", expect.objectContaining({ method: "POST", body: JSON.stringify(draft) }));
  });

  it.each(["network", "http"])("returns a validation error on %s save failure", async (failure) => {
    const { result } = setup();
    await act(async () => {});
    if (failure === "network") fetch.mockRejectedValueOnce(new Error("offline"));
    else fetch.mockResolvedValueOnce({ ok: false });
    await act(async () => {
      expect(await result.current.addTodo(draft)).toEqual({
        isValid: false,
        fieldErrors: { title: "할 일을 저장하지 못했습니다." },
      });
    });
    expect(result.current.tasks).toEqual([seed]);
  });

  it("applies the completion state returned by the server", async () => {
    const { result } = setup();
    await act(async () => {});
    fetch.mockResolvedValueOnce(response({ ...seed, completed: true }));
    await act(async () => { await result.current.toggleTodoComplete(seed.id); });
    expect(result.current.tasks).toEqual([{ ...seed, completed: true }]);
    expect(fetch).toHaveBeenLastCalledWith("/api/todos/seed", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ completed: true }) }));
  });
});
