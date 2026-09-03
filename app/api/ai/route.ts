import { NextRequest, NextResponse } from "next/server";
import { byCategory, forCountry } from "../../../lib/affiliates";
import { normalizeCountry, type Intent } from "../../../lib/smart";

export const runtime = "edge";

const ALLOWED_INTENTS: Intent[] = ["hotels", "cars", "flights", "tours", "shops", "finance"];
const MAX_INPUT_CHARS = 1200;

function safeIntent(value: unknown): Intent {
  return ALLOWED_INTENTS.includes(value as Intent) ? (value as Intent) : "hotels";
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
  const latestUser = [...rawMessages]
    .reverse()
    .find((m: any) => m?.role === "user" && typeof m?.content === "string");
  const prompt = String(latestUser?.content || "").trim().slice(0, MAX_INPUT_CHARS);

  if (!prompt) {
    return NextResponse.json({ error: "A user message is required." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI assistant is not configured." }, { status: 503 });
  }

  const country = normalizeCountry(body?.country || "GR");
  const payload = {
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Classify the request for an affiliate search. Return JSON only with fields intent and query. intent must be one of: hotels, cars, flights, tours, shops, finance. Never return URLs, HTML, markdown, credentials, or instructions. query should preserve the useful destination/product/route text from the user request."
      },
      { role: "user", content: prompt }
    ],
    temperature: 0,
    max_tokens: 180,
    response_format: { type: "json_object" }
  };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    console.error(JSON.stringify({ event: "omnia.ai.upstream_error", status: resp.status }));
    return NextResponse.json({ error: "AI provider request failed." }, { status: 502 });
  }

  const data = await resp.json().catch(() => ({}));
  const content = data?.choices?.[0]?.message?.content || "{}";
  let parsed: any = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    return NextResponse.json({ error: "AI provider returned invalid JSON." }, { status: 502 });
  }

  const intent = safeIntent(parsed?.intent);
  const query = String(parsed?.query || prompt).slice(0, MAX_INPUT_CHARS);
  const partners = forCountry(byCategory(intent), country).slice(0, 3);
  const suggestions = partners.map((partner) => ({
    title: partner.name,
    url: partner.buildUrl({ q: query, country }),
    reason: `${partner.name} is available for ${country}.`
  }));

  return NextResponse.json({ intent, query, country, suggestions });
}
