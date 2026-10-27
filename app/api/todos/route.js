import { NextResponse } from "next/server";

import { createTodo } from "../../../features/todos/todoModel.js";
import { validateServerTodo } from "../../../features/todos/todoServerValidation.js";
import { addTodo, getTodos } from "../../../features/todos/todoServerStore.js";

export async function GET() {
  return NextResponse.json(getTodos(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "올바른 JSON 요청을 보내주세요." }, { status: 400 });
  }

  const validation = validateServerTodo(body);
  if (!validation.isValid) {
    return NextResponse.json({ message: "할 일 정보를 확인해주세요.", fieldErrors: validation.fieldErrors }, { status: 400 });
  }

  try {
    const { syncStatus, ...newTodo } = createTodo(body);
    if (body.startAt !== undefined) {
      newTodo.startAt = body.startAt;
      newTodo.endAt = body.endAt;
    }
    const savedTodo = addTodo(newTodo);
    return NextResponse.json(savedTodo, { status: 201 });
  } catch {
    return NextResponse.json({ message: "할 일을 추가하지 못했습니다." }, { status: 500 });
  }
}
