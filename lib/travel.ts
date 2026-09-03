import { AFFILIATES, byCategory, forCountry, type Category } from "./affiliates";
import { normalizeCountry, parseDatesFromQuery } from "./smart";
import type { CountryCode } from "./countries";

export type TravelCategory = Extract<Category, "flights" | "hotels" | "cars" | "tours">;
export type TravelStyle = "budget" | "balanced" | "comfort" | "premium";

export interface AirportMatch {
  city: string;
  iata: string;
}

export interface TripIntent {
  rawQuery: string;
  origin?: string;
  originIata?: string;
  destination: string;
  destinationIata?: string;
  checkin?: string;
  checkout?: string;
  travelers: number;
  budget?: number;
  currency: string;
  style: TravelStyle;
  interests: string[];
  needs: TravelCategory[];
}

export interface BudgetAllocation {
  currency: string;
  total: number;
  flights: number;
  hotels: number;
  tours: number;
  cars: number;
  buffer: number;
}

export interface TravelOffer {
  id: string;
  partnerId: string;
  provider: string;
  category: TravelCategory;
  title: string;
  description: string;
  url: string;
  trackedUrl: string;
  rank: number;
  badge: string;
  budgetTarget?: number;
  livePricing: false;
}

export interface TripPlanResult {
  plan: TripIntent;
  budget: BudgetAllocation | null;
  offers: Record<TravelCategory, TravelOffer[]>;
  generatedBy: "ai" | "fallback";
  warnings: string[];
  completeness: {
    destination: boolean;
    dates: boolean;
    origin: boolean;
    budget: boolean;
  };
}

const AIRPORTS: Array<{ aliases: string[]; city: string; iata: string }> = [
  { aliases: ["athens", "athina", "αθηνα", "αθήνα"], city: "Athens", iata: "ATH" },
  { aliases: ["heraklion", "iraklio", "ηρακλειο", "ηράκλειο", "crete", "kriti", "κρητη", "κρήτη"], city: "Heraklion", iata: "HER" },
  { aliases: ["thessaloniki", "salonika", "θεσσαλονικη", "θεσσαλονίκη"], city: "Thessaloniki", iata: "SKG" },
  { aliases: ["rome", "roma", "ρωμη", "ρώμη"], city: "Rome", iata: "FCO" },
  { aliases: ["milan", "milano", "μιλανο", "μιλάνο"], city: "Milan", iata: "MXP" },
  { aliases: ["paris", "παρισι", "παρίσι"], city: "Paris", iata: "CDG" },
  { aliases: ["london", "λονδινο", "λονδίνο"], city: "London", iata: "LHR" },
  { aliases: ["berlin", "βερολινο", "βερολίνο"], city: "Berlin", iata: "BER" },
  { aliases: ["barcelona", "βαρκελωνη", "βαρκελώνη"], city: "Barcelona", iata: "BCN" },
  { aliases: ["madrid", "μαδριτη", "μαδρίτη"], city: "Madrid", iata: "MAD" },
  { aliases: ["lisbon", "lisboa", "λισαβονα", "λισαβόνα"], city: "Lisbon", iata: "LIS" },
  { aliases: ["vienna", "βιεννη", "βιέννη"], city: "Vienna", iata: "VIE" },
  { aliases: ["prague", "praha", "πραγα", "πράγα"], city: "Prague", iata: "PRG" },
  { aliases: ["budapest", "βουδαπεστη", "βουδαπέστη"], city: "Budapest", iata: "BUD" },
  { aliases: ["amsterdam", "αμστερνταμ", "άμστερνταμ"], city: "Amsterdam", iata: "AMS" },
  { aliases: ["brussels", "bruxelles", "βρυξελλες", "βρυξέλλες"], city: "Brussels", iata: "BRU" },
  { aliases: ["istanbul", "constantinople", "κωνσταντινουπολη", "κωνσταντινούπολη"], city: "Istanbul", iata: "IST" },
  { aliases: ["dubai", "ντουμπαι", "ντουμπάι"], city: "Dubai", iata: "DXB" },
  { aliases: ["abu dhabi", "αμπου νταμπι", "άμπου ντάμπι"], city: "Abu Dhabi", iata: "AUH" },
  { aliases: ["new york", "nyc", "νεα υορκη", "νέα υόρκη"], city: "New York", iata: "JFK" },
  { aliases: ["los angeles", "la", "λος αντζελες", "λος άντζελες"], city: "Los Angeles", iata: "LAX" },
  { aliases: ["miami", "μαιαμι", "μαϊάμι"], city: "Miami", iata: "MIA" },
  { aliases: ["singapore", "σιγκαπουρη", "σιγκαπούρη"], city: "Singapore", iata: "SIN" },
  { aliases: ["tokyo", "τοκιο", "τόκιο"], city: "Tokyo", iata: "HND" },
  { aliases: ["bangkok", "μπανγκοκ", "μπάνγκοκ"], city: "Bangkok", iata: "BKK" }
];

