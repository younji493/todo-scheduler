// 지금 당장은 서버에 저장하지 않고, 메모리에서만 유지되는 임시 저장소를 사용합니다.

let todos = [];

export function getTodos() {
  return todos;
}

export function addTodo(todo) {
  todos.push(todo);
  return todo;
}

export function updateTodo(id, updates) {
  const todoIndex = todos.findIndex((todo) => todo.id === id);

  if (todoIndex === -1) {
    return null;
  }

  todos[todoIndex] = {
    ...todos[todoIndex],
    ...updates,
  };

  return todos[todoIndex];
}