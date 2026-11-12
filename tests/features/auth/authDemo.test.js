import { describe, expect, it } from "vitest";
import { validateAuthForm } from "../../../features/auth/authValidation.js";

describe("validateAuthForm", () => {
  it("accepts a complete signup form", () => {
    const errors = validateAuthForm("signup", {
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "correct-horse-battery-staple",
      passwordConfirmation: "correct-horse-battery-staple",
    });

    expect(errors).toEqual({});
  });

  it("reports an email error for a malformed login email", () => {
    const errors = validateAuthForm("login", {
      email: "not-an-email",
      password: "correct-horse-battery-staple",
    });

    expect(errors).toHaveProperty("email");
  });

  it("reports a confirmation error when signup passwords differ", () => {
    const errors = validateAuthForm("signup", {
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "correct-horse-battery-staple",
      passwordConfirmation: "different-password",
    });

    expect(errors).toHaveProperty("passwordConfirmation");
  });
});
