import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AuthForm from "../../../components/auth/AuthForm.js";

describe("AuthForm", () => {
  it("prevents demo login submission when the email is invalid", () => {
    let submitCount = 0;

    render(
      <AuthForm
        mode="login"
        onSuccess={() => {
          submitCount += 1;
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "not-an-email" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "planner123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(submitCount).toBe(0);
    expect(screen.getByText("올바른 이메일 주소를 입력해 주세요.")).toBeInTheDocument();
  });

  it("passes validated signup values to the success handler", () => {
    let submittedValues;

    render(
      <AuthForm
        mode="signup"
        onSuccess={(values) => {
          submittedValues = values;
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText("이름"), {
      target: { value: "민지" },
    });
    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "minji@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "planner123" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호 확인"), {
      target: { value: "planner123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "회원가입" }));

    expect(submittedValues).toMatchObject({
      name: "민지",
      email: "minji@example.com",
      password: "planner123",
      passwordConfirmation: "planner123",
    });
  });
});
