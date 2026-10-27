"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { validateTodoDraft } from "./todoModel.js";

const TodoContext = createContext(null);

export function TodoProvider({ children, initialTasks = [] }) {
  const [tasks, setTasks] = useState(initialTasks);

  const refreshTodos = useCallback(async () => {
    const response = await fetch("/api/todos", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("할 일 목록 조회 실패");
    }

    const todos = await response.json();

    setTasks((currentTasks) => {
      const taskMap = new Map(currentTasks.map((task) => [task.id, task]));

      todos.forEach((todo) => {
        taskMap.set(todo.id, todo);
      });

      return Array.from(taskMap.values());
    });
  }, []);

  useEffect(() => {
    refreshTodos().catch((error) => {
      console.error("Todo 조회 오류:", error);
    });
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
      setTasks((currentTasks) => currentTasks.map((task) => (
        task.id === taskId ? updatedTodo : task
      )));
    } catch (error) {
      console.error("Todo 수정 오류:", error);
    }
  }, [tasks]);

  const value = useMemo(() => ({
    tasks,
    addTodo,
    toggleTodoComplete,
    refreshTodos,
  }), [tasks, addTodo, toggleTodoComplete, refreshTodos]);

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
}

export function useTodos() {
  const todoContext = useContext(TodoContext);

  if (!todoContext) {
    throw new Error("useTodos must be used within a TodoProvider");
  }

  return todoContext;
}
