import { NextRequest, NextResponse } from "next/server";
import { byCategory, forCountry } from "../../../lib/affiliates";
import {
  detectIntent,
  extractDestination,
  parseDatesFromQuery,
  parseFlights,
  normalizeCountry,
  type Intent,
} from "../../../lib/smart";

export const runtime = "edge";
const MAX_QUERY_CHARS = 1200;

function reasonFor(partnerId: string, intent: Intent, country: string) {
  const label = intent[0].toUpperCase() + intent.slice(1);
  if (partnerId === "booking") return `Top ${label} option with locale/currency for ${country}.`;
  if (partnerId === "hotelscom") return `Reliable ${label} partner with strong regional support.`;
  if (partnerId === "rentalcars") return `Car hire coverage for your destination.`;
  if (partnerId === "skyscanner") return `Flight search for your route.`;
  if (partnerId === "getyourguide") return `Activities and tours provider.`;
  if (partnerId === "amazon") return `Localized shopping search for your country.`;
  if (partnerId === "revolut") return `Finance partner available in your country.`;
  return `Available ${label} option for ${country}.`;
}

export async function GET() {
  return NextResponse.json({ ok: true, ping: "suggest-api alive" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawQuery = String(body?.query || "").trim().slice(0, MAX_QUERY_CHARS);
    if (!rawQuery) {
      return NextResponse.json({ ok: false, error: "Query is required." }, { status: 400 });
    }

    const resolvedCountry =
      body?.country ||
      req.nextUrl.searchParams.get("country") ||
      req.cookies.get("country")?.value ||
      req.headers.get("x-country") ||
      "GR";
    const country = normalizeCountry(resolvedCountry);

    const uiCheckin = typeof body?.checkin === "string" ? body.checkin : undefined;
    const uiCheckout = typeof body?.checkout === "string" ? body.checkout : undefined;
    const intent: Intent = detectIntent(rawQuery);
    const parsedDates = parseDatesFromQuery(rawQuery);
    const checkin = uiCheckin || parsedDates.checkin;
    const checkout = uiCheckout || parsedDates.checkout;

    const dest =
      intent === "hotels" || intent === "cars" || intent === "tours"
        ? extractDestination(rawQuery)
        : rawQuery;

    const partners = forCountry(byCategory(intent), country);
    const suggestions = partners
      .map((p) => {
        let url: string;
        if (intent === "flights") {
          const f = parseFlights(rawQuery);
          const q = f.origin && f.destination ? `${f.origin}-${f.destination}` : rawQuery;
          url = p.buildUrl({ q, country, checkin: f.depart || checkin, checkout: f.ret || checkout });
        } else {
          url = p.buildUrl({ q: dest, country, checkin, checkout });
        }
        return { partnerId: p.id, title: p.name, url, reason: reasonFor(p.id, intent, country) };
      })
      .filter((s) => Boolean(s.url))
      .slice(0, 3);

    return NextResponse.json({
      ok: true,
      intent,
      country,
      query: rawQuery,
      destination: dest,
      checkin,
      checkout,
      suggestions,
    });
  } catch (err: any) {
    console.error(JSON.stringify({ event: "omnia.suggest.error", message: String(err?.message || err) }));
    return NextResponse.json({ ok: false, error: "Suggestion engine failed." }, { status: 500 });
  }
}
