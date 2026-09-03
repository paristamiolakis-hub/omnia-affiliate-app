# Omnia – AI Travel & Shopping Agent

Omnia is a Next.js affiliate decision engine for travel, shopping and finance. The home experience now starts with a natural-language travel planner that turns one request into a structured trip, budget allocation and partner searches.

## Travel Agent v1

`POST /api/travel/plan` accepts a bounded travel request plus country context and returns:

- structured origin/destination, dates, travellers, budget and travel style;
- airport/IATA resolution for common destinations;
- deterministic budget allocation across flights, hotels, activities, car rental and buffer;
- a unified offer shape across affiliate providers;
- tracked partner links generated only by Omnia's affiliate allowlist;
- warnings when important trip details are missing.

The AI layer is intentionally limited to extracting structured trip intent. It cannot invent affiliate URLs or live prices. If OpenAI is unavailable or not configured, Omnia falls back to deterministic parsing.

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

For full revenue/conversion attribution, connect partner postbacks/webhooks or affiliate-network reporting APIs to a persistent analytics store. The repository currently records outbound click events but cannot infer a completed third-party purchase on its own.

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

Travel Agent v1 is the orchestration layer. Live comparison pricing requires approved partner APIs/feeds. Persistent searches, saved trips, conversion/revenue reporting and an admin dashboard require a database and partner postbacks/reporting integrations.

Before launch, configure a real `NEXT_PUBLIC_SITE_URL`, review partner deeplink requirements against your current affiliate agreements, and connect persistent analytics/conversion reporting if revenue attribution is required.
