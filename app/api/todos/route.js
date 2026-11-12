import { requireUser, apiError } from "../../../features/auth/serverAuth.js";
import { listTodos, insertTodo } from "../../../features/todos/todoRepository.js";
import { validateServerTodo } from "../../../features/todos/todoServerValidation.js";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    return Response.json(await listTodos(supabase, user.id), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error, "할 일 목록을 불러오지 못했습니다."); }
}
export async function POST(request) {
  try {
    const { supabase, user } = await requireUser();
    const body = await request.json().catch(() => null);
    if (!body) return Response.json({ message: "올바른 JSON 요청을 보내주세요." }, { status: 400 });
    const validation = validateServerTodo(body);
    if (!validation.isValid) return Response.json({ message: "할 일 정보를 확인해주세요.", fieldErrors: validation.fieldErrors }, { status: 400 });
    return Response.json(await insertTodo(supabase, user.id, body), { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error, "할 일을 저장하지 못했습니다."); }
}
