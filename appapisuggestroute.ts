import { NextRequest, NextResponse } from "next/server";
import { byCategory, forCountry } from "@/lib/affiliates";

export const runtime = "edge";

type Intent = "hotels" | "cars" | "flights" | "tours" | "shops" | "finance";

function detectIntent(q: string): Intent {
  const s = q.toLowerCase();
  if (/(hotel|stay|room|hostel|booking)/i.test(s)) return "hotels";
  if (/(car|hire|rental|rent a car)/i.test(s)) return "cars";
  if (/(flight|airline|ticket|plane|skyscanner)/i.test(s)) return "flights";
  if (/(tour|activity|things to do|attraction|guide)/i.test(s)) return "tours";
  if (/(shop|buy|amazon|product)/i.test(s)) return "shops";
  if (/(card|bank|revolut|finance)/i.test(s)) return "finance";
  return "hotels";
}

export async function POST(req: NextRequest) {
  const { query, country } = await req.json().catch(() => ({ query: "", country: "GR" }));
  const intent = detectIntent(query || "");
  const partners = forCountry(byCategory(intent), (country || "GR") as any);

  // Πάρε μέχρι 3 προτάσεις
  const suggestions = partners.slice(0, 3).map((p) => ({
    title: `${p.name}`,
    url: p.buildUrl({ q: query }),
    reason: `Good ${intent} option for ${country}.`
  }));

  return NextRe
