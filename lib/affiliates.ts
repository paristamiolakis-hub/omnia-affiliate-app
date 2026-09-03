import { CountryCode } from "./countries";

export type Category = "hotels" | "cars" | "flights" | "tours" | "shops" | "finance";

export interface Affiliate {
  id: string;
  name: string;
  category: Category;
  description?: string;
  countries: CountryCode[] | "ALL";
  buildUrl: (params?: {
    q?: string;
    country?: CountryCode;
    checkin?: string;
    checkout?: string;
  }) => string;
}

const env = (key: string) => (process.env[key] || "").trim();
const e = encodeURIComponent;

const COUNTRY_LOCALE: Record<CountryCode, string> = {
  GR: "el-GR", CY: "el-GR", GB: "en-GB", DE: "de-DE", FR: "fr-FR", IT: "it-IT",
  ES: "es-ES", US: "en-US", AE: "en-AE", SA: "en-SA", RS: "sr-RS", BG: "bg-BG"
};

const COUNTRY_CURRENCY: Record<CountryCode, string> = {
  GR: "EUR", CY: "EUR", GB: "GBP", DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR",
  US: "USD", AE: "AED", SA: "SAR", RS: "RSD", BG: "BGN"
};

const booking: Affiliate = {
  id: "booking",
  name: "Booking.com",
  category: "hotels",
  description: "Hotels & apartments worldwide",
  countries: "ALL",
  buildUrl: ({ q, country, checkin, checkout } = {}) => {
    const aid = env("NEXT_PUBLIC_BOOKING_AID");
    if (!aid) return "";
    const cc = (country || "GR") as CountryCode;
    const lang = COUNTRY_LOCALE[cc] || "en-GB";
    const currency = COUNTRY_CURRENCY[cc] || "EUR";
    let url = `https://www.booking.com/index.html?aid=${e(aid)}&lang=${e(lang)}&selected_currency=${e(currency)}`;
    if (q) url += `&ss=${e(q)}`;
    if (checkin) url += `&checkin=${e(checkin)}`;
    if (checkout) url += `&checkout=${e(checkout)}`;
    return url;
  }
};

const agoda: Affiliate = {
  id: "agoda",
  name: "Agoda",
  category: "hotels",
  description: "Hotels & stays",
  countries: "ALL",
  buildUrl: ({ q, country, checkin, checkout } = {}) => {
    const cid = env("NEXT_PUBLIC_AGODA_AFFID");
    if (!cid) return "";
    const cc = (country || "GR") as CountryCode;
    const currency = COUNTRY_CURRENCY[cc] || "EUR";
    const locale = (COUNTRY_LOCALE[cc] || "en-GB").toLowerCase();
    const city = (q || "").split(",")[0].trim() || "Heraklion";
    let los: number | undefined;
    if (checkin && checkout) {
      const ci = new Date(`${checkin}T00:00:00Z`);
      const co = new Date(`${checkout}T00:00:00Z`);
      const diff = Math.round((co.getTime() - ci.getTime()) / 86400000);
      if (diff > 0) los = diff;
    }
    const landing = [
      "https://www.agoda.com/search",
      `cid=${e(cid)}`,
      `locale=${e(locale)}`,
      `currency=${e(currency)}`,
      `city=${e(city)}`,
      `q=${e(city)}`,
      checkin ? `checkin=${e(checkin)}` : "",
      checkout ? `checkout=${e(checkout)}` : "",
      los ? `los=${e(String(los))}` : "",
      "rooms=1", "adults=2", "children=0", "childAges=", "pslc=1"
    ].filter(Boolean).join("&");
    return `https://www.agoda.com/partners/partnerredirect.aspx?cid=${e(cid)}&url=${e(landing)}`;
  }
};

const HCOM_SUBDOMAIN: Record<CountryCode, string> = {
  GR: "el", CY: "el", GB: "en", US: "en", DE: "de", FR: "fr", IT: "it", ES: "es",
  AE: "en", SA: "en", RS: "sr", BG: "bg"
};
const HCOM_POS: Partial<Record<CountryCode, string>> = {
  GR: "HCOM_GR", GB: "HCOM_UK", US: "HCOM_US", DE: "HCOM_DE", FR: "HCOM_FR",
  IT: "HCOM_IT", ES: "HCOM_ES"
};
const HCOM_SITEID: Partial<Record<CountryCode, string>> = {
  GR: "300000021", US: "300000001", GB: "300000002", DE: "300000003", FR: "300000004",
  IT: "300000005", ES: "300000006"
};

const hotelscom: Affiliate = {
  id: "hotelscom",
  name: "Hotels.com",
  category: "hotels",
  description: "Book hotels worldwide",
  countries: "ALL",
  buildUrl: ({ q, country, checkin, checkout } = {}) => {
    const pid = env("NEXT_PUBLIC_HOTELSCOM_PID");
    if (!pid) return "";
    const cc = (country || "GR") as CountryCode;
    const sub = HCOM_SUBDOMAIN[cc] || "en";
    const locale = (COUNTRY_LOCALE[cc] || "en-GB").replace("-", "_");
    const currency = COUNTRY_CURRENCY[cc] || "EUR";
    const pos = HCOM_POS[cc];
    const siteid = HCOM_SITEID[cc];
    let url = `https://${sub}.hotels.com/Hotel-Search?locale=${e(locale)}&currency=${e(currency)}&partnerid=${e(pid)}`;
    if (pos) url += `&pos=${e(pos)}`;
    if (siteid) url += `&siteid=${e(siteid)}`;
    if (q) url += `&destination=${e(q)}&q=${e(q)}`;
    if (checkin) url += `&check-in=${e(checkin)}&startDate=${e(checkin)}`;
    if (checkout) url += `&check-out=${e(checkout)}&endDate=${e(checkout)}`;
    return `${url}&adults=2`;
  }
};

