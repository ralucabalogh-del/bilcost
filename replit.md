# Bilcost

Total-cost-of-ownership comparison for new vs. used cars on the Danish market, with live Bilbasen data.

## Run & Operate

- `pnpm install`
- `pnpm --filter @workspace/api-server run dev` — API server
- The Bilcost web app runs on the configured artifact workflow
- `pnpm run typecheck` — full typecheck across all packages
- Required env: `DATABASE_URL` — Postgres connection string
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`)
- API codegen: Orval (from `lib/api-spec/openapi.yaml`)

## Where things live

- API contract: `lib/api-spec/openapi.yaml`
- DB schema: `lib/db/src/schema/bilcost.ts`
- API routes: `artifacts/api-server/src/routes/bilcost.ts`
- Frontend: `artifacts/bilcost/src/`
- Bilbasen scraping: `lib/bilbasen/`
- Pricing/TCO math: `lib/bilcost-pricing/`
