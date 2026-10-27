// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createResponse } = vi.hoisted(() => ({ createResponse: vi.fn() }));
vi.mock("openai", () => ({
  default: class OpenAI {
    responses = { create: createResponse };
  },
}));

import { POST as analyze } from "../../../app/api/ai-schedule/route.js";
import { GET as list, POST as save } from "../../../app/api/todos/route.js";
import { extractTodoSchedule } from "../../../features/todos/aiSchedule.js";
import { getTodos } from "../../../features/todos/todoServerStore.js";

const extracted = {
  title: "공부",
  startAt: "2026-10-28T15:00:00+09:00",
  endAt: "2026-10-28T16:00:00+09:00",
  durationMinutes: 60,
  ready: true,
};
const draft = {
  title: "공부",
  startDate: "2026-10-28",
  dueDate: "2026-10-28",
  durationMinutes: 60,
  startAt: extracted.startAt,
  endAt: extracted.endAt,
};
const request = (body) => new Request("http://localhost/api", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});
const complete = (todo = extracted) => ({ status: "completed", output_text: JSON.stringify(todo) });

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("OPENAI_API_KEY", "test-key");
  vi.stubEnv("OPENAI_MODEL", "gpt-5-mini");
  createResponse.mockReset().mockResolvedValue(complete());
  getTodos().length = 0;
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("natural language to TODO", () => {
  it("converts structured output to the existing draft and passes Seoul's current date", async () => {
    const result = await extractTodoSchedule("내일 오후 3시에 공부 추가해줘", {
      now: new Date("2026-10-26T15:30:00Z"),
    });
    expect(result).toEqual({ success: true, todo: draft });
    expect(createResponse).toHaveBeenCalledWith(expect.objectContaining({
      model: "gpt-5-mini", store: false,
      instructions: expect.stringContaining("2026-10-27T00:30:00+09:00"),
      text: { format: expect.objectContaining({ type: "json_schema", strict: true }) },
    }));
  });

  it("connects the analysis response to POST /api/todos and GET /api/todos", async () => {
    const analyzed = await analyze(request({ message: "내일 오후 3시에 공부 추가해줘" }));
    expect(analyzed.status).toBe(200);
    const data = await analyzed.json();
    expect(data.success).toBe(true);
    expect(getTodos()).toHaveLength(0);
    const saved = await save(request(data.todo));
    expect(saved.status).toBe(201);
    const todo = await saved.json();
    expect(todo).toMatchObject({ ...draft, id: expect.stringMatching(/^task-/), completed: false });
    expect(todo).not.toHaveProperty("syncStatus");
    expect(await (await list()).json()).toEqual([todo]);
  });

  it("preserves dates and exact times for an event crossing midnight", async () => {
    createResponse.mockResolvedValue(complete({ ...extracted,
      startAt: "2026-10-28T23:30:00+09:00", endAt: "2026-10-29T00:30:00+09:00",
    }));
    const data = await (await analyze(request({ message: "내일 밤 11시 반 공부 1시간" }))).json();
    expect(data.todo).toMatchObject({ startDate: "2026-10-28", dueDate: "2026-10-29" });
    expect((await save(request(data.todo))).status).toBe(201);
  });

  it("asks for clarification and never saves an ambiguous schedule", async () => {
    createResponse.mockResolvedValue(complete({ ...extracted, ready: false, startAt: null, endAt: null }));
    const result = await analyze(request({ message: "공부 추가해줘" }));
    expect(result.status).toBe(200);
    expect(await result.json()).toMatchObject({ success: false, message: expect.any(String) });
    expect(getTodos()).toHaveLength(0);
  });

  it.each([null, {}, { message: 12 }, { message: " " }, { message: "a".repeat(2001) }])("rejects bad input before an API call: %j", async (body) => {
    expect((await analyze(request(body))).status).toBe(400);
    expect(createResponse).not.toHaveBeenCalled();
  });

  it("rejects malformed request JSON", async () => {
    expect((await analyze(new Request("http://localhost/api", { method: "POST", body: "{" }))).status).toBe(400);
    expect(createResponse).not.toHaveBeenCalled();
  });

  it("handles a missing API key without failing module import", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    expect((await analyze(request({ message: "내일 오후 3시 공부" }))).status).toBe(503);
    expect(createResponse).not.toHaveBeenCalled();
  });

  it("rejects a non-ASCII placeholder key before contacting OpenAI", async () => {
    vi.stubEnv("OPENAI_API_KEY", "실제 키를 입력하세요");
    expect((await analyze(request({ message: "내일 오후 3시 공부" }))).status).toBe(503);
    expect(createResponse).not.toHaveBeenCalled();
  });

  it.each([
    [{ status: 429 }, 429],
    [{ status: 401 }, 503],
    [{ name: "APIConnectionTimeoutError" }, 504],
  ])("handles upstream errors without leaking details: %j", async (error, status) => {
    createResponse.mockRejectedValue({ ...error, message: "secret upstream details" });
    const result = await analyze(request({ message: "내일 오후 3시 공부" }));
    expect(result.status).toBe(status);
    expect(JSON.stringify(await result.json())).not.toContain("secret upstream details");
  });

  it.each([
    { status: "incomplete", output_text: "{" },
    { status: "completed", output_text: "not-json" },
    { status: "completed", output_text: "" },
  ])("rejects incomplete or malformed model output", async (output) => {
    createResponse.mockResolvedValue(output);
    expect((await analyze(request({ message: "내일 오후 3시 공부" }))).status).toBe(502);
    expect(getTodos()).toHaveLength(0);
  });

  it("handles model refusal", async () => {
    createResponse.mockResolvedValue({ status: "completed", output: [{ content: [{ type: "refusal" }] }] });
    const result = await analyze(request({ message: "일정 요청" }));
    expect(await result.json()).toMatchObject({ success: false });
  });

  it.each([
    { title: " " }, { ready: "true" }, { durationMinutes: 15 }, { durationMinutes: "60" },
    { endAt: "2026-10-28T16:30:00+09:00" },
    { startAt: "2026-02-30T15:00:00+09:00", endAt: "2026-02-30T16:00:00+09:00" },
    { startAt: "2026-10-28T15:00:00Z" },
  ])("rejects semantically invalid model output: %j", async (changes) => {
    createResponse.mockResolvedValue(complete({ ...extracted, ...changes }));
    expect((await analyze(request({ message: "내일 오후 3시 공부" }))).status).toBe(422);
    expect(getTodos()).toHaveLength(0);
  });
});

describe("existing TODO save validation", () => {
  it("still accepts a manual date-only draft", async () => {
    const { startAt, endAt, ...manual } = draft;
    const result = await save(request({ ...manual, durationMinutes: "60" }));
    expect(result.status).toBe(201);
    expect(await result.json()).toMatchObject({ ...manual, durationMinutes: 60 });
  });

  it.each([null, {}, { ...draft, title: "" }, { ...draft, durationMinutes: 31 },
    { ...draft, startDate: "2026-10-27" }, { ...draft, endAt: undefined },
  ])("rejects invalid saves without changing the list: %j", async (body) => {
    expect((await save(request(body))).status).toBe(400);
    expect(getTodos()).toHaveLength(0);
  });
});
