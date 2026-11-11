# VelaPal Frontend

Next.js 16.4.3 / React 19 / TypeScript frontend for Customer, Seller and Admin workspaces. Public API integration follows the frozen [V6.1.1 contract](velapal-v6.1-api-contract.md).

## Run with Express

Copy [.env.example](.env.example) to `.env.local` and start the separate Express backend on port 4000:

```dotenv
NEXT_PUBLIC_API_BASE_URL=/api/v1
API_UPSTREAM=http://localhost:4000
```

`npm run dev` serves the frontend on port 3000. Next.js forwards same-origin `/api/v1/*` requests to Express. There is no embedded mock API or automatic fallback. If Express is unavailable, the UI displays loading/error/unavailable states.

For direct access, `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000` is also supported. Express must allow the exact web Origin, credentials, preflight, and `X-CSRF-Token`, `If-Match`, `Idempotency-Key` headers. Cookie `SameSite=Lax` requires a compatible same-site deployment; use the same-origin rewrite when in doubt. Production requires HTTPS and the contract's secure HttpOnly session cookie. Public environment values are fixed at build time: restart dev or rebuild after configuration changes.

All public HTTP requests use [lib/api.ts](lib/api.ts). CSRF lives in memory and is restored from `GET /api/v1/auth/session`; no session token is stored in browser storage. Session/workspace changes cancel pending requests and replace scoped SWR caches. File bytes use only a backend-issued upload handle, without session cookies or CSRF headers.

## Integration coverage and blockers

Authentication/MFA, granted workspaces, authorized catalog/quotes and transactions, disputes, uploads/finalization/source metadata/revocation, messages, assessments/private assistance, exact proposal consent, settlement submission, provider reconciliation and Admin supervision/audit use the public API. Existing styling, navigation and component classes are retained.

Checkout request/approval DTOs and discovery of authoritative source-sharing/mediation hashes and proposal source digests are not defined. Those actions remain disabled. Registration/recovery, subscriptions, library, notifications, product mutations and broad administrative mutations also have no defined public endpoint. Their routes remain available with existing unavailable states. The frontend never invents endpoints or financial success.

See [the integration report](docs/frontend-api-integration.md) for endpoint mapping, schema handoff limits, modified-file groups and verification results. Historical prototype reports under `docs/` describe earlier versions and are not the current runtime behavior.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

The unit/service suite executes the actual client and service modules, including frozen contract JSON examples. Legacy simulators and preview records are confined to `tests/fixtures/`; they are never imported by the app. Playwright intercepts network requests using a test-only fixture, including outage tests. It does not enable a mock mode in the production app. These tests verify frontend behavior, not live Express/PayPal/AI integration.

No real Express backend was reachable at the configured origin during this implementation. Live cookie/CORS/preflight, durable evidence scanning, provider operations, AI execution and end-to-end acceptance remain to be verified against the deployed backend.
