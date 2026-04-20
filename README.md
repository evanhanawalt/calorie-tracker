## Simple to use calorie counter

#### _That doesn't try to sell you anything_

<img width="771" height="1046" alt="Screenshot 2026-04-20 142752" src="https://github.com/user-attachments/assets/ad8e0a4e-281d-4d3f-8f7a-8d43585057b8" />

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Lint and production build to `.next/`            |
| `npm run start`           | Serves the production build on port 4321         |
| `npm run db:generate`     | Create a new SQL migration from Drizzle schema   |
| `npm run db:migrate`      | Apply committed migrations to Postgres (Neon)  |

## Authentication and database

Sign-in uses Google OAuth ([Auth.js `@auth/core`](https://authjs.dev)). Set these environment variables (for example in Vercel or a local `.env`):

- `AUTH_SECRET` — random secret (e.g. `openssl rand -base64 32`)
- `AUTH_URL` — canonical site URL (for example `http://localhost:4321` in dev, production URL in deploy)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console; authorized redirect URI must be `{AUTH_URL}/api/auth/callback/google` (adjust origin per environment).
- `DATABASE_URL` — Neon connection string (required for sign-in user upsert and for migrations).

## DB

After changing the Drizzle schema, run `npm run db:generate`, commit files under `drizzle/`, then apply them to your Neon branch before deploying (for example `npm run db:migrate` with `DATABASE_URL` set, or run the SQL from `drizzle/` in the Neon SQL editor).
