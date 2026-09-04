# Omnia – AI Travel & Shopping Agent

Omnia is a Next.js affiliate decision engine for travel, shopping and finance. The home experience starts with a natural-language travel planner that turns one request into a structured trip, budget allocation and partner searches.

## Travel Agent v1

`POST /api/travel/plan` accepts a bounded travel request plus country context and returns:

- structured origin/destination, dates, travellers, budget and travel style;
- airport/IATA resolution for common destinations;
- deterministic budget allocation across flights, hotels, activities, car rental and buffer;
- a unified offer shape across affiliate providers;
- tracked partner links generated only by Omnia's affiliate allowlist;
- warnings when important trip details are missing.

The AI layer is intentionally limited to extracting structured trip intent. It cannot invent affiliate URLs or live prices. If OpenAI is unavailable or not configured, Omnia falls back to deterministic parsing.

## Local-first platform foundation

Omnia currently does not require a dedicated database or application server beyond the existing Next.js deployment.

The browser storage adapter in `lib/storage.ts` provides:

- saved trips on the current device;
- reopening saved trips from `/my-trips`;
- local trip-search analytics;
- affiliate-click attribution by partner;
- a local analytics dashboard at `/analytics`;
- JSON export for later migration to a persistent backend.

The UI talks to the `OmniaStorageAdapter` interface rather than directly depending on a database vendor. A future Supabase, Neon, Postgres, Firebase or other backend can replace the adapter without rewriting the Travel Agent product flow.

Local storage is device/browser scoped. Clearing browser data removes saved trips and analytics, and data is not shared between devices.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Fill only affiliate IDs for partner programs you actually have access to.
3. Set `OPENAI_API_KEY` if you want AI-assisted travel parsing and the optional assistant.
4. Run `npm ci` and `npm run dev`.

Missing affiliate IDs are intentionally treated as **not configured**. Omnia will not generate placeholder tracking links.

## Affiliate routing

Affiliate URL templates live in `lib/affiliates.ts`. UI click-outs pass through `/api/out`, which:

- accepts only HTTPS destinations;
- restricts redirects to an allowlist of supported partner hosts;
- emits a structured `omnia.affiliate_click` event with partner and source attribution;
- uses `rel="nofollow sponsored noopener"` on outbound UI links.

The browser also records a local affiliate-click event for product analytics. Full revenue/conversion attribution still requires partner postbacks/webhooks or reporting APIs plus persistent storage.

## AI Assistant

Set `OPENAI_API_KEY` in `.env.local`. `OPENAI_MODEL` is optional.

`/api/ai` sends only the latest bounded user request to the model. Client-provided system prompts are ignored. The model may classify the request, but it is **not allowed to create affiliate URLs**. Final outbound URLs are rebuilt by Omnia from the partner allowlist and configured affiliate IDs.

The deterministic `/api/suggest` endpoint remains available for one-step searches that do not require travel planning.

## Verification

- `npm run typecheck` — TypeScript validation
- `npm run build` — production Next.js build
- `npm run check` — typecheck + build

GitHub Actions runs typecheck and production build on pull requests and pushes to `main`.

## Next platform milestones

The next backend-dependent stage is persistent cross-device accounts/trips, conversion and commission ingestion, revenue attribution and an admin business dashboard. Live comparison pricing also requires approved partner APIs or feeds.

Before launch, configure a real `NEXT_PUBLIC_SITE_URL` and review partner deeplink requirements against your current affiliate agreements.