const CATEGORY_ORDER: TravelCategory[] = ["flights", "hotels", "tours", "cars"];

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function rounded(value: number) {
  return Math.max(0, Math.round(value));
}

function parseNumber(raw: string) {
  const compact = raw.replace(/\s/g, "");
  if (/^\d{1,3}([.,]\d{3})+$/.test(compact)) return Number(compact.replace(/[.,]/g, ""));
  const decimalNormalized = compact.replace(",", ".");
  const n = Number(decimalNormalized);
  return Number.isFinite(n) ? n : undefined;
}

export function resolveAirport(value?: string): AirportMatch | undefined {
  const input = normalized(value || "").trim();
  if (!input) return undefined;

  const directIata = input.toUpperCase().match(/\b[A-Z]{3}\b/);
  if (directIata) {
    const known = AIRPORTS.find((entry) => entry.iata === directIata[0]);
    return known ? { city: known.city, iata: known.iata } : { city: directIata[0], iata: directIata[0] };
  }

  const match = AIRPORTS.find((entry) => entry.aliases.some((alias) => input.includes(normalized(alias))));
  return match ? { city: match.city, iata: match.iata } : undefined;
}

function airportsMentioned(raw: string): AirportMatch[] {
  const text = normalized(raw);
  const found: Array<AirportMatch & { index: number }> = [];

  for (const entry of AIRPORTS) {
    let bestIndex = -1;
    for (const alias of entry.aliases) {
      const index = text.indexOf(normalized(alias));
      if (index >= 0 && (bestIndex < 0 || index < bestIndex)) bestIndex = index;
    }
    if (bestIndex >= 0) found.push({ city: entry.city, iata: entry.iata, index: bestIndex });
  }

  return found.sort((a, b) => a.index - b.index).map(({ city, iata }) => ({ city, iata }));
}

function parseBudget(raw: string) {
  const patterns = [
    /(?:€|eur|euro|euros|ευρω|ευρώ)\s*([\d.,]+)/i,
    /([\d.,]+)\s*(?:€|eur|euro|euros|ευρω|ευρώ)/i,
    /(?:budget|προυπολογισμ(?:ο|ός)|μέχρι|εως|έως|up to)\s*(?:€|eur)?\s*([\d.,]+)/i
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) {
      const value = parseNumber(match[1]);
      if (value && value >= 50 && value <= 1_000_000) return rounded(value);
    }
  }
  return undefined;
}

function parseTravelers(raw: string) {
  const match = raw.match(/\b(\d{1,2})\s*(?:people|persons|adults|travellers|travelers|guests|άτομα|ατομα|ενήλικες|ενηλικες)/i);
  if (!match?.[1]) return 2;
  return Math.min(20, Math.max(1, Number(match[1])));
}

function detectStyle(raw: string): TravelStyle {
  const text = normalized(raw);
  if (/(luxury|premium|5 star|five star|πολυτελ|λουξ)/.test(text)) return "premium";
  if (/(comfort|comfortable|4 star|τεσσαρων αστερων|άνετ|ανετ)/.test(text)) return "comfort";
  if (/(cheap|budget|low cost|φθην|οικονομικ)/.test(text)) return "budget";
  return "balanced";
}

function detectInterests(raw: string) {
  const text = normalized(raw);
  const interests: string[] = [];
  const rules: Array<[RegExp, string]> = [
    [/(food|restaurant|gastronomy|φαγητ|εστιατορ|γαστρονομ)/, "food"],
    [/(museum|history|culture|μουσει|ιστορ|πολιτισ)/, "culture"],
    [/(nightlife|bar|club|βραδιν|μπαρ|κλαμπ)/, "nightlife"],
    [/(beach|sea|παραλι|θαλασσ)/, "beach"],
    [/(family|kids|children|οικογεν|παιδι)/, "family"],
    [/(romantic|couple|honeymoon|ρομαντικ|ζευγαρ|μηνα του μελιτος)/, "romantic"],
    [/(shopping|shop|αγορ|ψων)/, "shopping"],
    [/(nature|hiking|outdoor|φυση|πεζοπορ)/, "nature"]
  ];
  for (const [pattern, value] of rules) if (pattern.test(text)) interests.push(value);
  return interests;
}

