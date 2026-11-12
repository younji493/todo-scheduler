import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import AuthScreen from "../../../components/auth/AuthScreen.jsx";
import AuthGuard from "../../../features/auth/AuthGuard.jsx";
const { replace, refresh } = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
beforeEach(() => { replace.mockClear(); refresh.mockClear(); vi.stubGlobal("fetch", vi.fn()); });
afterEach(() => vi.unstubAllGlobals());
const json = (data, ok = true, status = 200) => ({ ok, status, json: async () => data });
function fill(mode = "login") {
  for (const [label, value] of [["이메일", "test@example.com"], ["비밀번호", "test-password"], ...(mode === "signup" ? [["이름", "홍길동"], ["비밀번호 확인", "test-password"]] : [])]) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
  fireEvent.click(screen.getByRole("button", { name: mode === "signup" ? "회원가입" : "로그인" }));
}
it("denies dashboard access when the server reports no session", async () => {
  fetch.mockResolvedValue(json({}, false, 401));
  render(<AuthGuard><p>Private dashboard</p></AuthGuard>);
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  expect(screen.queryByText("Private dashboard")).not.toBeInTheDocument();
});
it("verifies the session on the server before showing private content", async () => {
  fetch.mockResolvedValue(json({ user: { id: "a", name: "홍길동" } }));
  render(<AuthGuard><p>Private dashboard</p></AuthGuard>);
  expect(await screen.findByText("Private dashboard")).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith("/api/auth/me", expect.objectContaining({ cache: "no-store" }));
});
it("submits login credentials and navigates only on successful authentication", async () => {
  fetch.mockResolvedValue(json({ success: true }));
  render(<AuthScreen mode="login" />); fill();
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  expect(fetch).toHaveBeenCalledWith("/api/login", expect.objectContaining({ method: "POST", body: expect.stringContaining("test@example.com") }));
});
it("keeps an invalid login on the form and displays the server error", async () => {
  fetch.mockResolvedValue(json({ message: "이메일 또는 비밀번호를 확인해주세요." }, false, 400));
  render(<AuthScreen mode="login" />); fill();
  expect(await screen.findByRole("alert")).toHaveTextContent("이메일 또는 비밀번호");
  expect(replace).not.toHaveBeenCalled();
});
it("requires email confirmation rather than pretending to sign in", async () => {
  fetch.mockResolvedValue(json({ success: true, requiresEmailConfirmation: true }));
  render(<AuthScreen mode="signup" />); fill("signup");
  expect(await screen.findByRole("status")).toHaveTextContent("가입 확인 이메일");
  expect(replace).not.toHaveBeenCalled();
});
it("disables a pending login to prevent duplicate submissions", async () => {
  fetch.mockReturnValue(new Promise(() => {}));
  render(<AuthScreen mode="login" />); fill();
  expect(screen.getByRole("button", { name: "처리 중…" })).toBeDisabled();
  expect(fetch).toHaveBeenCalledTimes(1);
});
