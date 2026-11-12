const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthForm(mode, values) {
  const errors = {};
  const { name = "", email = "", password = "", passwordConfirmation = "" } = values;

  if (mode === "signup" && !name.trim()) {
    errors.name = "이름을 입력해 주세요.";
  }

  if (!EMAIL_PATTERN.test(email)) {
    errors.email = "올바른 이메일 주소를 입력해 주세요.";
  }

  if (!password) {
    errors.password = "비밀번호를 입력해 주세요.";
  }

  if (mode === "signup" && password && password.length < 8) {
    errors.password = "비밀번호는 8자 이상 입력해 주세요.";
  }

  if (mode === "signup" && password !== passwordConfirmation) {
    errors.passwordConfirmation = "비밀번호가 일치하지 않습니다.";
  }

  return errors;
}