function detectNeeds(raw: string): TravelCategory[] {
  const text = normalized(raw);
  const needs: TravelCategory[] = ["flights", "hotels", "tours"];
  if (/(car|rental|rent a car|drive|αυτοκιν|ενοικιασ)/.test(text)) needs.push("cars");
  if (/(no flight|χωρις πτηση|χωρίς πτήση)/.test(text)) return needs.filter((item) => item !== "flights");
  if (/(no hotel|χωρις ξενοδοχει|χωρίς ξενοδοχεί)/.test(text)) return needs.filter((item) => item !== "hotels");
  return needs;
}

function defaultCurrency(country: CountryCode) {
  if (country === "GB") return "GBP";
  if (country === "US") return "USD";
  if (country === "AE") return "AED";
  if (country === "SA") return "SAR";
  if (country === "RS") return "RSD";
  if (country === "BG") return "BGN";
  return "EUR";
}

export function buildFallbackIntent(rawQuery: string, countryInput?: string): TripIntent {
  const raw = rawQuery.trim().slice(0, 1800);
  const country = normalizeCountry(countryInput);
  const airportMentions = airportsMentioned(raw);
  const first = airportMentions[0];
  const second = airportMentions[1];
  const dates = parseDatesFromQuery(raw);

  const origin = second ? first : undefined;
  const destination = second || first;

  return {
    rawQuery: raw,
    origin: origin?.city,
    originIata: origin?.iata,
    destination: destination?.city || "",
    destinationIata: destination?.iata,
    checkin: dates.checkin,
    checkout: dates.checkout,
    travelers: parseTravelers(raw),
    budget: parseBudget(raw),
    currency: defaultCurrency(country),
    style: detectStyle(raw),
    interests: detectInterests(raw),
    needs: detectNeeds(raw)
  };
}

