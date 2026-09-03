import { CountryCode, COUNTRIES } from "./countries";
import { addDays, nextDay } from "date-fns";

export type Intent = "hotels" | "cars" | "flights" | "tours" | "shops" | "finance";

export function detectIntent(q: string): Intent {
  const s = (q || "").toLowerCase();
  if (/(hotel|hotels|room|rooms|hostel|booking|ξενοδοχ|δωμάτι)/i.test(s)) return "hotels";
  if (/(car|hire|rental|rent a car|αυτοκ|νοικιάζ)/i.test(s)) return "cars";
  if (/(flight|airline|ticket|plane|skyscanner|πτήσ|αεροπ)/i.test(s)) return "flights";
  if (/(tour|activity|things to do|attraction|guide|ξεναγ|δραστηρ|εκδρομ)/i.test(s)) return "tours";
  if (/(shop|buy|amazon|product|αγόρ|κατάστ)/i.test(s)) return "shops";
  if (/(card|bank|revolut|finance|κάρτα|τράπεζ)/i.test(s)) return "finance";
  return "hotels";
}

export function extractDestination(raw: string): string {
  let q = (raw || "").trim();
  if (q.includes(",")) return q.split(",")[0].trim();
  const m = q.match(/^(.+?)\s+(?:hotels?|hotel|rooms?|ξενοδοχε(?:ιο|ία|ια)|δωμάτι(?:ο|α))/i);
  if (m?.[1]) return m[1].trim();
  q = q
    .replace(/\b(cheap|budget|best|near|center|city|downtown|this|next|weekend|tonight|tomorrow)\b/gi, "")
    .replace(/\b(φθην[άη]|κέντρο|αύριο|σήμερα|σαββατοκύριακο)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return q;
}

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function toISO(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
export type ParsedDates = { checkin?: string; checkout?: string };

export function parseDatesFromQuery(raw: string, today = new Date()): ParsedDates {
  const s = (raw || "").toLowerCase();
  const iso = s.match(/(\d{4}-\d{2}-\d{2})/g);
  if (iso?.length) {
    const ci = iso[0];
    const co = iso[1] || toISO(addDays(parseISO(ci), 1));
    return { checkin: ci, checkout: co };
  }

  const dmy = s.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g);
  if (dmy?.length) {
    const [d1, m1, y1] = dmy[0].split(/[\/\-\.]/).map(Number);
    const first = new Date(y1, m1 - 1, d1);
    if (dmy.length >= 2) {
      const [d2, m2, y2] = dmy[1].split(/[\/\-\.]/).map(Number);
      return { checkin: toISO(first), checkout: toISO(new Date(y2, m2 - 1, d2)) };
    }
    return { checkin: toISO(first), checkout: toISO(addDays(first, 1)) };
  }

  if (/\b(today|σήμερα)\b/i.test(s)) {
    const ci = stripTime(today);
    return { checkin: toISO(ci), checkout: toISO(addDays(ci, 1)) };
  }
  if (/\b(tomorrow|αύριο)\b/i.test(s)) {
    const ci = addDays(stripTime(today), 1);
    return { checkin: toISO(ci), checkout: toISO(addDays(ci, 1)) };
  }
  if (/\b(this weekend|σαββατοκύριακο)\b/i.test(s)) {
    const sat = nextDay(stripTime(today), 6);
    return { checkin: toISO(sat), checkout: toISO(addDays(sat, 1)) };
  }
  return {};
}

function stripTime(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function parseISO(s: string) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }

export type FlightQuery = { origin?: string; destination?: string; depart?: string; ret?: string };
export function parseFlights(raw: string, today = new Date()): FlightQuery {
  const s = (raw || "").toUpperCase().trim();
  const m = s.match(/\b([A-Z]{3})\s*(?:-|–|>|\s+TO\s+|\s+)\s*([A-Z]{3})\b/);
  const out: FlightQuery = {};
  if (m) { out.origin = m[1]; out.destination = m[2]; }
  const d = parseDatesFromQuery(raw, today);
  if (d.checkin) out.depart = d.checkin;
  if (d.checkout) out.ret = d.checkout;
  return out;
}

const COUNTRY_CODES = new Set(COUNTRIES.map((c) => c.code));
export function normalizeCountry(input?: string): CountryCode {
  const cc = String(input || "GR").toUpperCase() as CountryCode;
  return COUNTRY_CODES.has(cc) ? cc : "GR";
}
