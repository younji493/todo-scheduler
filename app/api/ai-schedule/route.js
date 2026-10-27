import { NextResponse } from "next/server";

import { AIScheduleError, extractTodoSchedule } from "../../../features/todos/aiSchedule.js";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "올바른 JSON 요청을 보내주세요." }, { status: 400 });
  }

  if (typeof body?.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ success: false, message: "일정을 입력해주세요." }, { status: 400 });
  }
  if (body.message.length > 2000) {
    return NextResponse.json({ success: false, message: "일정은 2,000자 이내로 입력해주세요." }, { status: 400 });
  }

  try {
    const result = await extractTodoSchedule(body.message.trim());
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof AIScheduleError ? error.status : 500;
    const message = error instanceof AIScheduleError ? error.message : "AI 일정 분석 중 오류가 발생했습니다.";
    return NextResponse.json({ success: false, message }, { status });
  }
}
