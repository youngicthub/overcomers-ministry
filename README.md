# Overcomers Faith Ministry

A two-folder project: **Backend** (Express + Drizzle + Postgres API) and
**Frontend** (Vite + React site). Each folder is a standalone app with its
own `package.json` — the root just wires them together for convenience.

```
Overcomers-Faith-Ministry/
├── Backend/     Express API, Drizzle ORM schema, admin auth, everything under /api
├── Frontend/    Vite + React public site + admin dashboard
└── package.json Root convenience scripts (npm workspaces)
```

## 1. What's new in this structure

- **Two plain folders** instead of the old npm-workspaces monorepo
  (`artifacts/*`, `lib/*`). Backend and Frontend no longer depend on any
  shared package — each is self-contained and can be deployed
  independently.
- **Articles** (`Backend/src/db/schema/articles.ts`) — a real database
  table. Media Admins write, edit, publish/unpublish, and delete articles
  from the admin dashboard's **Articles** tab. The public **Articles**
  page (`/articles`, with `/blog` kept as an alias) only shows published
  ones. This replaces the old hardcoded sample "blog" list.
- **Videos** (`Backend/src/db/schema/videos.ts`) — admins paste a YouTube
  link (watch / shorts / youtu.be / already-embeddable) or any other
  embeddable/direct video link from the **Videos** tab in the admin
  dashboard. The public **Videos** page (`/videos`) shows a grid of
  thumbnails; clicking one opens an inline player (`<iframe>` for YouTube
  and similar, `<video>` for direct file links) right on the page — no
  new tab. A "Latest videos" strip also appears on the homepage.
