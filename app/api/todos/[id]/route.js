import { NextResponse } from "next/server";

import { updateTodo } from "../../../../features/todos/todoServerStore.js";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedTodo = updateTodo(id, body);

    if (!updatedTodo) {
      return NextResponse.json(
        { message: "할 일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTodo);
  } catch {
    return NextResponse.json(
      { message: "할 일을 수정하지 못했습니다." },
      { status: 500 }
    );
  }
}