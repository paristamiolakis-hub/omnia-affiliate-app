import { NextRequest, NextResponse } from "next/server";
import {
  buildFallbackIntent,
  buildTripResult,
  mergeStructuredIntent,
  resolveAirport,
  type TripIntent
} from "../../../../lib/travel";

export const runtime = "edge";

const MAX_INPUT_CHARS = 1800;

function normalizeFallbackDirection(prompt: string, fallback: TripIntent): TripIntent {
  const fromMatch = prompt.match(/(?:\bfrom\b|\bαπό\b|\bαπο\b)\s+([^,.;]+)/i);
  if (!fromMatch?.[1]) return fallback;

  const explicitOrigin = resolveAirport(fromMatch[1]);
  if (!explicitOrigin) return fallback;

  if (fallback.destinationIata === explicitOrigin.iata && fallback.origin && fallback.originIata) {
    return {
      ...fallback,
      origin: explicitOrigin.city,
      originIata: explicitOrigin.iata,
      destination: fallback.origin,
      destinationIata: fallback.originIata
    };
  }

  return {
    ...fallback,
    origin: explicitOrigin.city,
    originIata: explicitOrigin.iata
  };
}

async function classifyWithAI(prompt: string, base: TripIntent) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0,
        max_tokens: 420,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "Extract a structured travel plan from the user request.",
              "Return JSON only with these optional fields: origin, destination, checkin, checkout, travelers, budget, currency, style, interests, needs.",
              "Dates must use YYYY-MM-DD when the user provides enough information.",
              "style must be one of budget, balanced, comfort, premium.",
              "needs may contain only flights, hotels, tours, cars.",
              "Do not return URLs, prices, hotel names, flight prices, booking claims, prose, HTML or markdown.",
              "Do not invent a date, budget or origin that the user did not imply. Preserve uncertainty by omitting the field."
            ].join(" ")
          },
          {
            role: "user",
            content: JSON.stringify({ request: prompt, deterministicGuess: base })
          }
        ]
      })
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "omnia.travel.ai_unavailable", reason: error instanceof Error ? error.name : "unknown" }));
    return null;
  }

  if (!response.ok) {
    console.error(JSON.stringify({ event: "omnia.travel.ai_error", status: response.status }));
    return null;
  }

  const data = await response.json().catch(() => ({}));
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return null;

  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt = String(body?.query || "").trim().slice(0, MAX_INPUT_CHARS);
  const country = String(body?.country || "GR").slice(0, 8);

  if (!prompt) {
    return NextResponse.json({ error: "Describe the trip you want Omnia to plan." }, { status: 400 });
  }

  const fallback = normalizeFallbackDirection(prompt, buildFallbackIntent(prompt, country));
  const ai = await classifyWithAI(prompt, fallback);
  const plan = ai ? mergeStructuredIntent(fallback, ai) : fallback;
  const result = buildTripResult(plan, country, ai ? "ai" : "fallback");

  console.log(JSON.stringify({
    event: "omnia.travel.plan",
    generatedBy: result.generatedBy,
    destination: result.plan.destination || null,
    needs: result.plan.needs,
    hasBudget: Boolean(result.plan.budget),
    hasDates: Boolean(result.plan.checkin && result.plan.checkout),
    ts: new Date().toISOString()
  }));

  return NextResponse.json(result);
}
