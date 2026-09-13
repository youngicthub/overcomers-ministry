# Overcomers Ministry of Believers Fellowship

A welcoming church website for discovering the ministry, watching sermons, requesting prayer, and taking a next step into community.

## Run & Operate

- `npm run dev --workspace=@workspace/api-server` — run the API server (port 5000)
- `npm run typecheck` — full typecheck across all packages
- `npm run build` — typecheck + build all packages
- `npm run codegen --workspace=@workspace/api-spec` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `npm run push --workspace=@workspace/db` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- npm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/overcomers-faith-ministry` — public React/Vite website
- `artifacts/api-server` — shared Express API under `/api`
- `lib/api-spec/openapi.yaml` — source of truth for public API contracts
- `lib/api-client-react` and `lib/api-zod` — generated client and validation schemas
- `docs/architecture.md` and `docs/production.md` — project architecture and launch notes

## Architecture decisions

- The public experience uses the shared API server so forms and content can move to persistent services without rewriting the frontend.
- The API contract is generated from OpenAPI; do not hand-edit generated client or Zod files.
- Public seed content keeps the first load useful while the admin and persistence layers are added.

## Product

Visitors can learn about the ministry, explore departments, see upcoming events, browse sermons and reflections, read a daily devotional, watch live, submit prayer requests, register as a member, request a consultation, and send a contact message.

## User preferences

The visual identity follows the approved production brief: royal blue, gold, warm white, Poppins headings, Inter body, and restrained motion.

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, run API codegen before using new hooks or schemas.
- Managed artifact workflows must be restarted through the workflow controls rather than by creating duplicate workflows.

## Pointers

- See the workspace structure below for package details (this project uses npm workspaces, not a separate workspace-manager skill).
