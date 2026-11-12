import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../features/auth/serverAuth.js", () => ({ requireUser: vi.fn().mockResolvedValue({ user: { id: "user-a" } }), apiError: vi.fn() }));

import { POST } from "../../../../app/api/chat/route.js";

function chatRequest(body) {
  return new Request("http://localhost/api/chat", { method: "POST", body: JSON.stringify(body) });
}

describe("POST /api/chat", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("rejects an empty message", async () => {
    const response = await POST(chatRequest({ message: "  " }));

    expect(response.status).toBe(400);
  });

  it("returns the converted todo", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({
          title: "공부", startAt: "2026-10-28T15:00:00+09:00", endAt: "2026-10-28T16:00:00+09:00",
          durationMinutes: 60, ready: true,
        }) } }],
      }),
    }));

    const body = await (await POST(chatRequest({ message: "내일 3시 1시간 공부" }))).json();

    expect(body.success).toBe(true);
    expect(body.todo).toMatchObject({ title: "공부", startDate: "2026-10-28", durationMinutes: 60 });
  });

  it("returns 502 when OpenAI fails", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(chatRequest({ message: "공부" }));

    expect(response.status).toBe(502);
  });
});
