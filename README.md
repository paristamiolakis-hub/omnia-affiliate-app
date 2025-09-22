# Omnia – Super Affiliate Hub

See /lib/affiliates.ts and .env.local.example.


## AI Assistant

- Set `OPENAI_API_KEY` in `.env.local`.
- `/api/ai` forwards to OpenAI Chat Completions (gpt-4o-mini by default) and returns JSON with `{ intent, query, country, suggestions[] }`.
- `SmartSearch` (home) and the floating `OmniaAssistant` use this endpoint.

> If you don't want to use OpenAI yet, leave the key empty; the UI will show an error and you can plug another LLM later.
