import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { api, type Todo } from "./api.js";

export function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [database, setDatabase] = useState("…");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Any failed call surfaces in one place rather than being swallowed.
  const run = async (fn: () => Promise<void>) => {
    try {
      setError(null);
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    void run(async () => {
      const [list, health] = await Promise.all([api.list(), api.health()]);
      setTodos(list);
      setDatabase(health.database);
    }).finally(() => setLoading(false));
  }, []);

  const add = (event: FormEvent) => {
    event.preventDefault();
    const value = title.trim();
    if (!value) return;

    void run(async () => {
      const created = await api.create(value);
      setTodos((current) => [created, ...current]);
      setTitle("");
    });
  };

  const toggle = (todo: Todo) =>
    void run(async () => {
      const updated = await api.update(todo.id, { completed: !todo.completed });
      setTodos((current) => current.map((t) => (t.id === updated.id ? updated : t)));
    });

  const remove = (todo: Todo) =>
    void run(async () => {
      await api.remove(todo.id);
      setTodos((current) => current.filter((t) => t.id !== todo.id));
    });

  const remaining = todos.filter((todo) => !todo.completed).length;
  const done = todos.length - remaining;
  const progress = todos.length === 0 ? 0 : Math.round((done / todos.length) * 100);

  return (
    <main className="card">
      <header>
        <div className="title-row">
          <h1>Todos</h1>
          <span className="db-badge" title="Connected database">
            <span className="dot" aria-hidden="true" />
            {database}
          </span>
        </div>
        <p className="meta">
          {remaining} open · {done} done · {todos.length} total
        </p>
        <div
          className="progress"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Completed"
        >
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <form onSubmit={add}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs doing?"
          aria-label="Todo title"
        />
        <button type="submit" className="add" disabled={!title.trim()}>
          <span aria-hidden="true">+</span> Add
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <ul className="skeleton" aria-label="Loading">
          <li />
          <li />
          <li />
        </ul>
      ) : todos.length === 0 ? (
        <div className="empty">
          <div className="empty-icon" aria-hidden="true">✓</div>
          <p>Nothing here yet.</p>
          <p className="meta">Add your first task above.</p>
        </div>
      ) : (
        <ul className="list">
          {todos.map((todo) => (
            <li key={todo.id} className={todo.completed ? "is-done" : undefined}>
              <label>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggle(todo)}
                />
                <span className="check" aria-hidden="true" />
                <span className="text">{todo.title}</span>
              </label>
              <time dateTime={todo.created_at}>
                {new Date(todo.created_at).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </time>
              <button
                type="button"
                className="delete"
                onClick={() => remove(todo)}
                aria-label="Delete"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
