// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ requireUser: vi.fn(), listTodos: vi.fn(), insertTodo: vi.fn(), setTodoCompleted: vi.fn() }));
vi.mock("../../../../features/auth/serverAuth.js", async original => ({ ...await original(), requireUser: mocks.requireUser }));
vi.mock("../../../../features/todos/todoRepository.js", () => mocks);
import { GET, POST } from "../../../../app/api/todos/route.js";
import { PATCH } from "../../../../app/api/todos/[id]/route.js";
import { POST as analyze } from "../../../../app/api/ai-schedule/route.js";
import { POST as chat } from "../../../../app/api/chat/route.js";
import { HttpError } from "../../../../features/auth/serverAuth.js";
const id = "00000000-0000-4000-8000-000000000001";
const draft = { title: "공부", startDate: "2026-11-12", dueDate: "2026-11-12", durationMinutes: 60 };
const request = body => new Request("http://localhost/api/todos", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => { vi.clearAllMocks(); mocks.requireUser.mockResolvedValue({ supabase: "client", user: { id: "user-a" } }); });
it.each([GET, () => POST(request(draft)), () => PATCH(request({ completed: true }), { params: Promise.resolve({ id }) }), () => analyze(request({ message: "내일 공부" })), () => chat(request({ message: "내일 공부" }))])("denies unauthenticated data and AI access", async handler => {
  mocks.requireUser.mockRejectedValue(new HttpError("로그인이 필요합니다.", 401));
  expect((await handler()).status).toBe(401);
  expect(mocks.listTodos).not.toHaveBeenCalled(); expect(mocks.insertTodo).not.toHaveBeenCalled(); expect(mocks.setTodoCompleted).not.toHaveBeenCalled();
});
it("lists only the verified user's data and prevents response caching", async () => {
  mocks.listTodos.mockResolvedValue([{ id }]); const response = await GET();
  expect(await response.json()).toEqual([{ id }]);
  expect(mocks.listTodos).toHaveBeenCalledWith("client", "user-a");
  expect(response.headers.get("Cache-Control")).toContain("no-store");
});
it("uses the authenticated identity rather than a submitted owner", async () => {
  mocks.insertTodo.mockResolvedValue({ ...draft, id });
  const response = await POST(request({ ...draft, user_id: "user-b" }));
  expect(response.status).toBe(201);
  expect(mocks.insertTodo).toHaveBeenCalledWith("client", "user-a", expect.any(Object));
});
it.each([{ completed: "true" }, { completed: true, user_id: "user-b" }, { title: "overwrite" }])("rejects unsupported updates: %j", async body => {
  expect((await PATCH(request(body), { params: Promise.resolve({ id }) })).status).toBe(400);
  expect(mocks.setTodoCompleted).not.toHaveBeenCalled();
});
it("returns 404 for a missing or another user's todo", async () => {
  mocks.setTodoCompleted.mockResolvedValue(null);
  expect((await PATCH(request({ completed: true }), { params: Promise.resolve({ id }) })).status).toBe(404);
  expect(mocks.setTodoCompleted).toHaveBeenCalledWith("client", "user-a", id, true);
});
it("returns database errors without exposing provider internals", async () => {
  mocks.listTodos.mockRejectedValue(new Error("private database details"));
  const response = await GET(); expect(response.status).toBe(500);
  expect(JSON.stringify(await response.json())).not.toContain("private database");
});
