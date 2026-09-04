import { destinationsMentioned, resolveDestination } from './destinations';
import { buildFallbackIntent, type TripIntent } from './travel';

export function buildSafeFallbackIntent(rawQuery: string, countryInput?: string): TripIntent {
  const fallback = buildFallbackIntent(rawQuery, countryInput);
  const mentioned = destinationsMentioned(rawQuery);
  const fromMatch = rawQuery.match(/(?:\bfrom\b|\bαπό\b|\bαπο\b)\s+([^,.;]+)/i);
  const explicitOrigin = fromMatch?.[1] ? resolveDestination(fromMatch[1]) : undefined;

  if (explicitOrigin) {
    fallback.origin = explicitOrigin.city;
    fallback.originIata = explicitOrigin.flightCode;
  } else if (fallback.origin) {
    const normalizedOrigin = resolveDestination(fallback.origin);
    const actuallyMentioned = normalizedOrigin && mentioned.some((item) => item.flightCode === normalizedOrigin.flightCode);
    if (!actuallyMentioned) {
      fallback.origin = undefined;
      fallback.originIata = undefined;
    }
  }

  const originCode = fallback.originIata;
  const destination = mentioned.find((item) => item.flightCode !== originCode) || mentioned[0];
  if (destination) {
    fallback.destination = destination.city;
    fallback.destinationIata = destination.flightCode;
  }

  return fallback;
}
