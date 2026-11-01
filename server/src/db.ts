import { Pool } from "pg";

/**
 * Single source of truth for the database target.
 *
 * Everything about *which* database we talk to lives in this one connection
 * string, which is why switching databases (local, branch, staging) requires
 * changing nothing but DATABASE_URL. `pg` speaks the standard PostgreSQL
 * wire protocol, so any protocol-compatible endpoint works unchanged.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy server/.env.example to server/.env and adjust it."
  );
}

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

// A pool-level error means an *idle* client died (network drop, database
// restart, branch torn down). Log it instead of letting it crash the process;
// the pool replaces the client on the next query.
pool.on("error", (err) => {
  console.error("[db] idle client error:", err.message);
});

/** Name of the database we are actually connected to — handy for demos. */
export async function currentDatabase(): Promise<string> {
  const { rows } = await pool.query<{ db: string }>(
    "SELECT current_database() AS db"
  );
  return rows[0]?.db ?? "unknown";
}
