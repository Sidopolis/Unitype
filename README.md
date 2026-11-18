# Rangrez

Rangrez is a polished first-stage prototype for an Indian venue-and-performing-artist marketplace. The implemented journey is intentionally focused: discover a venue and acoustic artist, create a birthday event brief, request availability, review an expiring quote, pay a sandbox deposit, and view the confirmed event-day schedule.

## Local setup

```bash
pnpm install
pnpm dev
```

The app runs on the configured port (3000 in the managed Preview). Useful checks are `pnpm check`, `pnpm build`, and `pnpm test`.

The provided starter is React + Vite + Express + tRPC + Drizzle. The managed project has Server and Database enabled. Discovery uses seeded demo catalogue data in `client/src/lib/demo-data.ts`, while the first journey persists its draft, availability request, quote and sandbox payment through `server/marketplace.ts`. Route-level screens now exist for `/venue/:id`, `/artist/:id`, `/event/birthday-25`, `/quote/rz-2411`, and `/confirmation/rz-2411`; these are separate page components, not multiple states rendered by the discovery page. The managed starter database is MySQL-compatible and the checked-in marketplace migration has been applied. Money fields remain integer paise so a later PostgreSQL migration can preserve the same semantics.

## Demo notes

All prices, partner responses, ratings and availability states are illustrative. The payment screen is explicitly sandbox-only: no payment gateway is called and no money moves. Availability timing remains simulated in local React state, but the draft/request/quote/payment records are now written through tRPC when the managed database is available. This milestone is full-stack for the first customer booking journey, not for the entire long-term roadmap: partner onboarding, artist/venue dashboards, account controls, event services, open mics, group payments and the remaining roadmap are not implemented yet. A production increment should replace anonymous demo procedures with authenticated ownership checks, enforce resource overlap constraints, add idempotency and audit logging, and add realtime partner updates.

The generated hero and artist visuals are served from the managed asset paths referenced in the demo data. If an asset is still being generated, the layout retains a normal image fallback area rather than blocking the journey.

## Research and handover

`plan.md` contains the selected visual direction, architecture and reference matrix with exact URLs and adaptations. `TODO.md` contains the completed release outcomes and explicit next backlog. `launch-readiness.md` records the supplied checklist audit and remaining production blockers. `client/public/manus-routes.json` exposes the intended public route set. `drizzle/schema.ts` is the portable data model for the backend.

Reference URLs are collected at the end of `plan.md`, with inaccessible or login-gated references called out next to the relevant source.
