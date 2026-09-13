# Overcomers Ministry of Believers Fellowship — Production Notes

## Product identity

Overcomers is a welcoming, scripture-rooted ministry website that helps people find community, hear the Word, request prayer, and take a next step into the life of the church.

## Visual direction

- Primary: royal blue
- Accent: gold
- Surface: warm white
- Headings: Poppins
- Body: Inter
- Motion: restrained fade, slide, and hover transitions
- Minimum viewport: 320px

## Run locally

```bash
npm install
npm run dev --workspace=@workspace/api-server
npm run dev --workspace=@workspace/overcomers-faith-ministry
```

The artifact workflows provide the required `PORT` and `BASE_PATH` values. API requests use the shared `/api` path and do not hard-code localhost URLs.

## Contract changes

When an API surface changes:

1. Update `lib/api-spec/openapi.yaml`.
2. Run `npm run codegen --workspace=@workspace/api-spec`.
3. Typecheck the API server and website.
4. Restart the affected workflow.

## Production checklist

- Configure the database environment for the persistent content services. ✅ Prayer requests, member registrations, consultation requests, and contact messages now persist to Postgres via Drizzle (`lib/db/src/schema`). Ministries, sermons, events, blog posts, testimonies, and the daily devotional still ship as in-memory seed data.
- Configure managed authentication before enabling admin pages. ✅ There is no member login/signup — the site is fully public. The Media Admin broadcast tool uses its own access-token + OTP flow.
- Add Cloudinary storage for sermon media and featured images.
- Add YouTube/Facebook Live URLs through an authenticated admin workflow.
- Configure transactional email for member confirmations and admin notifications.
- Set canonical metadata, sitemap, and robots rules for the published domain.
- Run accessibility, performance, and security checks before publishing.
- Wire a real payment processor or bank details into the `/give` page (currently placeholder text).

## Roadmap

The architecture leaves room for online giving, SMS and WhatsApp notifications, QR attendance, member accounts, worker scheduling, small groups, and a mobile app without changing the public API shape.