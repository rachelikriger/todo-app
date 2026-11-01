export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
}

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const api = {
  health: () => request<{ status: string; database: string }>("/health"),
  list: () => request<Todo[]>("/todos"),
  create: (title: string) =>
    request<Todo>("/todos", { method: "POST", body: JSON.stringify({ title }) }),
  update: (id: number, patch: { title?: string; completed?: boolean }) =>
    request<Todo>(`/todos/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  remove: (id: number) => request<void>(`/todos/${id}`, { method: "DELETE" }),
};
