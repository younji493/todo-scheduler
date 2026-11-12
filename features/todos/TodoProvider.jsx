"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { validateTodoDraft } from "./todoModel.js";
import { useCalendarToday } from "../calendar/useCalendarToday.js";

const TodoContext = createContext(null);

export function TodoProvider({ children, initialTasks = [] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const todayDate = useCalendarToday();
  const mutationVersion = useRef(0);

  const refreshTodos = useCallback(async () => {
    const version = mutationVersion.current;
    try {
      const response = await fetch("/api/todos", { cache: "no-store" });

      if (!response.ok) {
        if (response.status === 401) setTasks([]);
        throw new Error(response.status === 401 ? "로그인이 만료됐어요. 다시 로그인해주세요." : "할 일 목록 조회 실패");
      }

      const todos = await response.json();

      // The authenticated database is authoritative; do not retain another session's tasks.
      if (version === mutationVersion.current) setTasks(todos);
      setError("");
    } catch (error) {
      setError(error.message || "할 일 목록 조회 실패");
      throw error;
    }
  }, []);

  useEffect(() => {
    refreshTodos().catch((error) => {
      setError(error.message);
    }).finally(() => setIsLoading(false));
  }, [refreshTodos]);

  const addTodo = useCallback(async (draft) => {
    const validation = validateTodoDraft(draft);

    if (!validation.isValid) {
      return validation;
    }

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        throw new Error("할 일 저장 실패");
      }

      const newTodo = await response.json();
      mutationVersion.current += 1;
      setTasks((currentTasks) => [...currentTasks, newTodo]);

      return validation;
    } catch {
      return {
        isValid: false,
        fieldErrors: { title: "할 일을 저장하지 못했습니다." },
      };
    }
  }, []);

  const toggleTodoComplete = useCallback(async (taskId) => {
    const targetTask = tasks.find((task) => task.id === taskId);

    if (!targetTask) {
      return;
    }

    try {
      const response = await fetch(`/api/todos/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !targetTask.completed }),
      });

      if (!response.ok) {
        throw new Error("할 일 수정 실패");
      }

      const updatedTodo = await response.json();
      mutationVersion.current += 1;
      setError("");
      setTasks((currentTasks) => currentTasks.map((task) => (
        task.id === taskId ? updatedTodo : task
      )));
    } catch (error) {
      setError("완료 상태를 저장하지 못했어요. 다시 시도해주세요.");
    }
  }, [tasks]);

  const value = useMemo(() => ({
    todayDate,
    error,
    isLoading,
    tasks,
    addTodo,
    toggleTodoComplete,
    refreshTodos,
  }), [tasks, addTodo, toggleTodoComplete, refreshTodos, todayDate, error, isLoading]);

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
}

export function useTodos() {
  const todoContext = useContext(TodoContext);

  if (!todoContext) {
    throw new Error("useTodos must be used within a TodoProvider");
  }

  return todoContext;
}
