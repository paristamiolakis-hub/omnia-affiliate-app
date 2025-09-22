// lib/smart.ts
import { CountryCode } from "@/lib/countries";

export type Intent = "hotels" | "cars" | "flights" | "tours" | "shops" | "finance";

export function detectIntent(q: string): Intent {
  const s = (q || "").toLowerCase();

  if (/(hotel|hotels|room|rooms|hostel|booking|ξενοδοχ|δωμάτι)/i.test(s)) return "hotels";
  if (/(car|hire|rental|rent a car|αυτοκ|νοικιάζ)/i.test(s)) return "cars";
  if (/(flight|airline|ticket|plane|skyscanner|πτήσ|αεροπ)/i.test(s)) return "flights";
  if (/(tour|activity|things to do|attraction|guide|ξεναγ|δραστηρ|εκδρομ)/i.test(s)) return "tours";
  if (/(shop|buy|amazon|product|αγόρ|κατάστ)/i.test(s)) return "shops";
  if (/(card|bank|revolut|finance|κάρτα|τράπεζ)/i.test(s)) return "finance";

  // default fallback
  return "hotels";
}

// Απλός extractor προορισμού για Hotels/Cars/Tours (κρατά καθαρή πόλη)
export function extractDestination(raw: string): string {
  let q = (raw || "").trim();

  // Αν έχει κόμμα → πάρε το πρώτο τμήμα (π.χ. "Ηράκλειο, Κρήτη, Ελλάδα")
  if (q.includes(",")) return q.split(",")[0].trim();

  // Πριν από λέξεις-κλειδιά τύπου "hotels/ξενοδοχεία"
  const m = q.match(/^(.+?)\s+(?:hotels?|hotel|rooms?|ξενοδοχε(?:ιο|ία|ια)|δωμάτι(?:ο|α))/i);
  if (m?.[1]) return m[1].trim();

  // Καθάρισε κοινές "θορυβώδεις" λέξεις
  q = q
    .replace(/\b(cheap|budget|best|near|center|city|downtown|this|next|weekend|tonight|tomorrow)\b/gi, "")
    .replace(/\b(φθην[άη]|κέντρο|αύριο|σήμερα|σαββατοκύριακο)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return q;
}

// ---------------- Dates parsing (lightweight) ----------------

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function toISO(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

export type ParsedDates = { checkin?: string; checkout?: string };

export function parseDatesFromQuery(raw: string, today = new Date()): ParsedDates {
  const s = (raw || "").toLowerCase();

  // 1) Explicit YYYY-MM-DD
  const iso = s.match(/(\d{4}-\d{2}-\d{2})/g);
  if (iso && iso.length >= 1) {
    const ci = iso[0];
    const co = iso[1] || toISO(addDays(parseISO(ci), 1));
    return { checkin: ci, checkout: co };
  }

  // 2) DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g);
  if (dmy && dmy.length >= 1) {
    const [d1, m1, y1] = dmy[0].split(/[\/\-\.]/).map(Number);
    const ci = toISO(new Date(y1, m1-1, d1));
    // δεύτερη ημερομηνία;
    if (dmy.length >= 2) {
      const [d2, m2, y2] = dmy[1].split(/[\/\-\.]/).map(Number);
      const co = toISO(new Date(y2, m2-1, d2));
      return { checkin: ci, checkout: co };
    }
    return { checkin: ci, checkout: toISO(addDays(new Date(y1, m1-1, d1), 1)) };
  }

  // 3) "today", "tomorrow"
  if (/\b(today|σήμερα)\b/i.test(s)) {
    const ci = stripTime(today);
    return { checkin: toISO(ci), checkout: toISO(addDays(ci, 1)) };
  }
  if (/\b(tomorrow|αύριο)\b/i.test(s)) {
    const ci = addDays(stripTime(today), 1);
    return { checkin: toISO(ci), checkout: toISO(addDays(ci, 1)) };
  }

  // 4) "this weekend" → επόμενο Σάββατο-Κυριακή
  if (/\b(this weekend|σαββατοκύριακο)\b/i.test(s)) {
    const sat = nextDay(stripTime(today), 6); // 0=Sun...6=Sat
    const sun = addDays(sat, 1);
    return { checkin: toISO(sat), checkout: toISO(sun) };
  }

  // 5) Fallback: χωρίς ημερομηνίες
  return {};
}

function stripTime(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function parseISO(s: string) { const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); }

// ---------------- Flights parsing (very light) ----------------
// Συντηρητικά: ATH-LON ή "ATH to LON"
export type FlightQuery = { origin?: string; destination?: string; depart?: string; ret?: string };

export function parseFlights(raw: string, today = new Date()): FlightQuery {
  const s = (raw || "").toUpperCase().trim();

  // IATA3-IATA3
  let m = s.match(/\b([A-Z]{3})\s*[-–>\s]\s*([A-Z]{3})\b/);
  const out: FlightQuery = {};
  if (m) { out.origin = m[1]; out.destination = m[2]; }

  // Ημερομηνίες (χρησιμοποιούμε τον ίδιο parser & τα ίδια fields)
  const d = parseDatesFromQuery(raw, today);
  if (d.checkin) out.depart = d.checkin;
  if (d.checkout) out.ret = d.checkout;

  return out;
}

// Χώρες/locale default (για πληρότητα)
export function normalizeCountry(input?: string): CountryCode {
  const cc = (input || "GR") as CountryCode;
  return cc;
}