// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { fromTodoRow, insertTodo, listTodos, setTodoCompleted } from "../../../features/todos/todoRepository.js";
const row = { id: "id", title: "공부", start_date: "2026-11-12", due_date: "2026-11-12", start_at: "2026-11-12T06:00:00+00:00", end_at: "2026-11-12T07:00:00+00:00", duration_minutes: 60, completed: false, priority: "medium" };
const query = {};
const client = { from: vi.fn(() => query) };
beforeEach(() => {
  for (const method of ["select", "eq", "order", "insert", "update", "single", "maybeSingle"]) query[method] = vi.fn(() => query);
  query.then = resolve => Promise.resolve(resolve({ data: [row], error: null }));
});
it("converts database UTC timestamps to Seoul time without shifting the day", () => {
  expect(fromTodoRow(row)).toMatchObject({ startAt: "2026-11-12T15:00:00+09:00", endAt: "2026-11-12T16:00:00+09:00" });
  expect(fromTodoRow({ ...row, start_at: null, end_at: null })).not.toHaveProperty("startAt");
});
it("filters every read to the verified owner", async () => {
  await listTodos(client, "owner"); expect(query.eq).toHaveBeenCalledWith("user_id", "owner");
});
it("whitelists insert fields so submitted IDs, owners and completion cannot be injected", async () => {
  query.single.mockResolvedValue({ data: row, error: null });
  await insertTodo(client, "owner", { title: " 공부 ", startDate: row.start_date, dueDate: row.due_date, durationMinutes: 60, user_id: "attacker", id: "overwrite", completed: true });
  expect(query.insert).toHaveBeenCalledWith({ user_id: "owner", title: "공부", start_date: row.start_date, due_date: row.due_date, duration_minutes: 60, start_at: null, end_at: null });
});
it("scopes a completion update to both owner and todo ID", async () => {
  query.maybeSingle.mockResolvedValue({ data: null, error: null });
  expect(await setTodoCompleted(client, "owner", "id", true)).toBeNull();
  expect(query.eq).toHaveBeenCalledWith("user_id", "owner"); expect(query.eq).toHaveBeenCalledWith("id", "id");
  expect(query.update).toHaveBeenCalledWith({ completed: true });
});
