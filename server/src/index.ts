import "dotenv/config";

import cors from "cors";
import express from "express";
import type { ErrorRequestHandler } from "express";

import { currentDatabase, pool } from "./db.js";
import { ensureSchema } from "./schema.js";
import { todosRouter } from "./todos.js";

const PORT = Number(process.env.PORT ?? 4000);

const app = express();
app.use(cors());
app.use(express.json());

/** Reports liveness plus which database this process is pointed at. */
app.get("/api/health", async (_req, res) => {
  res.json({ status: "ok", database: await currentDatabase() });
});

app.use("/api/todos", todosRouter);

// Express 5 forwards rejected promises from handlers to here.
const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("[api]", err);
  res.status(500).json({ error: "internal server error" });
};
app.use(onError);

async function main(): Promise<void> {
  await ensureSchema();
  const database = await currentDatabase();

  app.listen(PORT, () => {
    console.log(`[api] listening on http://localhost:${PORT}`);
    console.log(`[api] connected to database "${database}"`);
  });
}

main().catch(async (err) => {
  console.error("[api] failed to start:", err);
  await pool.end().catch(() => {});
  process.exit(1);
});
