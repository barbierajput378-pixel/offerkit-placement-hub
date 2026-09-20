# OfferKit

OfferKit is a campus placement preparation hub for engineering students in India, combining original field notes, practical tools, and first-party engagement analytics.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required secret for the private dashboard: `ADMIN_PASSWORD`
- Optional env: `VITE_GA_ID` for Google Analytics 4

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/offerkit/src/App.tsx` — routed web experience and page-level UI
- `artifacts/offerkit/src/index.css` — OfferKit theme tokens and global styling
- `artifacts/api-server/src/routes/offerkit.ts` — content, engagement, tool, tracking, and analytics endpoints
- `artifacts/api-server/src/lib/content.ts` — original blog posts and resource catalog
- `lib/api-spec/openapi.yaml` — source of truth for the typed API contract
- `lib/db/src/schema/offerkit.ts` — PostgreSQL tables for submissions, tools, and event tracking

## Architecture decisions

- The public editorial catalog is versioned in the API server so the demo has reliable content on first load; user interactions and analytics are persisted in PostgreSQL.
- Anonymous analytics use a browser visitor ID and never store raw IP addresses.
- The admin analytics dashboard only authorizes when `ADMIN_PASSWORD` is configured and matched; it does not silently fall back to a default credential.
- API contracts are generated from OpenAPI so the frontend and server share validation and response shapes.

## Product

- Home, resources, blog index/detail, about, contact, and prep bootcamp routes
- Placement readiness quiz with personalized next steps
- Rule-based resume score checker
- 30-day role and weak-area preparation planner
- Newsletter and contact capture with success/error states
- Password-gated analytics dashboard with trends, breakdowns, CSV export, and seeded demo data

## User preferences

The user asked for an original, friendly, motivating peer-to-peer tone with no lorem ipsum and a modern responsive experience.

## Gotchas

- Run API codegen after changing `lib/api-spec/openapi.yaml`.
- Restart `artifacts/api-server: API Server` and `artifacts/offerkit: web` after backend or frontend changes that should appear in preview.
- Add `dom.iterable` to shared client TypeScript libs when generated fetch code uses `Headers.entries()`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
