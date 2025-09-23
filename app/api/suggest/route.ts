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
    const country = normalizeCountry(body?.country);
    const uiCheckin = body?.checkin as string | undefined;
    const uiCheckout = body?.checkout as string | undefined;

    const intent: Intent = detectIntent(rawQuery);

    const parsedDates = parseDatesFromQuery(rawQuery);
    const checkin = uiCheckin || parsedDates.checkin;
    const checkout = uiCheckout || parsedDates.checkout;

    const dest =
      intent === "hotels" || intent === "cars" || intent === "tours"
        ? extractDestination(rawQuery)
        : rawQuery;

    let partners = forCountry(byCategory(intent), country);
    // Αν θες προσωρινά να κρύψεις Agoda από το Smart Search:
    // partners = partners.filter(p => p.id !== "agoda");

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
    // Βοηθητικό error για να δεις τι σπάει από το UI
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}