// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ client: vi.fn(), signInWithPassword: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), getUser: vi.fn(), exchangeCodeForSession: vi.fn() }));
vi.mock("../../../../lib/supabase/server.js", () => ({ createSupabaseServerClient: mock.client }));
import { POST as login } from "../../../../app/api/login/route.js";
import { POST as signup } from "../../../../app/api/signup/route.js";
import { POST as logout } from "../../../../app/api/logout/route.js";
import { GET as me } from "../../../../app/api/auth/me/route.js";
import { GET as callback } from "../../../../app/auth/callback/route.js";
const user = { id: "a", email: "a@example.com", user_metadata: { name: "민지" } };
const values = { name: "민지", email: "a@example.com", password: "long-password", passwordConfirmation: "long-password" };
const request = body => new Request("http://localhost:3000/api/auth", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => { vi.resetAllMocks(); mock.client.mockResolvedValue({ auth: mock }); });
it("creates a real Auth account with name metadata and the local confirmation callback", async () => {
  mock.signUp.mockResolvedValue({ data: { user, session: null }, error: null });
  const response = await signup(request(values));
  expect(await response.json()).toMatchObject({ success: true, requiresEmailConfirmation: true });
  expect(mock.signUp).toHaveBeenCalledWith({ email: values.email, password: values.password, options: { data: { name: "민지" }, emailRedirectTo: "http://localhost:3000/auth/callback" } });
});
it("rejects weak or mismatched passwords before contacting Auth", async () => {
  expect((await signup(request({ ...values, password: "short" }))).status).toBe(400);
  expect(mock.signUp).not.toHaveBeenCalled();
});
it("signs in with Supabase and only returns public user fields", async () => {
  mock.signInWithPassword.mockResolvedValue({ data: { user, session: { access_token: "secret" } }, error: null });
  const response = await login(request(values)); const result = await response.json();
  expect(result.user).toEqual({ id: "a", email: "a@example.com", name: "민지" });
  expect(JSON.stringify(result)).not.toContain("secret");
});
it("does not treat invalid credentials as a session", async () => {
  mock.signInWithPassword.mockResolvedValue({ data: {}, error: { code: "invalid_credentials" } });
  expect((await login(request(values))).status).toBe(400);
});
it("gets the user from verified Auth, not a preview flag", async () => {
  mock.getUser.mockResolvedValue({ data: { user: null }, error: { message: "expired" } });
  expect((await me()).status).toBe(401);
  mock.getUser.mockResolvedValue({ data: { user }, error: null });
  expect(await (await me()).json()).toMatchObject({ user: { id: "a" } });
});
it("signs out the current cookie session", async () => {
  mock.signOut.mockResolvedValue({ error: null });
  expect((await logout()).status).toBe(200);
  expect(mock.signOut).toHaveBeenCalledWith({ scope: "local" });
});
it("exchanges an email confirmation code and redirects only within the app", async () => {
  mock.exchangeCodeForSession.mockResolvedValue({ error: null });
  const response = await callback(new Request("http://localhost:3000/auth/callback?code=valid&next=https://evil.invalid"));
  expect(response.headers.get("location")).toBe("http://localhost:3000/");
  expect(mock.exchangeCodeForSession).toHaveBeenCalledWith("valid");
});
it("sends expired email links back to a helpful login error", async () => {
  mock.exchangeCodeForSession.mockResolvedValue({ error: { message: "expired" } });
  const response = await callback(new Request("http://localhost:3000/auth/callback?code=expired"));
  expect(response.headers.get("location")).toContain("/login?error=confirmation");
});
