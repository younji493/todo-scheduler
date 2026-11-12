import { requireUser, apiError } from "../../../features/auth/serverAuth.js";
import { extractSchedule } from "../../../features/chat/scheduleExtraction.js";
import { scheduleToTodoResponse } from "../../../features/chat/scheduleToTodo.js";

export async function POST(request) {
  try { await requireUser(); } catch (error) { return apiError(error); }
  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!message) {
    return Response.json({ success: false, message: "메시지를 입력해주세요." }, { status: 400 });
  }

  try {
    const schedule = await extractSchedule(message, {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || undefined,
    });

    return Response.json(scheduleToTodoResponse(schedule));
  } catch (error) {
    console.error("[api/chat]", error);

    return Response.json(
      { success: false, message: "일정을 해석하지 못했어요. 잠시 후 다시 시도해주세요." },
      { status: 502 },
    );
  }
}
