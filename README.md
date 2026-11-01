# Minimal Full-Stack Todo App

React + TypeScript + Vite frontend, Express + TypeScript backend, PostgreSQL storage,
Docker Compose for the database.

```
project/
├── docker-compose.yml   PostgreSQL 17 for local development
├── server/              Express API (port 4000)
│   └── src/
│       ├── index.ts     app wiring, health endpoint, bootstrap
│       ├── db.ts        pg connection pool (reads DATABASE_URL)
│       ├── schema.ts    CREATE TABLE IF NOT EXISTS on boot
│       └── todos.ts     CRUD routes
└── client/              Vite + React UI (port 5173)
    └── src/
        ├── App.tsx      UI component and state
        ├── styles.css   styling (light + dark mode)
        ├── api.ts       typed fetch wrapper
        └── main.tsx     entry point
```

## Quick start

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)
(running) and [Node.js](https://nodejs.org/) 20 or newer.

```powershell
npm run setup   # once: install all dependencies, create server\.env
npm run dev     # start Postgres, wait until healthy, run API + UI together
```

Open <http://localhost:5173>. `Ctrl+C` stops the API and UI; Postgres keeps
running in the background until `npm run db:down`.

## Running step by step (Windows)

The quick start does all of this for you. Use these steps to run each piece in
its own terminal, or to troubleshoot.

In PowerShell, chain commands with `;` — `&&` does not work in Windows
PowerShell 5.1.

### 1. Start Docker Desktop

Launch Docker Desktop and wait until the whale icon in the system tray stops
animating and its dashboard reads **Engine running**. Commands issued before
that fail with a `500 Internal Server Error ... docker_engine` message.

### 2. Install dependencies (once)

```powershell
npm install
npm run install:all
```

### 3. Start PostgreSQL

```powershell
npm run db:up
```

This returns once the container's healthcheck passes. Verify it is accepting connections:

```powershell
docker compose ps
docker compose exec postgres psql -U todo -d todo -c "\dt"
```

### 4. Configure and start the backend

```powershell
Copy-Item server\.env.example server\.env
npm run dev:server
```

Expected output:

```
[api] listening on http://localhost:4000
[api] connected to database "todo"
```

The `todos` table is created automatically on startup.

### 5. Start the frontend (second terminal)

```powershell
npm run dev:client
```

Open <http://localhost:5173>. Add, complete, and delete todos.

### Stopping

```powershell
npm run db:down      # stop Postgres, keep data
npm run db:reset     # stop Postgres, DELETE the volume, start fresh
```

## Configuration

The backend reads exactly two environment variables, from `server/.env`:

| Variable       | Default                                     | Purpose                     |
| -------------- | ------------------------------------------- | --------------------------- |
| `DATABASE_URL` | *(required)*                                | PostgreSQL connection string |
| `PORT`         | `4000`                                      | API listen port             |

`DATABASE_URL` is the **only** database configuration. There are no separate
host / port / user / database variables to keep in sync.

## API

Base URL `http://localhost:4000`. The Vite dev server proxies `/api` here, so the
browser talks to its own origin.

| Method   | Path              | Body                                   | Response            |
| -------- | ----------------- | -------------------------------------- | ------------------- |
| `GET`    | `/api/health`     | –                                      | `200` status + database name |
| `GET`    | `/api/todos`      | –                                      | `200` array of todos, newest first |
| `POST`   | `/api/todos`      | `{ "title": "..." }`                   | `201` created todo  |
| `PATCH`  | `/api/todos/:id`  | `{ "title"?: ..., "completed"?: ... }` | `200` updated todo / `404` |
| `DELETE` | `/api/todos/:id`  | –                                      | `204` / `404`       |

### Schema

```sql
CREATE TABLE todos (
  id         SERIAL PRIMARY KEY,
  title      TEXT        NOT NULL,
  completed  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Quick check with curl

PowerShell aliases `curl` to `Invoke-WebRequest`; use `curl.exe` explicitly.

```powershell
curl.exe http://localhost:4000/api/health
curl.exe -X POST http://localhost:4000/api/todos -H "Content-Type: application/json" -d "{\"title\":\"buy milk\"}"
curl.exe http://localhost:4000/api/todos
```

## Built for database branching

Branching is **not implemented here** — it will be developed separately. The
architecture simply keeps the door open for it:

- **One connection string, one place.** `server/src/db.ts` builds the pool from
  `DATABASE_URL` and nothing else. Repointing the API at another database — a
  branch, a staging copy, a managed Postgres endpoint — means editing that one
  value and restarting. No code touches a database name, host, or port anywhere else.
- **Standard protocol.** The `pg` driver speaks the normal PostgreSQL wire
  protocol over TCP, so any protocol-compatible endpoint works unchanged.
  SSL-requiring providers need only `?sslmode=require` appended to the URL.
- **Self-provisioning schema.** `ensureSchema()` runs `CREATE TABLE IF NOT
  EXISTS` at startup, so a brand-new, empty branch becomes usable immediately
  with no separate migration step.
- **Visible target.** `GET /api/health` returns `current_database()`, and the UI
  shows it in the header — so a demo can prove which database is being served.

Switching databases is therefore:

```powershell
# edit server\.env  ->  DATABASE_URL=postgres://todo:todo@localhost:5432/todo_feature_x
npm run dev:server
```

## Scripts

| Command                | Effect                                        |
| ---------------------- | --------------------------------------------- |
| `npm run setup`        | Install all dependencies, create `server/.env` if missing |
| `npm run dev`          | Start Postgres, then API + UI in one terminal |
| `npm run install:all`  | Install server + client dependencies          |
| `npm run db:up`        | Start PostgreSQL and wait until it is healthy |
| `npm run db:down`      | Stop PostgreSQL (data kept in the volume)     |
| `npm run db:reset`     | Destroy the volume and start a clean database |
| `npm run dev:server`   | API with reload on change                     |
| `npm run dev:client`   | Vite dev server                               |
| `npm run typecheck`    | Typecheck both packages                       |
