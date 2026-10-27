// @vitest-environment node
import { expect, it } from "vitest";

// Opt in explicitly: this test makes one billable OpenAI request.
it.skipIf(process.env.RUN_OPENAI_LIVE_TEST !== "1")("converts natural language with real OpenAI and saves through the TODO handlers", async () => {
  expect(Boolean(process.env.OPENAI_API_KEY), "OPENAI_API_KEY must be configured").toBe(true);

  const { POST: analyze } = await import("../../../app/api/ai-schedule/route.js");
  const { POST: save, GET: list } = await import("../../../app/api/todos/route.js");
  const { getTodos } = await import("../../../features/todos/todoServerStore.js");
  const request = (body) => new Request("http://localhost/api", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });

  const analyzed = await analyze(request({ message: "2026년 10월 28일 오후 3시에 1시간 동안 공부하는 일정 추가해줘" }));
  const data = await analyzed.json();
  expect(analyzed.status, data.message).toBe(200);
  expect(data.success, data.message).toBe(true);
  expect(data.todo).toMatchObject({
    title: expect.stringContaining("공부"),
    startDate: "2026-10-28", dueDate: "2026-10-28", durationMinutes: 60,
    startAt: "2026-10-28T15:00:00+09:00", endAt: "2026-10-28T16:00:00+09:00",
  });

  let savedId;
  try {
    const saved = await save(request(data.todo));
    expect(saved.status).toBe(201);
    const todo = await saved.json();
    savedId = todo.id;
    expect(todo).toMatchObject({ ...data.todo, completed: false });
    expect(await (await list()).json()).toContainEqual(todo);
  } finally {
    // Only remove the temporary record created in this test's process.
    const index = getTodos().findIndex((todo) => todo.id === savedId);
    if (index !== -1) getTodos().splice(index, 1);
  }
}, 60000);
