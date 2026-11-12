"use client";

import { createElement, useState } from "react";

import { validateAuthForm } from "../../features/auth/authValidation.js";

const EMPTY_VALUES = {
  name: "",
  email: "",
  password: "",
  passwordConfirmation: "",
};

function Field({ autoComplete, error, id, label, name, onChange, type = "text", value }) {
  const errorId = `${id}-error`;

  return createElement(
    "div",
    { className: "space-y-2" },
    createElement("label", { className: "block text-sm font-bold text-[#4d5577]", htmlFor: id }, label),
    createElement("input", {
      className: "w-full rounded-xl border border-[#e8e0d6] bg-[#fffdfa] px-3.5 py-3 text-sm text-[#2d3559] outline-none transition placeholder:text-[#b1b2c2] focus:border-[#aa9bea] focus:ring-4 focus:ring-[#ede9ff]",
      id,
      name,
      autoComplete,
      required: true,
      placeholder: label === "이메일" ? "hello@example.com" : undefined,
      type,
      value,
      onChange,
      "aria-invalid": Boolean(error),
      "aria-describedby": error ? errorId : undefined,
    }),
    error && createElement("p", { className: "text-xs font-medium text-[#a84f38]", id: errorId, role: "alert" }, error),
  );
}

export default function AuthForm({ mode, onSuccess, pending = false }) {
  const isSignup = mode === "signup";
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((currentValues) => ({ ...currentValues, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (pending) return;

    const nextErrors = validateAuthForm(mode, values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      onSuccess(values);
    }
  };

  return createElement(
    "form",
    { className: "space-y-4", onSubmit: handleSubmit, noValidate: true },
    isSignup && createElement(Field, {
      error: errors.name,
      id: "auth-name",
      label: "이름",
      name: "name",
      autoComplete: "name",
      onChange: handleChange,
      value: values.name,
    }),
    createElement(Field, {
      error: errors.email,
      id: "auth-email",
      label: "이메일",
      name: "email",
      autoComplete: "email",
      onChange: handleChange,
      type: "email",
      value: values.email,
    }),
    createElement(Field, {
      error: errors.password,
      id: "auth-password",
      label: "비밀번호",
      name: "password",
      autoComplete: isSignup ? "new-password" : "current-password",
      onChange: handleChange,
      type: "password",
      value: values.password,
    }),
    isSignup && createElement(Field, {
      error: errors.passwordConfirmation,
      id: "auth-password-confirmation",
      label: "비밀번호 확인",
      name: "passwordConfirmation",
      autoComplete: "new-password",
      onChange: handleChange,
      type: "password",
      value: values.passwordConfirmation,
    }),
    createElement(
      "button",
      {
        className: "mt-2 flex w-full items-center justify-center rounded-xl bg-[#2d3559] px-4 py-3.5 text-sm font-black text-white shadow-[0_12px_22px_rgba(45,53,89,0.2)] transition hover:-translate-y-0.5 hover:bg-[#424c78] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8f7ce7]",
        type: "submit",
        disabled: pending,
      },
      pending ? "처리 중…" : isSignup ? "회원가입" : "로그인",
    ),
  );
}
