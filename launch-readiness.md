# Rangrez launch-readiness audit

## Checklist basis

This audit adapts three supplied references to the current marketplace journey:

- Pixlogix emphasizes responsive layout, consistent navigation, readable typography, clear click targets, keyboard access, useful error recovery, descriptive image alt text, progress indicators, and simple form fields with confirmation states [1].
- Hostinger emphasizes replacing placeholder content, authentic imagery, descriptive alt text, image/content performance, metadata, security, and cross-device launch checks [2].
- Smol Launch emphasizes mobile and desktop loading, first-value flow, error monitoring, configuration parity, backups/rollback, analytics, support visibility, and feedback loops [3].

## Completed in this pass

- Added a functioning mobile navigation panel instead of a dead menu button.
- Removed the mobile viewport zoom lock and added `viewport-fit=cover` for notched devices.
- Added narrow-screen rules at 360px, safe-area drawer padding, mobile toast spacing, and mobile footer clearance for the fixed My Event trigger.
- Added active filter semantics with `aria-pressed`, preserved visible progress through the five-step journey, and kept direct quote routes refresh-safe through session persistence.
- Fixed query-aware routing so `/event/birthday-25?stage=availability` renders the availability screen rather than reverting to the event screen.
- Kept meaningful image alt text on hero, venue, and artist imagery and maintained image fallback behavior.

## Backend and database decision

Use the managed MySQL-compatible database already enabled for this project. It is the platform default for a server project with database capability, and the existing Drizzle schema/migration already models `venues`, `artists`, `eventPlans`, `availabilityRequests`, `quotes`, `payments`, and `bookings`. Money stays in integer paise, which keeps INR calculations exact and makes a later PostgreSQL migration straightforward if an external database becomes necessary.

The first journey now has a thin tRPC backend workflow:

1. `marketplace.createDraft` persists the event brief and selected venue/artist.
2. `marketplace.requestAvailability` persists a pending partner request.
3. `marketplace.createQuote` persists the itemized quote and marks the event plan quoted.
4. `marketplace.recordSandboxPayment` persists sandbox success/failure/cancelled outcomes and creates a confirmed booking only on success.

The migration was applied to the managed database and the full API sequence was exercised successfully. The UI remains deterministic and safe when the database is unavailable: procedures return a clearly non-production fallback instead of blocking the preview. Production hardening still requires authenticated ownership checks, venue/artist seed and moderation workflows, real partner availability responses, idempotency enforcement at the payment boundary, audit logs, monitoring, and backups/export procedures.

## Remaining launch blockers

This is still a validated prototype, not a public production marketplace. Before launch, add real authentication and ownership checks, a production payment provider, transactional quote/payment handling, server-side rate limiting, error monitoring, legal pages, analytics/consent handling, image optimization/CDN policy, and a defined backup/rollback process. The current `Join as an artist`, `List your venue`, and account controls remain intentionally non-production placeholders.

## References

[1]: https://www.pixlogix.com/checklist-for-website-ui-ux/ "Pixlogix website UI/UX checklist"
[2]: https://www.hostinger.com/in/tutorials/website-launch-checklist/ "Hostinger website launch checklist"
[3]: https://smollaunch.com/tools/launch-checklist "Smol Launch product launch checklist"