const rentalcars: Affiliate = {
  id: "rentalcars",
  name: "Rentalcars.com",
  category: "cars",
  description: "Car hire worldwide",
  countries: "ALL",
  buildUrl: ({ q } = {}) => {
    const code = env("NEXT_PUBLIC_RENTALCARS_CODE");
    if (!code) return "";
    let url = `https://www.rentalcars.com/?affiliateCode=${e(code)}`;
    if (q) url += `&city=${e(q)}`;
    return url;
  }
};

const SKYSCANNER_DOMAIN: Record<CountryCode, string> = {
  GR: "www.skyscanner.net", CY: "www.skyscanner.net", GB: "www.skyscanner.net",
  DE: "www.skyscanner.de", FR: "www.skyscanner.fr", IT: "www.skyscanner.it",
  ES: "www.skyscanner.es", US: "www.skyscanner.com", AE: "www.skyscanner.ae",
  SA: "www.skyscanner.net", RS: "www.skyscanner.net", BG: "www.skyscanner.net"
};

const skyscanner: Affiliate = {
  id: "skyscanner",
  name: "Skyscanner",
  category: "flights",
  description: "Flight search & deals",
  countries: "ALL",
  buildUrl: ({ q, country, checkin, checkout } = {}) => {
    const pid = env("NEXT_PUBLIC_SKYSCANNER_PID");
    if (!pid) return "";
    const cc = (country || "GR") as CountryCode;
    const domain = SKYSCANNER_DOMAIN[cc] || "www.skyscanner.net";
    const locale = COUNTRY_LOCALE[cc] || "en-GB";
    const currency = COUNTRY_CURRENCY[cc] || "EUR";
    let origin = "";
    let dest = "";
    if (q) {
      const m = q.toUpperCase().match(/\b([A-Z]{3})\s*[-\s]\s*([A-Z]{3})\b/);
      if (m) { origin = m[1]; dest = m[2]; }
    }
    if (!origin || !dest) {
      return `https://${domain}/?associateid=${e(pid)}&locale=${e(locale)}&currency=${e(currency)}`;
    }
    let path = `/transport/flights/${origin}/${dest}`;
    if (checkin) path += `/${checkin}`;
    if (checkout) path += `/${checkout}`;
    return `https://${domain}${path}?associateid=${e(pid)}&locale=${e(locale)}&currency=${e(currency)}`;
  }
};

const amazonDomains: Record<CountryCode, string> = {
  GR: "amazon.de", CY: "amazon.de", GB: "amazon.co.uk", DE: "amazon.de", FR: "amazon.fr",
  IT: "amazon.it", ES: "amazon.es", US: "amazon.com", AE: "amazon.ae", SA: "amazon.sa",
  RS: "amazon.de", BG: "amazon.de"
};

const amazon: Affiliate = {
  id: "amazon",
  name: "Amazon",
  category: "shops",
  description: "Shop everything",
  countries: "ALL",
  buildUrl: ({ country, q } = {}) => {
    const tag = env("NEXT_PUBLIC_AMAZON_TAG");
    if (!tag) return "";
    const domain = amazonDomains[(country as CountryCode) || "GR"] || "amazon.com";
    if (q?.trim()) return `https://${domain}/s?k=${e(q.trim())}&tag=${e(tag)}`;
    return `https://${domain}/?tag=${e(tag)}`;
  }
};

const revolut: Affiliate = {
  id: "revolut",
  name: "Revolut",
  category: "finance",
  description: "Modern banking & cards",
  countries: ["GR", "CY", "GB", "DE", "FR", "IT", "ES", "BG"],
  buildUrl: () => {
    const cid = env("NEXT_PUBLIC_REVOLUT_CAMPAIGN_ID");
    return cid ? `https://revolut.com/referral/${e(cid)}` : "";
  }
};

const gyg: Affiliate = {
  id: "getyourguide",
  name: "GetYourGuide",
  category: "tours",
  description: "Tours, attractions & activities",
  countries: "ALL",
  buildUrl: ({ q } = {}) => {
    const aff = env("NEXT_PUBLIC_GETYOURGUIDE_AFFID");
    if (!aff) return "";
    let url = `https://www.getyourguide.com/?partner_id=${e(aff)}`;
    if (q) url += `&q=${e(q)}`;
    return url;
  }
};

export const AFFILIATES: Affiliate[] = [booking, agoda, hotelscom, rentalcars, skyscanner, gyg, amazon, revolut];
export const byCategory = (cat: Category) => AFFILIATES.filter((a) => a.category === cat);
export const forCountry = (list: Affiliate[], country: CountryCode) =>
  list.filter((a) => a.countries === "ALL" || (Array.isArray(a.countries) && a.countries.includes(country)));
