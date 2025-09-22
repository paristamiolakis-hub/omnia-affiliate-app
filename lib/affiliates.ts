import { CountryCode } from "./countries";

export type Category = "hotels" | "cars" | "flights" | "tours" | "shops" | "finance";

export interface Affiliate {
  id: string;
  name: string;
  category: Category;
  description?: string;
  countries: CountryCode[] | "ALL";
  // q: city/destination, country: user country, checkin/checkout: YYYY-MM-DD
  buildUrl: (params?: {
    q?: string;
    country?: CountryCode;
    checkin?: string;
    checkout?: string;
  }) => string;
}

// Helpers
const env = (key: string, fallback = "") => process.env[key] || fallback;
const e = encodeURIComponent;

// === Country → locale / currency maps ===
const COUNTRY_LOCALE: Record<CountryCode, string> = {
  GR: "el-GR",
  CY: "el-GR",
  GB: "en-GB",
  DE: "de-DE",
  FR: "fr-FR",
  IT: "it-IT",
  ES: "es-ES",
  US: "en-US",
  AE: "en-AE",
  SA: "en-SA",
  RS: "sr-RS",
  BG: "bg-BG"
};

const COUNTRY_CURRENCY: Record<CountryCode, string> = {
  GR: "EUR",
  CY: "EUR",
  GB: "GBP",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  US: "USD",
  AE: "AED",
  SA: "SAR",
  RS: "RSD",
  BG: "BGN"
};

// === Affiliates ===

// Booking.com (Hotels) with language, currency, and dates
const booking: Affiliate = {
  id: "booking",
  name: "Booking.com",
  category: "hotels",
  description: "Hotels & apartments worldwide",
  countries: "ALL",
  buildUrl: ({ q, country, checkin, checkout } = {}) => {
    const aid = env("NEXT_PUBLIC_BOOKING_AID", "YOUR_BOOKING_AID");
    const cc = (country || "GR") as CountryCode;
    const lang = COUNTRY_LOCALE[cc] || "en-GB";
    const currency = COUNTRY_CURRENCY[cc] || "EUR";
    let url = `https://www.booking.com/index.html?aid=${e(aid)}&lang=${e(lang)}&selected_currency=${e(currency)}`;
    if (q) url += `&ss=${e(q)}`;
    if (checkin)  url += `&checkin=${e(checkin)}`;
    if (checkout) url += `&checkout=${e(checkout)}`;
    return url;
  }
};

// Agoda (Hotels) — partnerredirect.aspx with encoded landing (respects dates)
const agoda: Affiliate = {
  id: "agoda",
  name: "Agoda",
  category: "hotels",
  description: "Hotels & stays",
  countries: "ALL",
  buildUrl: ({ q, country, checkin, checkout } = {}) => {
    const cid = env("NEXT_PUBLIC_AGODA_AFFID", "YOUR_AGODA_ID"); // το affiliate/partner ID σου
    const cc = (country || "GR") as CountryCode;
    const currency = COUNTRY_CURRENCY[cc] || "EUR";
    const locale = (COUNTRY_LOCALE[cc] || "en-GB").toLowerCase(); // π.χ. el-gr

    // καθάρισε μόνο την πόλη (χωρίς κόμματα/extra)
    const city = (q || "").split(",")[0].trim() || "Heraklion";

    // length of stay (nights)
    let los: number | undefined;
    if (checkin && checkout) {
      const ci = new Date(checkin + "T00:00:00Z");
      const co = new Date(checkout + "T00:00:00Z");
      const diff = Math.round((co.getTime() - ci.getTime()) / 86400000);
      if (diff > 0) los = diff;
    }

    // Φτιάχνουμε την ΠΡΑΓΜΑΤΙΚΗ landing σελίδα (search) με όλα τα params
    const landing = [
      "https://www.agoda.com/search",
      `cid=${e(cid)}`,                  // κάποιοι λογαριασμοί θέλουν και εδώ το cid
      `locale=${e(locale)}`,
      `currency=${e(currency)}`,
      `city=${e(city)}`,
      `q=${e(city)}`,
      checkin ? `checkin=${e(checkin)}` : "",
      checkout ? `checkout=${e(checkout)}` : "",
      los ? `los=${e(String(los))}` : "",
      "rooms=1",
      "adults=2",
      "children=0",
      "childAges=",
      "pslc=1"
    ].filter(Boolean).join("&");

    // Και μετά περνάμε ΜΕΣΑ από το partnerredirect.aspx (που τιμά τα παραπάνω)
    const url = `https://www.agoda.com/partners/partnerredirect.aspx?cid=${e(cid)}&url=${e(landing)}`;

    return url;
  }
};
// Hotels.com (Expedia Group) with subdomain, locale, currency, dates (robust)
const HCOM_SUBDOMAIN: Record<CountryCode, string> = {
  GR: "el", CY: "el",
  GB: "en", US: "en",
  DE: "de", FR: "fr",
  IT: "it", ES: "es",
  AE: "en", SA: "en",
  RS: "sr", BG: "bg"
};
const HCOM_POS: Record<CountryCode, string> = {
  GR: "HCOM_GR", GB: "HCOM_UK", US: "HCOM_US",
  DE: "HCOM_DE", FR: "HCOM_FR", IT: "HCOM_IT", ES: "HCOM_ES"
};
const HCOM_SITEID: Record<CountryCode, string> = {
  GR: "300000021", US: "300000001", GB: "300000002",
  DE: "300000003", FR: "300000004", IT: "300000005", ES: "300000006"
};

