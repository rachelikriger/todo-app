import { Router } from "express";
import { pool } from "./db.js";

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
}

export const todosRouter = Router();

const COLUMNS = "id, title, completed, created_at";

/** List all todos, newest first. */
todosRouter.get("/", async (_req, res) => {
  const { rows } = await pool.query<Todo>(
    `SELECT ${COLUMNS} FROM todos ORDER BY created_at DESC, id DESC`
  );
  res.json(rows);
});

/** Create a todo. */
todosRouter.post("/", async (req, res) => {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  const { rows } = await pool.query<Todo>(
    `INSERT INTO todos (title) VALUES ($1) RETURNING ${COLUMNS}`,
    [title]
  );
  res.status(201).json(rows[0]);
});

/** Update a todo's title and/or completed flag. */
todosRouter.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "id must be an integer" });
    return;
  }

  const { title, completed } = req.body ?? {};
  if (title === undefined && completed === undefined) {
    res.status(400).json({ error: "provide title and/or completed" });
    return;
  }
  if (title !== undefined && (typeof title !== "string" || !title.trim())) {
    res.status(400).json({ error: "title must be a non-empty string" });
    return;
  }
  if (completed !== undefined && typeof completed !== "boolean") {
    res.status(400).json({ error: "completed must be a boolean" });
    return;
  }

  // COALESCE keeps this a single static statement: a NULL parameter means
  // "leave this column alone".
  const { rows } = await pool.query<Todo>(
    `UPDATE todos
        SET title     = COALESCE($2, title),
            completed = COALESCE($3, completed)
      WHERE id = $1
      RETURNING ${COLUMNS}`,
    [id, title === undefined ? null : title.trim(), completed ?? null]
  );

  if (rows.length === 0) {
    res.status(404).json({ error: "todo not found" });
    return;
  }
  res.json(rows[0]);
});

/** Delete a todo. */
todosRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "id must be an integer" });
    return;
  }

  const { rowCount } = await pool.query("DELETE FROM todos WHERE id = $1", [id]);
  if (rowCount === 0) {
    res.status(404).json({ error: "todo not found" });
    return;
  }
  res.status(204).end();
});