- **Admin sign-up & sign-in now use real passwords**, not the original
  OTP-in-the-response placeholder. Sign-up is still gated by the shared
  `MEDIA_ADMIN_ACCESS_TOKEN`, but signing back in only needs the admin's
  own Admin ID + password. See [section 3](#3-admin-sign-up--sign-in)
  and [section 5, Security](#5-security).

## 2. Setup

This delivery already ships a working `Backend/.env` and `Frontend/.env`
pointed at a development database, so you can `npm install && npm run dev`
immediately without configuring anything first. **Replace both `.env`
files before you deploy to production** — see [Deploying](#6-deploying).
`.env` is git-ignored on purpose; `.env.example` documents what each
variable does.

### Backend

```bash
cd Backend
npm install
npm run db:push       # creates all tables from src/db/schema
npm run dev           # starts the API on PORT (default 5000)
```

### Frontend

```bash
cd Frontend
npm install
npm run dev            # starts Vite on PORT (default 5173), proxies /api to the Backend
```

Or, from the repo root, `npm install` once (npm workspaces) and then use
`npm run dev:backend` / `npm run dev:frontend` in two terminals.

## 3. Admin sign-up & sign-in

Go to **`/admin`** (e.g. `localhost:5173/admin`, or `yourdomain.com/admin`
once deployed) — it automatically sends you to the dashboard if you're
already signed in, or to the login page if you're not. You don't need to
remember `/admin/login` or `/admin/dashboard` specifically.

Creating a new admin account and signing back in afterwards use two
different secrets, on purpose:

- **Sign-up** (`/admin/signup`) requires the shared
  **`MEDIA_ADMIN_ACCESS_TOKEN`** (set in `Backend/.env`) — think of it as
  an invite code for your team, not a personal credential. Enter it plus
  your name and choose your own password (10+ characters, letters and
  numbers). You'll be shown a generated **Admin ID** — save it, it's
  never shown again.
- **Sign-in** (`/admin/login`) only needs your own **Admin ID +
  password**. It does not need the access token at all — so day-to-day
  logins don't depend on a secret the whole team shares.

Passwords are hashed with scrypt (Node's built-in `crypto` module, no
plaintext or reversible storage anywhere) and are never returned by any
API response. Five wrong passwords for one Admin ID locks that ID out
for 15 minutes, regardless of which IP the attempts came from.

Any signed-in Media Admin can write/edit Articles, manage Videos and
Sermons, and see Prayer Requests / New Members / Workers — there's no
separate "author" role, every Media Admin has the same permissions.

If `MEDIA_ADMIN_ACCESS_TOKEN` is unset, sign-up is disabled (`503`)
until you set it.

## 4. Database

Postgres, managed with Drizzle ORM/Kit. Schema lives in
`Backend/src/db/schema/*.ts`. After changing a schema file, run:

```bash
cd Backend
npm run db:push
```

⚠️ **If you had already run `db:push` before this update**, the `admins`
table just gained a required `password_hash` column. Any admin accounts
created under the old OTP flow have no password and can't log in under
the new one. Since this is pre-launch, the simplest fix is to clear that
table and have your team sign up again:

```sql
TRUNCATE TABLE admins;
```

Articles and Sermons each seed a few sample rows automatically the first
time their table is empty, so the public site isn't blank before an
admin has written anything. Videos start empty — there's no meaningful
placeholder video to seed.

## 5. Security

This app went through a hardening pass specifically to get it
production-ready:

- **Password-based admin auth** — see [section 3](#3-admin-sign-up--sign-in).
  Passwords are hashed with scrypt, never stored or returned in plaintext.
  Per-admin-ID lockout after 5 failed attempts (15 min cooldown).
- **Rate limiting** (`express-rate-limit`) on `/admin/signup` and
  `/admin/login` (10 attempts / 15 min per IP), on the public
  prayer/member/consultation/contact forms (20 / hour per IP), and a
  generous global ceiling on every other route.
- **Locked-down CORS** — the API only accepts credentialed
  (cookie-carrying) cross-origin requests from origins listed in
  `FRONTEND_ORIGIN`. It never reflects an arbitrary caller's origin.
  **You must set `FRONTEND_ORIGIN` to your real deployed frontend
  URL(s) before going live**, or admin sign-in will fail from that
  domain.
- **CSRF defense-in-depth** — the admin session cookie is
  `httpOnly; SameSite=Strict; Secure` (in production), and every
  state-changing admin request additionally checks the `Origin`/
  `Referer` header against `FRONTEND_ORIGIN`.
- **Security headers** via `helmet` (a strict default
  Content-Security-Policy, `X-Frame-Options`, HSTS, etc).
- **Request body size caps** (512kb) to blunt oversized-payload abuse.
- **Zod validation** on every request body/query — unchanged from
  before, still the first line of defense against malformed input.

What's *not* included, and worth adding as you grow: persisting admin
sessions in the database instead of in-memory (so they survive a
restart and work across multiple server instances), structured audit
logging of admin actions, and a way to revoke a specific admin's access
without deleting their row. None of these block going live for a single
small-team deployment, but they're the natural next steps.

## 6. Deploying

⚠️ The `Backend/.env` and `Frontend/.env` shipped in this repo point at a
**development** database and use a development access token. Before
deploying anywhere public:

1. Replace `DATABASE_URL` with your production database.
2. Generate a new, private `MEDIA_ADMIN_ACCESS_TOKEN` — don't reuse the
   dev one, and don't reuse it for anything else either.
3. Set `FRONTEND_ORIGIN` to your real deployed frontend URL(s).

- **Backend**: `npm run build` (bundles to `Backend/dist/index.mjs` with
  esbuild), then `npm start`. Needs `PORT`, `DATABASE_URL`,
  `MEDIA_ADMIN_ACCESS_TOKEN`, and `FRONTEND_ORIGIN` set in the
  environment.
- **Frontend**: `npm run build` (outputs static files to
  `Frontend/dist/public`), served by any static host or reverse-proxied
  behind the same domain as the Backend. Set `API_PROXY_TARGET` (dev
  only) or point your production reverse proxy's `/api` route at the
  Backend.
# overcomers-ministry
