import { requireUser, apiError } from "../../../../features/auth/serverAuth.js";
import { setTodoCompleted } from "../../../../features/todos/todoRepository.js";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function PATCH(request, { params }) {
  try {
    const { supabase, user } = await requireUser();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!UUID.test(id) || !body || typeof body.completed !== "boolean" || Object.keys(body).some(key => key !== "completed")) {
      return Response.json({ message: "올바른 할 일 ID와 완료 상태를 보내주세요." }, { status: 400 });
    }
    const todo = await setTodoCompleted(supabase, user.id, id, body.completed);
    if (!todo) return Response.json({ message: "할 일을 찾을 수 없습니다." }, { status: 404 });
    return Response.json(todo, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error, "할 일을 수정하지 못했습니다."); }
}
