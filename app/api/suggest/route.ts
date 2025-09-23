// app/api/suggest/route.ts
import { NextRequest, NextResponse } from "next/server";

// ❗️Χρησιμοποιούμε relative imports για να αποφύγουμε alias προβλήματα στο Edge
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

function reasonFor(partnerId: string, intent: Intent, country: string) {
  const label = intent[0].toUpperCase() + intent.slice(1);
  if (partnerId === "booking") return `Top ${label} option with locale/currency for ${country}.`;
  if (partnerId === "hotelscom") return `Reliable ${label} partner with strong GR support.`;
  if (partnerId === "rentalcars") return `Solid car hire coverage in your region.`;
  if (partnerId === "skyscanner") return `Comprehensive flight search for your route.`;
  if (partnerId === "getyourguide") return `Popular activities & tours provider.`;
  if (partnerId === "amazon") return `Localized shopping domain for your country.`;
  if (partnerId === "revolut") return `Finance partner available in your country.`;
  return `Good ${label} option for ${country}.`;
}

// Προαιρετικό: GET για γρήγορο health-check
export async function GET() {
  return NextResponse.json({ ok: true, ping: "suggest-api alive" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawQuery = body?.query || "";

    // ✅ country από body → query (?country) → cookie → header → fallback GR
    const resolvedCountry =
      body?.country ||
      req.nextUrl.searchParams.get("country") ||
      req.cookies.get("country")?.value ||
      req.headers.get("x-country") ||
      "GR";
    const country = normalizeCountry(resolvedCountry);

    const uiCheckin = body?.checkin as string | undefined;
    const uiCheckout = body?.checkout as string | undefined;

    // 🔎 intent & dates
    const intent: Intent = detectIntent(rawQuery);
    const parsedDates = parseDatesFromQuery(rawQuery);
    const checkin = uiCheckin || parsedDates.checkin;
    const checkout = uiCheckout || parsedDates.checkout;

    // 🎯 destination (μόνο για hotels/cars/tours κάνουμε extract)
    const dest =
      intent === "hotels" || intent === "cars" || intent === "tours"
        ? extractDestination(rawQuery)
        : rawQuery;

    // 🤝 partners ανά χώρα
    let partners = forCountry(byCategory(intent), country);
    // partners = partners.filter(p => p.id !== "agoda"); // optional hide

    // 🧠 build suggestions (flights = IATA, αλλιώς dest)
    const suggestions = partners.slice(0, 3).map((p) => {
      let url: string;
      if (intent === "flights") {
        const f = parseFlights(rawQuery);
        const q = f.origin && f.destination ? `${f.origin}-${f.destination}` : rawQuery;
        url = p.buildUrl({ q, country, checkin: f.depart, checkout: f.ret });
      } else {
        url = p.buildUrl({ q: dest, country, checkin, checkout });
      }
      return { title: p.name, url, reason: reasonFor(p.id, intent, country) };
    });

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
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}