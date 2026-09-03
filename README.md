# Omnia – Super Affiliate Hub

Omnia is a Next.js affiliate discovery app for hotels, cars, flights, tours, shopping and finance.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Fill only affiliate IDs for partner programs you actually have access to.
3. Set `OPENAI_API_KEY` if you want the optional AI assistant.
4. Run `npm ci` and `npm run dev`.

Missing affiliate IDs are intentionally treated as **not configured**. Omnia will not generate placeholder tracking links.

## Affiliate routing

Affiliate URL templates live in `lib/affiliates.ts`. All UI click-outs pass through `/api/out`, which:

- accepts only HTTPS destinations;
- restricts redirects to an allowlist of supported partner hosts;
- emits a structured `omnia.affiliate_click` log event;
- uses `rel="nofollow sponsored noopener"` on outbound UI links.

For full revenue/conversion attribution, connect partner postbacks/webhooks or affiliate-network reporting APIs to a persistent analytics store. The repository currently records outbound click events but cannot infer a completed third-party purchase on its own.

## AI Assistant

Set `OPENAI_API_KEY` in `.env.local`. `OPENAI_MODEL` is optional.

`/api/ai` sends only the latest bounded user request to the model. Client-provided system prompts are ignored. The model may classify the request, but it is **not allowed to create affiliate URLs**. Final outbound URLs are rebuilt by Omnia from the partner allowlist and configured affiliate IDs.

The deterministic `/api/suggest` endpoint remains available for searches that do not require AI classification.

## Verification

- `npm run typecheck` — TypeScript validation
- `npm run build` — production Next.js build
- `npm run check` — typecheck + build

GitHub Actions runs typecheck and production build on pull requests and pushes to `main`.

## Production notes

Before launch, configure a real `NEXT_PUBLIC_SITE_URL`, review partner deeplink requirements against your current affiliate agreements, and connect persistent analytics/conversion reporting if revenue attribution is required.
