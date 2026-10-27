
"use client";

import { useState } from "react";
import { useTodos } from "./TodoProvider";

export default function AIChat() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const { refreshTodos } = useTodos();

  async function handleSubmit(e) {
    e.preventDefault();

    if (!message.trim() || loading) return;

    setLoading(true);
    setResult("");

    try {
      // 1. GPT 일정 분석
      const aiRes = await fetch("/api/ai-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const aiData = await aiRes.json();

      if (!aiRes.ok) {
        throw new Error(aiData.message || "AI 분석 실패");
      }

      if (!aiData.success) {
        setResult(aiData.message);
        return;
      }

      // 2. 기존 TODO API에 저장
      const todoRes = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(aiData.todo),
      });

      if (!todoRes.ok) {
        throw new Error("일정 저장 실패");
      }

      // 3. 저장 후 TODO 목록 즉시 갱신
      await refreshTodos();

      setResult("일정이 추가되었어요! 🎉");
      setMessage("");

    } catch (error) {
      setResult(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="내일 오후 3시에 공부 추가해줘"
      />

      <button type="submit" disabled={loading}>
        {loading ? "추가 중..." : "AI 일정 추가"}
      </button>

      {result && <p>{result}</p>}
    </form>
  );
}
