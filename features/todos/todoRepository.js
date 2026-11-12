import { HttpError } from "../auth/serverAuth.js";
const COLUMNS = "id,title,start_date,due_date,duration_minutes,start_at,end_at,priority,completed";

function seoulDateTime(value) {
  return new Date(Date.parse(value) + 9 * 3600000).toISOString().slice(0, 19) + "+09:00";
}
export function fromTodoRow(row) {
  return {
    id: row.id, title: row.title, startDate: row.start_date, dueDate: row.due_date,
    durationMinutes: row.duration_minutes, priority: row.priority, completed: row.completed,
    ...(row.start_at && row.end_at ? { startAt: seoulDateTime(row.start_at), endAt: seoulDateTime(row.end_at) } : {}),
  };
}
function checkError(error) {
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") throw new HttpError("일정 데이터베이스 초기 설정이 필요합니다.", 503);
    throw new Error("Todo database request failed");
  }
}
export async function listTodos(supabase, userId) {
  const { data, error } = await supabase.from("todos").select(COLUMNS).eq("user_id", userId).order("created_at", { ascending: true });
  checkError(error);
  return data.map(fromTodoRow);
}
export async function insertTodo(supabase, userId, draft) {
  const { data, error } = await supabase.from("todos").insert({
    user_id: userId, title: draft.title.trim(), start_date: draft.startDate, due_date: draft.dueDate,
    duration_minutes: Number(draft.durationMinutes), start_at: draft.startAt || null, end_at: draft.endAt || null,
  }).select(COLUMNS).single();
  checkError(error);
  return fromTodoRow(data);
}
export async function setTodoCompleted(supabase, userId, id, completed) {
  const { data, error } = await supabase.from("todos").update({ completed }).eq("user_id", userId).eq("id", id).select(COLUMNS).maybeSingle();
  checkError(error);
  return data ? fromTodoRow(data) : null;
}
