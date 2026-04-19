## Simple in-browser calorie counter for both meals and workouts.

The UI is a [Next.js](https://nextjs.org) 16 app (App Router); API routes and Auth.js behave as before.

## 🧞 Commands

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

Sign-in uses Google OAuth ([Auth.js `@auth/core`](https://authjs.dev)) at `/api/auth/*`. Open `/api/auth/signin`, then use the built-in Google button (it POSTs to complete OAuth). A plain GET link to `/api/auth/signin/google` is not supported in current Auth.js. Set these environment variables (for example in Vercel or a local `.env`):

- `AUTH_SECRET` — random secret (e.g. `openssl rand -base64 32`)
- `AUTH_URL` — canonical site URL (for example `http://localhost:4321` in dev, production URL in deploy)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console; authorized redirect URI must be `{AUTH_URL}/api/auth/callback/google` (adjust origin per environment).
- `DATABASE_URL` — Neon connection string (required for sign-in user upsert and for migrations).

After changing the Drizzle schema, run `npm run db:generate`, commit files under `drizzle/`, then apply them to your Neon branch before deploying (for example `npm run db:migrate` with `DATABASE_URL` set, or run the SQL from `drizzle/` in the Neon SQL editor).
