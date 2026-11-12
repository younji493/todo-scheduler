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

  it("uses the authenticated server list as the source of truth", async () => {
    const saved = { id: "saved", title: "Saved", completed: false };
    fetch.mockResolvedValueOnce(response([saved]));
    const { result } = setup();
    await waitFor(() => expect(result.current.tasks).toEqual([saved]));
    const refresh = result.current.refreshTodos;
    const updated = { ...saved, completed: true };
    fetch.mockResolvedValueOnce(response([updated]));
    await act(async () => { await result.current.refreshTodos(); });
    expect(result.current.tasks).toEqual([updated]);
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
    expect(result.current.tasks).toEqual([]);
  });

  it("adds a todo returned by the server", async () => {
    const { result } = setup();
    await act(async () => {});
    const saved = { ...draft, id: "new", completed: false };
    fetch.mockResolvedValueOnce(response(saved));
    await act(async () => {
      expect(await result.current.addTodo(draft)).toEqual({ isValid: true, fieldErrors: {} });
    });
    expect(result.current.tasks).toEqual([saved]);
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
    expect(result.current.tasks).toEqual([]);
  });

  it("applies the completion state returned by the server", async () => {
    fetch.mockResolvedValueOnce(response([seed]));
    const { result } = setup();
    await act(async () => {});
    fetch.mockResolvedValueOnce(response({ ...seed, completed: true }));
    await act(async () => { await result.current.toggleTodoComplete(seed.id); });
    expect(result.current.tasks).toEqual([{ ...seed, completed: true }]);
    expect(fetch).toHaveBeenLastCalledWith("/api/todos/seed", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ completed: true }) }));
  });
});

// A slow initial GET must not erase a successful insert from the current session.
it("keeps a newly saved todo when an older list request finishes later", async () => {
  let resolveList;
  const saved = { ...draft, id: "saved", completed: false };
  vi.stubGlobal("fetch", vi.fn((url, options) => options?.method === "POST"
    ? Promise.resolve(response(saved))
    : new Promise(resolve => { resolveList = resolve; })));
  const { result } = setup();
  await act(async () => { await result.current.addTodo(draft); });
  expect(result.current.tasks).toContainEqual(saved);
  await act(async () => { resolveList(response([])); });
  expect(result.current.tasks).toContainEqual(saved);
  vi.unstubAllGlobals();
});