function safeDate(value: unknown) {
  if (typeof value !== "string") return undefined;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function safeString(value: unknown, max = 120) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeNeeds(value: unknown, fallback: TravelCategory[]) {
  if (!Array.isArray(value)) return fallback;
  const allowed = new Set<TravelCategory>(CATEGORY_ORDER);
  const result = value.filter((item): item is TravelCategory => typeof item === "string" && allowed.has(item as TravelCategory));
  return result.length ? Array.from(new Set(result)) : fallback;
}

function safeStyle(value: unknown, fallback: TravelStyle): TravelStyle {
  return ["budget", "balanced", "comfort", "premium"].includes(String(value))
    ? (value as TravelStyle)
    : fallback;
}

export function mergeStructuredIntent(base: TripIntent, parsed: Record<string, unknown>): TripIntent {
  const originRaw = safeString(parsed.origin);
  const destinationRaw = safeString(parsed.destination);
  const originMatch = resolveAirport(originRaw) || (base.origin ? resolveAirport(base.origin) : undefined);
  const destinationMatch = resolveAirport(destinationRaw) || (base.destination ? resolveAirport(base.destination) : undefined);
  const travelers = Number(parsed.travelers);
  const budget = Number(parsed.budget);
  const interests = Array.isArray(parsed.interests)
    ? parsed.interests.filter((item): item is string => typeof item === "string").map((item) => item.slice(0, 40)).slice(0, 8)
    : base.interests;

  return {
    ...base,
    origin: originMatch?.city || originRaw || base.origin,
    originIata: originMatch?.iata || base.originIata,
    destination: destinationMatch?.city || destinationRaw || base.destination,
    destinationIata: destinationMatch?.iata || base.destinationIata,
    checkin: safeDate(parsed.checkin) || base.checkin,
    checkout: safeDate(parsed.checkout) || base.checkout,
    travelers: Number.isFinite(travelers) && travelers >= 1 && travelers <= 20 ? Math.round(travelers) : base.travelers,
    budget: Number.isFinite(budget) && budget >= 50 && budget <= 1_000_000 ? rounded(budget) : base.budget,
    currency: safeString(parsed.currency, 6).toUpperCase() || base.currency,
    style: safeStyle(parsed.style, base.style),
    interests,
    needs: safeNeeds(parsed.needs, base.needs)
  };
}

export function allocateBudget(plan: TripIntent): BudgetAllocation | null {
  if (!plan.budget) return null;

  const weights: Record<TravelCategory | "buffer", number> = {
    flights: plan.style === "budget" ? 0.28 : plan.style === "premium" ? 0.24 : 0.27,
    hotels: plan.style === "budget" ? 0.43 : plan.style === "premium" ? 0.52 : 0.46,
    tours: plan.style === "budget" ? 0.13 : plan.style === "premium" ? 0.12 : 0.14,
    cars: 0.07,
    buffer: plan.style === "premium" ? 0.05 : 0.1
  };

  const enabled = new Set(plan.needs);
  let activeWeight = weights.buffer;
  for (const category of CATEGORY_ORDER) if (enabled.has(category)) activeWeight += weights[category];

  const amount = (category: TravelCategory | "buffer") => rounded(plan.budget! * (weights[category] / activeWeight));
  const result: BudgetAllocation = {
    currency: plan.currency,
    total: plan.budget,
    flights: enabled.has("flights") ? amount("flights") : 0,
    hotels: enabled.has("hotels") ? amount("hotels") : 0,
    tours: enabled.has("tours") ? amount("tours") : 0,
    cars: enabled.has("cars") ? amount("cars") : 0,
    buffer: amount("buffer")
  };

  const allocated = result.flights + result.hotels + result.tours + result.cars + result.buffer;
  result.buffer += result.total - allocated;
  return result;
}

function categoryBudget(budget: BudgetAllocation | null, category: TravelCategory) {
  return budget ? budget[category] : undefined;
}

function badgeFor(partnerId: string, index: number) {
  if (partnerId === "booking") return index === 0 ? "Best match" : "Hotel option";
  if (partnerId === "agoda") return "Compare price";
  if (partnerId === "hotelscom") return "Alternative";
  if (partnerId === "skyscanner") return "Flight search";
  if (partnerId === "getyourguide") return "Activities";
  if (partnerId === "rentalcars") return "Car rental";
  return "Partner";
}

export function buildTravelOffers(plan: TripIntent, countryInput?: string, budget = allocateBudget(plan)) {
  const country = normalizeCountry(countryInput);
  const result: Record<TravelCategory, TravelOffer[]> = { flights: [], hotels: [], cars: [], tours: [] };
  const enabled = new Set(plan.needs);

  for (const category of CATEGORY_ORDER) {
    if (!enabled.has(category)) continue;
    const partners = forCountry(byCategory(category), country);

    result[category] = partners.map((partner, index) => {
      const query = category === "flights"
        ? plan.originIata && plan.destinationIata
          ? `${plan.originIata}-${plan.destinationIata}`
          : ""
        : plan.destination;
      const url = partner.buildUrl({
        q: query || undefined,
        country,
        checkin: plan.checkin,
        checkout: plan.checkout
      });
      const trackedUrl = url
        ? `/api/out?partner=${encodeURIComponent(partner.id)}&source=travel-planner&url=${encodeURIComponent(url)}`
        : "";
      const target = categoryBudget(budget, category);
      const targetText = target ? ` Target budget: ${target} ${plan.currency}.` : "";
      return {
        id: `${category}-${partner.id}`,
        partnerId: partner.id,
        provider: partner.name,
        category,
        title: plan.destination ? `${partner.name} for ${plan.destination}` : partner.name,
        description: `${partner.description || "Affiliate partner"}.${targetText} Live price is confirmed on the partner site.`,
        url,
        trackedUrl,
        rank: index + 1,
        badge: badgeFor(partner.id, index),
        budgetTarget: target,
        livePricing: false as const
      };
    });
  }

  return result;
}

export function buildTripResult(plan: TripIntent, countryInput?: string, generatedBy: "ai" | "fallback" = "fallback"): TripPlanResult {
  const budget = allocateBudget(plan);
  const warnings: string[] = [];
  if (!plan.destination) warnings.push("Add a destination for destination-specific hotel and activity links.");
  if (!plan.originIata && plan.needs.includes("flights")) warnings.push("Add your departure city to create a direct flight search.");
  if (!plan.checkin || !plan.checkout) warnings.push("Add travel dates for date-specific partner searches.");
  if (!plan.budget) warnings.push("Add a total budget to let Omnia allocate spending targets.");
  if (!AIRPORTS.some((entry) => entry.iata === plan.destinationIata) && plan.destination && !plan.destinationIata) {
    warnings.push("The destination airport is not in Omnia's built-in resolver yet; partner destination search will still work where supported.");
  }

  return {
    plan,
    budget,
    offers: buildTravelOffers(plan, countryInput, budget),
    generatedBy,
    warnings,
    completeness: {
      destination: Boolean(plan.destination),
      dates: Boolean(plan.checkin && plan.checkout),
      origin: Boolean(plan.originIata),
      budget: Boolean(plan.budget)
    }
  };
}

export function configuredTravelPartners() {
  return AFFILIATES.filter((partner) => ["flights", "hotels", "cars", "tours"].includes(partner.category));
}
