import { pool } from "./db.js";

/**
 * Creates the schema if it is missing.
 *
 * Running this on boot means any database the connection string points at —
 * including a freshly created branch — becomes usable without a separate
 * migration step.
 */
export async function ensureSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id         SERIAL PRIMARY KEY,
      title      TEXT        NOT NULL,
      completed  BOOLEAN     NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}
