import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const ALLOWED_HOST_SUFFIXES = [
  "booking.com",
  "agoda.com",
  "hotels.com",
  "rentalcars.com",
  "skyscanner.net",
  "skyscanner.com",
  "skyscanner.de",
  "skyscanner.fr",
  "skyscanner.it",
  "skyscanner.es",
  "skyscanner.ae",
  "getyourguide.com",
  "amazon.com",
  "amazon.co.uk",
  "amazon.de",
  "amazon.fr",
  "amazon.it",
  "amazon.es",
  "amazon.ae",
  "amazon.sa",
  "revolut.com"
];

function allowedHost(hostname: string) {
  const host = hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url") || "";
  const partner = (req.nextUrl.searchParams.get("partner") || "unknown").slice(0, 64);
  let destination: URL;

  try {
    destination = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid destination." }, { status: 400 });
  }

  if (destination.protocol !== "https:" || !allowedHost(destination.hostname)) {
    return NextResponse.json({ error: "Destination is not allowed." }, { status: 400 });
  }

  console.log(JSON.stringify({
    event: "omnia.affiliate_click",
    partner,
    host: destination.hostname,
    path: req.nextUrl.pathname,
    ts: new Date().toISOString()
  }));

  return NextResponse.redirect(destination, 302);
}
