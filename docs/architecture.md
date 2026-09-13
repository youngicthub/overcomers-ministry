# Overcomers Ministry of Believers Fellowship — Architecture

## Overview

The website is a React + Vite public experience backed by the shared Express API server in this workspace. The API is contract-first: `lib/api-spec/openapi.yaml` defines the public content and engagement endpoints, and code generation produces the typed client hooks used by the website.

```text
React + Vite website
        ↓ typed REST hooks
Express API server (/api)
        ↓
Content and engagement services
```

## Frontend

The main app lives in `artifacts/overcomers-faith-ministry`. Public routes include:

- `/` — welcome page with the latest devotional, events, sermons, and invitation to connect
- `/about` — ministry story, beliefs, and welcome
- `/ministries` — ministry departments and ways to serve
- `/events` — upcoming gatherings
- `/sermons` — searchable sermon library
- `/blog` — faith reflections
- `/live` — livestream status and watch experience
- `/daily-devotional` — daily verse, reflection, and prayer point
- `/testimonies` — approved testimonies
- `/prayer-request` — prayer submission
- `/new-member` — member registration
- `/consultation` — private counseling request
- `/contact` — general contact form

The interface uses reusable layout, content, and form components. The public forms are wired to API mutations so a successful submission can be acknowledged without relying on a mail provider.

## Backend

The shared API server lives in `artifacts/api-server`. Routes are grouped by domain and mounted under `/api`. Public content is currently seeded in the public route module so the first experience is useful without requiring an external CMS. The route boundaries and validation schemas are ready for persistence to be moved into PostgreSQL-backed services.

## Data and integrations

The intended production data layer is PostgreSQL through Drizzle ORM. Cloudinary, YouTube Live, and Facebook Live remain integration points for media and livestream management. Authentication for future admin surfaces should use a managed auth provider rather than a hand-rolled local password system.

## Security baseline

- Typed request validation with generated Zod schemas
- CORS and JSON parsing at the API boundary
- Structured request logging with sensitive headers redacted
- No secrets committed to the repository
- Future admin routes should add managed authentication and role checks before exposing mutations