const hotelscom: Affiliate = {
  id: "hotelscom",
  name: "Hotels.com",
  category: "hotels",
  description: "Book hotels worldwide",
  countries: "ALL",
  buildUrl: ({ q, country, checkin, checkout } = {}) => {
    const pid = env("NEXT_PUBLIC_HOTELSCOM_PID", "YOUR_HOTELSCOM_ID");
    const cc = (country || "GR") as CountryCode;

    const sub = HCOM_SUBDOMAIN[cc] || "en";
    const locale = (COUNTRY_LOCALE[cc] || "en-GB").replace("-", "_"); // el_GR κ.λπ.
    const currency = COUNTRY_CURRENCY[cc] || "EUR";
    const pos = HCOM_POS[cc];
    const siteid = HCOM_SITEID[cc];

    let url = `https://${sub}.hotels.com/Hotel-Search?locale=${e(locale)}&currency=${e(currency)}&partnerid=${e(pid)}`;
    if (pos) url += `&pos=${e(pos)}`;
    if (siteid) url += `&siteid=${e(siteid)}`;

    if (q) {
      url += `&destination=${e(q)}&q=${e(q)}`;
    }
    // ΔΙΠΛΑ dates: και check-in/out ΚΑΙ startDate/endDate (μερικές φορές κρατάει τα δεύτερα)
    if (checkin)  url += `&check-in=${e(checkin)}&startDate=${e(checkin)}`;
    if (checkout) url += `&check-out=${e(checkout)}&endDate=${e(checkout)}`;

    // Προαιρετικά defaults
    url += `&adults=2`;

    return url;
  }
};
// Rentalcars.com (Cars)
const rentalcars: Affiliate = {
  id: "rentalcars",
  name: "Rentalcars.com",
  category: "cars",
  description: "Car hire worldwide",
  countries: "ALL",
  buildUrl: ({ q } = {}) => {
    const code = env("NEXT_PUBLIC_RENTALCARS_CODE", "YOUR_RENTALCARS_CODE");
    let url = `https://www.rentalcars.com/?affiliateCode=${e(code)}`;
    if (q) url += `&city=${e(q)}`;
    return url;
  }
};

// Skyscanner (Flights) with country-specific domain + locale/currency
const SKYSCANNER_DOMAIN: Record<CountryCode, string> = {
  GR: "www.skyscanner.net",
  CY: "www.skyscanner.net",
  GB: "www.skyscanner.net",
  DE: "www.skyscanner.de",
  FR: "www.skyscanner.fr",
  IT: "www.skyscanner.it",
  ES: "www.skyscanner.es",
  US: "www.skyscanner.com",
  AE: "www.skyscanner.ae",
  SA: "www.skyscanner.net",
  RS: "www.skyscanner.net",
  BG: "www.skyscanner.net"
};

const skyscanner: Affiliate = {
  id: "skyscanner",
  name: "Skyscanner",
  category: "flights",
  description: "Flight search & deals",
  countries: "ALL",
  buildUrl: ({ country } = {}) => {
    const pid = env("NEXT_PUBLIC_SKYSCANNER_PID", "YOUR_PARTNER_ID");
    const cc = (country || "GR") as CountryCode;
    const domain = SKYSCANNER_DOMAIN[cc] || "www.skyscanner.net";
    const locale = COUNTRY_LOCALE[cc] || "en-GB";
    const currency = COUNTRY_CURRENCY[cc] || "EUR";
    return `https://${domain}/?associateid=${e(pid)}&locale=${e(locale)}&currency=${e(currency)}`;
  }
};

// GetYourGuide (Tours/Activities)
const gyg: Affiliate = {
  id: "getyourguide",
  name: "GetYourGuide",
  category: "tours",
  description: "Tours, attractions & activities",
  countries: "ALL",
  buildUrl: ({ q } = {}) => {
    const aff = env("NEXT_PUBLIC_GETYOURGUIDE_AFFID", "YOUR_GETYOURGUIDE_ID");
    let url = `https://www.getyourguide.com/?partner_id=${e(aff)}`;
    if (q) url += `&q=${e(q)}`;
    return url;
  }
};

// Amazon (Shopping) — country-aware domains
const amazonDomains: Record<CountryCode, string> = {
  GR: "amazon.de", CY: "amazon.de", GB: "amazon.co.uk", DE: "amazon.de",
  FR: "amazon.fr", IT: "amazon.it", ES: "amazon.es", US: "amazon.com",
  AE: "amazon.ae", SA: "amazon.sa", RS: "amazon.de", BG: "amazon.de"
};

const amazon: Affiliate = {
  id: "amazon",
  name: "Amazon",
  category: "shops",
  description: "Shop everything",
  countries: "ALL",
  buildUrl: ({ country } = {}) => {
    const tag = env("NEXT_PUBLIC_AMAZON_TAG", "yourtag-21");
    const domain = amazonDomains[(country as CountryCode) || "GR"] || "amazon.com";
    return `https://${domain}/?tag=${e(tag)}`;
  }
};

// Revolut (Finance, CPA)
const revolut: Affiliate = {
  id: "revolut",
  name: "Revolut",
  category: "finance",
  description: "Modern banking & cards",
  countries: ["GR","CY","GB","DE","FR","IT","ES","BG"],
  buildUrl: () => {
    const cid = env("NEXT_PUBLIC_REVOLUT_CAMPAIGN_ID", "YOUR_REVOLUT_CAMPAIGN");
    return `https://revolut.com/referral/${e(cid)}`;
  }
};

export const AFFILIATES: Affiliate[] = [
  booking,
  agoda,
  hotelscom,
  rentalcars,
  skyscanner,
  gyg,
  amazon,
  revolut
];

export const byCategory = (cat: Category) => AFFILIATES.filter(a => a.category === cat);

export const forCountry = (list: Affiliate[], country: CountryCode) =>
  list.filter(a => a.countries === "ALL" || a.countries.includes(country));