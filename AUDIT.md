# Rangrez journey audit — 11 Nov 2026

Scope: discover → event → availability → quote → sandbox deposit → confirmation.  
Commands run: `pnpm install`, `pnpm check`, `pnpm test`, `pnpm build`. Dev started with `NODE_ENV=development` (see F11). Manual route and click-journey checks at ~390px and 1280×900.

## 1. What passed

| Area | Result |
| --- | --- |
| `pnpm check` / `pnpm test` / `pnpm build` | Pass (6 tests) |
| `/` discovery hero, catalogue, My Event rail | Renders; venue/artist cards work |
| `/venue/amber-courtyard` | Dedicated page; back to discovery works |
| `/artist/aarav-mehta`, `/artist/the-pink-room` | Correct artist content for each id |
| Dedicated booking routes | `/event`, `/availability`, `/quote`, `/payment`, `/confirmation` render |
| Legacy query routes | `/event/...?stage=availability` and `/quote/...?stage=deposit` select correct stage on fresh load |
| Sandbox payment failure → retry success | Works after mutation settles; confirmation reachable |
| Visual direction | Instrument Serif / Plus Jakarta Sans / vermilion / ivory preserved |
| tRPC createDraft without DB | Returns `persisted: false` fallback (non-blocking) |
| Demo / sandbox labeling | Present on discovery and booking chrome |

## 2. What failed

### Blockers

| ID | Issue | File:line | Recommended fix |
| --- | --- | --- | --- |
| B1 | Event → Availability skips the request UI. `requestState` initializes to `"available"` whenever the first mount stage is not availability, so navigating within `BookingPage` keeps that value and shows “Both partners are available” immediately. | `client/src/pages/BookingPage.tsx:20` | Drive availability from stage + a session “done” flag; reset to `draft` when entering availability until the user completes the request. |
| B2 | Back on the event stage is a no-op (`go("event")` when already on event). | `client/src/pages/BookingPage.tsx:43` | Navigate to `/` from the event stage. |
| B3 | Event brief fields use `defaultValue` only. Summary chips stay hardcoded; edits never reach `createDraft` or session. | `client/src/pages/BookingPage.tsx:52` | Controlled brief state persisted to session; summary and API inputs use that state. |
| B4 | Venue/Artist “Add to my event” does not write `rangrez-venue` / `rangrez-artist`; booking always shows `artists[0]` and ignores discovery picks. | `client/src/pages/VenuePage.tsx:9`, `client/src/pages/ArtistPage.tsx:13`, `client/src/pages/BookingPage.tsx:28–36` | Persist ids (and brief) on add; BookingPage reads them for picks and draft creation. |
| B5 | `sessionStorage` writes `JSON.stringify(null)` → `"null"`. Booking `readSession` strips quotes and treats the string `"null"` as a real id, so `ensureDraft` never creates a plan. | `client/src/pages/Home.tsx:166–167`, `client/src/pages/BookingPage.tsx:15–22` | Shared JSON helpers that treat `null` / `"null"` / missing as empty; only persist real ids. |
| B6 | `pnpm dev` uses Unix `NODE_ENV=development`, which fails on Windows PowerShell; without it the server serves static dist instead of Vite. | `package.json:7`, `server/_core/index.ts:31` | Cross-platform script / treat non-production as Vite; keep Dockerfile `NODE_ENV=production`. |

### Important

| ID | Issue | File:line | Recommended fix |
| --- | --- | --- | --- |
| I1 | Mobile fixed My Event trigger intercepts taps on lower listing actions (View details / Add). | `client/src/index.css:185–186`, `410–412` | Add safe bottom padding on discovery `main` / listing sections at ≤850px. |
| I2 | `.rangrez-app { overflow: hidden }` can clip vertical content. | `client/src/index.css:37` | Use `overflow-x: hidden` only. |
| I3 | Quote terms claim “50% of the pre-tax booking total” but deposit ₹13,240 ≠ half of ₹33,270 (₹16,635). | `client/src/lib/demo-data.ts:125–134`, `server/marketplace.ts:8–15` | Align deposit to 50% pre-tax in client + server demo values. |
| I4 | Venue detail price shows raw `From {venue.price}` without ₹ / locale. | `client/src/pages/VenuePage.tsx:9` | Format with INR helper. |
| I5 | Booking mutations (`accept`, `pay`, availability) lack UI error handling; failures leave the user stuck on the same screen. | `client/src/pages/BookingPage.tsx:39–41` | try/catch + visible error/toast; disable buttons while pending. |
| I6 | Progress labels are raw stage ids (`event`, `availability`, …). | `client/src/pages/BookingPage.tsx:43` | Human labels matching the journey copy. |
| I7 | Mini-pick / schedule images use empty `alt=""`. | `client/src/pages/BookingPage.tsx:52–62` | Descriptive alts for venue/artist imagery. |
| I8 | My Event rail form has no City field (city only editable in search board / event page after fix). | `client/src/pages/Home.tsx:397–398` | Add city input to `EventForm`. |
| I9 | Artist page falls back to `artists[0]` for unknown ids (misleading content). | `client/src/pages/ArtistPage.tsx:11` | Show a not-found state for unknown ids. |
| I10 | Accept quote can appear dead when `eventPlanId` is the string `"null"` (linked to B5); navigation to payment does not run if the mutation path errors. | `client/src/pages/BookingPage.tsx:40` | Fixed by B5 + I5. |

### Polish

| ID | Issue | File:line | Recommended fix |
| --- | --- | --- | --- |
| P1 | Dead / placeholder controls: Join as artist, List your venue, account, venue filter chips, See all venues, Request a preview, Save on venue detail. | Multiple | Leave labeled as non-production or wire minimal feedback; out of journey scope. |
| P2 | Home still contains unused in-page `JourneyScreen` after route split. | `client/src/pages/Home.tsx:371+` | Remove or keep dormant; not user-facing on dedicated routes. |
| P3 | Preview button on artist detail lacks `aria-label`. | `client/src/pages/ArtistPage.tsx:13` | Add accessible name. |
| P4 | Repo has no git root; `git diff --check` cannot run. | workspace | Initialize git when ready for version control. |
| P5 | Open mics / Events both target `#events`. | `client/src/pages/Home.tsx:287–288` | Acceptable for demo “coming soon”. |

## 3. Severity summary

- **Blockers:** B1–B6 — must fix before calling the journey solid.
- **Important:** I1–I10 — fix in this pass with the blockers.
- **Polish:** P1–P5 — document; fix only if cheap and in-scope.

## 4. Production blockers (unchanged)

Still out of scope for this prototype: real auth/ownership, payment provider, rate limiting, monitoring, legal pages, partner dashboards, idempotent production payments. Sandbox and demo catalogue must remain clearly labeled.

## 5. Fixes applied in this pass

| ID | Status |
| --- | --- |
| B1–B6 | Fixed |
| I1–I10 | Fixed |
| P1, P2, P4, P5 | Remaining (intentional / out of scope) |
| P3 | Fixed (preview aria-label + Pause icon) |

Re-verified after fixes: event → availability shows draft request; back from event → `/`; controlled brief + Pink Room selection; deposit ₹16,635; accept quote → payment; failure → success → confirmation; `pnpm check` / `test` / `build` pass.
