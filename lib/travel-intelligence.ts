import { resolveDestination, type DestinationProfile } from './destinations';
import type { TripPlanResult, TravelCategory, TravelOffer, TravelStyle } from './travel';

export interface RankedTravelOffer extends TravelOffer {
  fitScore: number;
  fitReasons: string[];
}

export interface DestinationInsight {
  slug: string;
  city: string;
  country: string;
  summary: string;
  highlights: string[];
  interests: string[];
  suggestedDays: { min: number; max: number };
  carUseful: boolean;
}

export interface TripIntelligence {
  readinessScore: number;
  readinessLabel: 'Needs details' | 'Good start' | 'Ready to search';
  nights?: number;
  durationLabel?: 'Short stay' | 'Good duration' | 'Long stay';
  destination?: DestinationInsight;
  nextBestActions: string[];
}

export interface IntelligentTripPlanResult extends Omit<TripPlanResult, 'offers'> {
  offers: Record<TravelCategory, RankedTravelOffer[]>;
  intelligence: TripIntelligence;
}

const PARTNER_PROFILES: Record<string, {
  base: number;
  styles?: TravelStyle[];
  interests?: string[];
}> = {
  booking: { base: 72, styles: ['balanced', 'comfort', 'premium'], interests: ['family', 'romantic', 'culture'] },
  agoda: { base: 70, styles: ['budget', 'balanced'], interests: ['nightlife', 'shopping'] },
  hotelscom: { base: 68, styles: ['balanced', 'comfort'], interests: ['family'] },
  skyscanner: { base: 78, styles: ['budget', 'balanced', 'comfort', 'premium'] },
  getyourguide: { base: 76, interests: ['culture', 'family', 'food', 'nature', 'romantic'] },
  rentalcars: { base: 74, styles: ['balanced', 'comfort', 'premium'] }
};

function nightsBetween(checkin?: string, checkout?: string) {
  if (!checkin || !checkout) return undefined;
  const start = Date.parse(`${checkin}T00:00:00Z`);
  const end = Date.parse(`${checkout}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return undefined;
  const nights = Math.round((end - start) / 86400000);
  return nights > 0 && nights < 366 ? nights : undefined;
}

function readiness(result: TripPlanResult) {
  let score = 0;
  if (result.completeness.destination) score += 25;
  if (result.completeness.dates) score += 25;
  if (!result.plan.needs.includes('flights') || result.completeness.origin) score += 20;
  if (result.completeness.budget) score += 20;
  if (result.plan.interests.length > 0) score += 10;
  return Math.min(100, score);
}

function readinessLabel(score: number): TripIntelligence['readinessLabel'] {
  if (score >= 85) return 'Ready to search';
  if (score >= 55) return 'Good start';
  return 'Needs details';
}

function destinationInsight(profile?: DestinationProfile): DestinationInsight | undefined {
  if (!profile) return undefined;
  return {
    slug: profile.slug,
    city: profile.city,
    country: profile.country,
    summary: profile.summary,
    highlights: profile.highlights,
    interests: profile.interests,
    suggestedDays: profile.suggestedDays,
    carUseful: profile.carUseful
  };
}

function durationLabel(nights: number | undefined, profile?: DestinationProfile): TripIntelligence['durationLabel'] | undefined {
  if (!nights || !profile) return undefined;
  if (nights < profile.suggestedDays.min) return 'Short stay';
  if (nights > profile.suggestedDays.max + 1) return 'Long stay';
  return 'Good duration';
}

function nextActions(result: TripPlanResult, profile: DestinationProfile | undefined, nights: number | undefined) {
  const actions: string[] = [];
  if (!result.completeness.origin && result.plan.needs.includes('flights')) actions.push('Add a departure city to create a route-specific flight search.');
  if (!result.completeness.dates) actions.push('Add travel dates so partner searches can be date-specific.');
  if (!result.completeness.budget) actions.push('Add a total budget so Omnia can allocate category targets.');
  if (result.plan.interests.length === 0) actions.push('Add interests such as food, culture, beach or nightlife to improve fit ranking.');
  if (profile && nights && nights < profile.suggestedDays.min) {
    actions.push(`${profile.city} usually benefits from about ${profile.suggestedDays.min}-${profile.suggestedDays.max} days in Omnia's planning model.`);
  }
  if (profile && result.plan.needs.includes('cars') && !profile.carUseful) {
    actions.push(`A car is optional for a typical ${profile.city} city stay; compare that cost against public transport before booking.`);
  }
  return actions.slice(0, 4);
}

function scoreOffer(offer: TravelOffer, result: TripPlanResult, profile?: DestinationProfile) {
  const partner = PARTNER_PROFILES[offer.partnerId] || { base: 64 };
  let score = partner.base;
  const reasons: string[] = [];

  if (offer.url) {
    score += 6;
    reasons.push('Partner is configured');
  } else {
    score -= 25;
    reasons.push('Partner setup is still required');
  }

  if (result.plan.destination) {
    score += 4;
    reasons.push('Destination included');
  }
  if (result.plan.checkin && result.plan.checkout) {
    score += 4;
    reasons.push('Dates included');
  }
  if (offer.category === 'flights' && result.plan.originIata && result.plan.destinationIata) {
    score += 7;
    reasons.push('Route resolved');
  }
  if (result.budget?.[offer.category]) {
    score += 2;
    reasons.push('Budget target available');
  }
  if (partner.styles?.includes(result.plan.style)) {
    score += 5;
    reasons.push(`Matches ${result.plan.style} trip style`);
  }

  const matchedInterests = result.plan.interests.filter((interest) => partner.interests?.includes(interest));
  if (matchedInterests.length) {
    score += Math.min(6, matchedInterests.length * 3);
    reasons.push(`Fits ${matchedInterests.slice(0, 2).join(' + ')} preference`);
  }

  if (offer.category === 'tours' && profile && result.plan.interests.some((interest) => profile.interests.includes(interest))) {
    score += 4;
    reasons.push('Destination interests align');
  }
  if (offer.category === 'cars' && profile?.carUseful) {
    score += 4;
    reasons.push('Car can add flexibility here');
  }

  return { score: Math.max(0, Math.min(99, score)), reasons: reasons.slice(0, 4) };
}

function rankOffers(result: TripPlanResult, profile?: DestinationProfile) {
  const categories: TravelCategory[] = ['flights', 'hotels', 'tours', 'cars'];
  const ranked = {} as Record<TravelCategory, RankedTravelOffer[]>;

  for (const category of categories) {
    ranked[category] = result.offers[category]
      .map((offer) => {
        const fit = scoreOffer(offer, result, profile);
        return { ...offer, fitScore: fit.score, fitReasons: fit.reasons };
      })
      .sort((a, b) => b.fitScore - a.fitScore || a.provider.localeCompare(b.provider))
      .map((offer, index) => ({
        ...offer,
        rank: index + 1,
        badge: index === 0 ? 'Best Omnia fit' : offer.badge
      }));
  }

  return ranked;
}

export function addTravelIntelligence(result: TripPlanResult): IntelligentTripPlanResult {
  const profile = resolveDestination(result.plan.destination);
  const nights = nightsBetween(result.plan.checkin, result.plan.checkout);
  const score = readiness(result);

  return {
    ...result,
    offers: rankOffers(result, profile),
    intelligence: {
      readinessScore: score,
      readinessLabel: readinessLabel(score),
      nights,
      durationLabel: durationLabel(nights, profile),
      destination: destinationInsight(profile),
      nextBestActions: nextActions(result, profile, nights)
    }
  };
}
