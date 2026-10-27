import { validateTodoDraft } from "./todoModel.js";

// Keep date-only fields compatible with the existing TODO form; retain exact times separately.
export function isSeoulDateTime(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/.test(value)) {
    return false;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    && new Date(timestamp + 9 * 60 * 60 * 1000).toISOString().slice(0, 19) === value.slice(0, 19);
}

export function validateServerTodo(draft) {
  const validation = validateTodoDraft(draft);
  const fieldErrors = { ...validation.fieldErrors };

  if (typeof draft?.title !== "string") {
    fieldErrors.title = "할 일을 입력해주세요.";
  }

  if (draft?.startAt !== undefined || draft?.endAt !== undefined) {
    if (!isSeoulDateTime(draft.startAt) || !isSeoulDateTime(draft.endAt)) {
      fieldErrors.startAt = "시작·종료 시각은 한국 시간(+09:00)으로 입력해주세요.";
    } else if (
      draft.startAt.slice(0, 10) !== draft.startDate
      || draft.endAt.slice(0, 10) !== draft.dueDate
      || Date.parse(draft.endAt) - Date.parse(draft.startAt) !== Number(draft.durationMinutes) * 60000
    ) {
      fieldErrors.startAt = "날짜, 시작·종료 시각과 소요 시간이 일치하지 않습니다.";
    }
  }

  return { isValid: Object.keys(fieldErrors).length === 0, fieldErrors };
}
