// @vitest-environment node
import { expect, it } from "vitest";
// Explicit opt-in: this makes one billable OpenAI request; DB writes are not part of this smoke test.
it.skipIf(process.env.RUN_OPENAI_LIVE_TEST !== "1")("extracts a schedule with real OpenAI", async () => {
  expect(Boolean(process.env.OPENAI_API_KEY), "OPENAI_API_KEY must be configured").toBe(true);
  const { extractTodoSchedule } = await import("../../../features/todos/aiSchedule.js");
  const result = await extractTodoSchedule("2026년 11월 12일 오후 3시에 1시간 동안 공부하는 일정 추가해줘");
  expect(result.success, result.message).toBe(true);
  expect(result.todo).toMatchObject({ title: expect.stringContaining("공부"), startDate: "2026-11-12", dueDate: "2026-11-12", durationMinutes: 60, startAt: "2026-11-12T15:00:00+09:00", endAt: "2026-11-12T16:00:00+09:00" });
}, 60000);
