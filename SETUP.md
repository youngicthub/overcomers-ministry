# Running this project outside Replit

This project uses **npm workspaces** (not pnpm). Running `npm install` from
the repo root installs and links every package under `artifacts/*` and
`lib/*` in one step, and will generate a fresh `package-lock.json` the first
time you run it.

This app was originally built to run on Replit (managed Postgres). Outside
Replit — locally, or via Claude Code — you need to provide a Neon Postgres
database and a couple of local env files. This guide walks through all of it.

There is no member login/signup on this site; it's fully public. The only
authenticated area is the separate Media Admin broadcast tool at `/admin/live`,
gated by an access token + emailed OTP (see step 3 below) — unrelated to any
third-party auth provider.

## 0. Prerequisites

- Node.js 24
- npm 10+ (ships with Node 24)

## 1. Install dependencies

```bash
npm install
```

## 2. Set up Neon Postgres

1. Create a free project at https://neon.tech if you don't have one.
2. Copy the **pooled connection string** from the Neon dashboard
   (Connection Details -> "Pooled connection").
3. Put it in `artifacts/api-server/.env` as `DATABASE_URL` (see step 4).
4. Push the schema to your new database:

   ```bash
   DATABASE_URL="your-neon-connection-string" npm run push --workspace=@workspace/db
   ```

   This creates the `prayer_requests`, `members`, `consultations`, and
   `contact_messages` tables that the prayer request, new-member,
   consultation, and contact forms now write to.

## 3. Create your env files

```bash
cp artifacts/api-server/.env.example artifacts/api-server/.env
cp artifacts/overcomers-faith-ministry/.env.example artifacts/overcomers-faith-ministry/.env
```

Fill in:

- `artifacts/api-server/.env`
  - `PORT` — already set to `5000` in the example file
  - `DATABASE_URL` — your Neon connection string
  - `MEDIA_ADMIN_ACCESS_TOKEN` — any long random string of your choosing
    (this gates the `/admin/login` staff-only broadcast tool)
- `artifacts/overcomers-faith-ministry/.env`
  - `PORT` / `BASE_PATH` / `API_PROXY_TARGET` — already set to sensible
    local-dev defaults in the example file

The API server automatically reads `artifacts/api-server/.env` on startup
(see `src/lib/load-env.ts`) — you don't need to `export` these variables
yourself. The frontend's `.env` is picked up automatically by Vite.

## 4. Run it

In one terminal:

```bash
npm run dev --workspace=@workspace/api-server
```

In a second terminal:

```bash
npm run dev --workspace=@workspace/overcomers-faith-ministry
```

Open http://localhost:5173. The Vite dev server proxies `/api/*` requests to
the API server on port 5000 (configured in `vite.config.ts`), so both pieces
talk to each other automatically.

## 5. Try it out

- **Media Admin login**: go to `/admin/login`, enter the
  `MEDIA_ADMIN_ACCESS_TOKEN` you set, and follow the on-screen OTP flow to
  reach the broadcast studio at `/admin/live`.
- **Prayer request / New member / Consultation / Contact forms**: submissions
  now persist to your Neon database. Verify with:

  ```bash
  npm run push --workspace=@workspace/db   # if you change the schema later
  ```

  or by querying the tables directly with any Postgres client using your
  `DATABASE_URL`.

## Notes on scope

- Ministries, sermons, events, blog posts, testimonies, and the daily
  devotional are still served from in-memory seed data in
  `artifacts/api-server/src/routes/public.ts` rather than the database —
  this was already the case before these changes and is a reasonable next
  step if you want a real content-management flow for that content too.
- The `/give` page currently shows placeholder bank-transfer text since no
  payment processor was previously wired up. Swap in real account details or
  a payment link when ready.
- "Media Admin" (the live-broadcast studio at `/admin/live`) is the only
  authenticated area of the site — an access token + emailed OTP. There is
  no other login system; the rest of the site is fully public.
