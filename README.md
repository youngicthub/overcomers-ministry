# Overcomers Faith Ministry — Next.js on Vercel

The original Vite + Express project, converted to a single **Next.js (App Router)** app that runs on Vercel's serverless platform. The pages, design and admin dashboard are the same; the backend is now Next.js route handlers under `src/app/api`.

```
src/
├── app/
│   ├── (site)/…            public pages (home, sermons, gallery, give, …) inside the site header/footer
│   ├── admin/…             /admin, /admin/login, /admin/signup, /admin/dashboard, /admin/live
│   └── api/…               the old Express API, one route handler per endpoint (same URLs as before)
├── components/             site pages, admin dashboard, live studio, UI primitives
└── server/                 database schema (Drizzle), services, sessions, rate limiting
public/gallery/             the 30 starter Cultural Day photos (served as static files)
```

## 1. Deploy to Vercel

1. **Database.** Use the Postgres you already have (Neon) or a new one. Take the *pooled* connection string (Neon: the host containing `-pooler`).
2. **Create the tables** (once, and again whenever `src/server/db/schema` changes). From your computer:
   ```bash
   npm install
   cp .env.example .env.local        # fill in DATABASE_URL at least
   npm run db:push
   ```
   This adds two new tables (`app_kv`, `rate_limits`) and one new nullable column (`gallery_photos.url`). Existing data and existing admin accounts are untouched.
3. **Push this folder to a Git repo** and import it in Vercel (framework is detected as Next.js).
4. **Add a Blob store** for gallery uploads: Vercel project → **Storage** → **Create** → **Blob** → connect to the project. This adds `BLOB_READ_WRITE_TOKEN` automatically.
5. **Environment variables** (Project → Settings → Environment Variables):

   | Variable | Required | Notes |
   |---|---|---|
   | `DATABASE_URL` | yes | pooled Postgres URL |
   | `SESSION_SECRET` | yes | `openssl rand -base64 48` — signs admin login cookies |
   | `MEDIA_ADMIN_ACCESS_TOKEN` | yes | invite code for `/admin/signup`; sign-up is off while empty |
   | `BLOB_READ_WRITE_TOKEN` | yes for uploads | added by the Blob store |
   | `NEXT_PUBLIC_SITE_URL` | optional | e.g. `https://overcomers.church`, for share-card metadata |
   | `FRONTEND_ORIGIN` | optional | extra trusted origins; the site's own domain is always trusted |

6. **Deploy**, then open `/admin/signup` to create your first Media Admin.

`vercel.json` pins functions to `iad1` (Washington, DC), the closest region to a Neon database in `us-east-2`. Change it if your database is elsewhere.

> **Rotate your old secrets.** The zip you started from contained a real `DATABASE_URL` and `MEDIA_ADMIN_ACCESS_TOKEN` in `Backend/.env`. None of it was copied here, but since that file has been shared, reset the database password and generate a new access token.

## 2. Local development

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, SESSION_SECRET, MEDIA_ADMIN_ACCESS_TOKEN
npm run db:push
npm run dev                  # http://localhost:3000
```

For gallery uploads locally, run `npx vercel env pull .env.local` (after linking the project) to get `BLOB_READ_WRITE_TOKEN`.

## 3. What had to change for serverless

Serverless functions are short-lived, run as many parallel instances, share no memory, and have a read-only filesystem. The Express backend relied on all four, so:

| Before (Express, one long-running server) | Now (serverless) |
|---|---|
| Admin sessions in an in-memory `Map` | **Signed, stateless cookie** (HMAC-SHA256, 8h, `HttpOnly; SameSite=Strict; Secure`). The admin row is re-checked in the database on every request, so deleting an admin ends their access immediately. |
| Login lockout and rate limits in process memory | **Stored in Postgres** (`rate_limits`), so they hold across every instance. IPs are stored only as salted hashes. Same limits: 5 bad passwords → 15 min lockout; 10 auth attempts / 15 min / IP; 20 form posts / hour / IP. |
| Gallery photos written to `Backend/uploads/` | **Vercel Blob.** Browsers upload straight to Blob (Vercel rejects request bodies over ~4.5 MB, so 8 MB photos can't pass through the API); the API only records the URLs. Limits unchanged: JPEG/PNG/WEBP/GIF, 10 at a time, 8 MB each. |
| Starter photos copied from `seed/` to `uploads/` at runtime | Starter photos are plain static files in `public/gallery/`, registered in the database once. |
| "Already seeded" flags in memory / a marker file | A flag row in the database, so starter sermons/articles/photos are created once, ever. |
| Live-broadcast offer/answer in module variables | Stored in Postgres (`app_kv`) so the broadcaster and viewer can reach the same state from different instances. |
| `helmet`, `cors`, `cookie-parser`, `multer`, `pino`, `express-rate-limit` | Not needed. The API is same-origin so there is no CORS; security headers are in `next.config.mjs`; the Origin/Referer CSRF check is kept (`src/server/lib/origin.ts`). |
| Public GET endpoints hit the database every time | Edge-cached for 60 s (`s-maxage=60, stale-while-revalidate`), so a traffic spike doesn't become a database spike. Admin edits appear within about a minute. `/api/home`, `/api/live` and everything under `/api/admin` are never cached. |

Behaviour changes to be aware of:

- Everyone is signed out once, after the first deploy (the cookie format changed). Existing admin IDs and passwords still work.
- Signed cookies can't be revoked individually. To force-logout everyone, change `SESSION_SECRET`.
- The old global limit of 600 requests / 15 min on every route is not reimplemented. Use Vercel's Firewall / rate limiting for site-wide abuse protection.

## 4. Known limitations (carried over from the original)

- **Events, ministries and testimonies** are defined in code (`src/server/content.ts`). The three sample event dates are in September 2026 and now in the past; edit them there.
- **Live broadcast** is a single WebRTC peer-to-peer connection with Google STUN only: it supports one viewer at a time and can fail behind strict firewalls (no TURN server). For a real congregation stream, embed YouTube Live or use a streaming service instead.
- **Social links** in the footer are placeholder buttons; the address, phone, email and bank details on Give/Contact are placeholder text.
