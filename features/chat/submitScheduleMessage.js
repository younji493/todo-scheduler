const AI_SCHEDULE_URL = "/api/ai-schedule";
const NETWORK_ERROR_MESSAGE = "서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.";
const SAVE_ERROR_MESSAGE = "일정을 저장하지 못했어요. 잠시 후 다시 시도해주세요.";

function formatTime(isoDateTime) {
  return isoDateTime.slice(11, 16);
}

function describeAddedTodo(todo) {
  const when = todo.startAt && todo.endAt
    ? `${todo.startDate} ${formatTime(todo.startAt)}~${formatTime(todo.endAt)}`
    : todo.startDate;

  return `“${todo.title}” 일정을 추가했어요. (${when})`;
}

export async function submitScheduleMessage(message, addTodo, fetchImpl = fetch) {
  let result;

  try {
    const response = await fetchImpl(AI_SCHEDULE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    result = await response.json();
  } catch {
    return { ok: false, text: NETWORK_ERROR_MESSAGE };
  }

  if (!result?.success) {
    return { ok: false, text: result?.message || NETWORK_ERROR_MESSAGE };
  }

  let validation;
  try { validation = await addTodo(result.todo); }
  catch { return { ok: false, text: SAVE_ERROR_MESSAGE }; }

  if (!validation?.isValid) {
    return { ok: false, text: SAVE_ERROR_MESSAGE };
  }

  return { ok: true, text: describeAddedTodo(result.todo) };
}
