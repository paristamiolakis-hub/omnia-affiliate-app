import type { BudgetAllocation, TravelCategory } from './travel';
import type { IntelligentTripPlanResult, RankedTravelOffer } from './travel-intelligence';

export interface ItineraryBlock {
  period: 'Morning' | 'Afternoon' | 'Evening';
  title: string;
  detail: string;
}

export interface ItineraryDay {
  day: number;
  date?: string;
  title: string;
  focus: string;
  blocks: ItineraryBlock[];
}

export interface ItineraryPlan {
  days: ItineraryDay[];
  coverageNote?: string;
  disclaimer: string;
}

export interface BudgetMovement {
  category: TravelCategory | 'buffer';
  current: number;
  recommended: number;
  delta: number;
}

export interface BudgetOptimizer {
  total: number;
  currency: string;
  perPerson: number;
  perNight?: number;
  perPersonPerNight?: number;
  recommended: BudgetAllocation;
  movements: BudgetMovement[];
  recommendations: string[];
  disclaimer: string;
}

export interface ComparisonOffer {
  partnerId: string;
  provider: string;
  rank: number;
  fitScore: number;
  configured: boolean;
  contextReady: boolean;
  datesIncluded: boolean;
  budgetTarget?: number;
  strengths: string[];
}

export interface CategoryComparison {
  category: TravelCategory;
  recommendedPartnerId?: string;
  offers: ComparisonOffer[];
}

export interface DecisionSupport {
  itinerary: ItineraryPlan;
  budgetOptimizer: BudgetOptimizer | null;
  comparisons: CategoryComparison[];
}

export interface DecisionTripPlanResult extends IntelligentTripPlanResult {
  decisionSupport: DecisionSupport;
}

const CATEGORIES: TravelCategory[] = ['flights', 'hotels', 'tours', 'cars'];

function rounded(value: number) {
  return Math.max(0, Math.round(value));
}

function addDays(isoDate: string | undefined, days: number) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return undefined;
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return undefined;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function interestFocus(interests: string[], day: number) {
  const ordered = interests.length ? interests : ['culture', 'food', 'neighbourhoods'];
  return ordered[(day - 1) % ordered.length];
}

function afternoonFor(interest: string, city: string) {
  const map: Record<string, { title: string; detail: string }> = {
    food: { title: 'Local food window', detail: `Keep the afternoon flexible for a market, café district or local-food area in ${city}.` },
    culture: { title: 'Culture block', detail: 'Use this block for one museum, historic site or cultural district rather than overloading the day.' },
    nightlife: { title: 'Slow afternoon', detail: 'Keep some energy in reserve and use the afternoon for a walk, café stop or neighbourhood exploration.' },
    beach: { title: 'Beach / waterfront block', detail: 'Reserve a longer flexible block for the coast or waterfront and account for transfer time.' },
    family: { title: 'Family-friendly anchor', detail: 'Choose one main attraction with buffer time before and after it instead of stacking too many stops.' },
    romantic: { title: 'Scenic neighbourhood time', detail: 'Leave space for viewpoints, a walk and an unhurried stop rather than a tightly packed schedule.' },
    shopping: { title: 'Shopping district block', detail: 'Group shopping into one area to reduce backtracking and protect time for the rest of the trip.' },
    nature: { title: 'Outdoor block', detail: 'Use the afternoon for a park, trail, coast or other outdoor activity with transport time included.' }
  };
  return map[interest] || { title: 'Neighbourhood exploration', detail: `Explore one area of ${city} deeply instead of crossing the city repeatedly.` };
}

function eveningFor(interests: string[], city: string) {
  if (interests.includes('nightlife')) return { title: 'Nightlife window', detail: `Keep the evening open for a nightlife area in ${city}; verify transport back before going out.` };
  if (interests.includes('food')) return { title: 'Dinner + local area', detail: 'Use the evening for dinner and a nearby walk so the itinerary stays geographically compact.' };
  if (interests.includes('romantic')) return { title: 'Scenic evening', detail: 'Choose a viewpoint, waterfront or atmospheric neighbourhood and keep the pace light.' };
  return { title: 'Flexible evening', detail: 'Keep one unscheduled evening block for weather, energy levels or a spontaneous local recommendation.' };
}

function buildItinerary(result: IntelligentTripPlanResult): ItineraryPlan {
  const destination = result.intelligence.destination;
  const city = destination?.city || result.plan.destination || 'the destination';
  const nights = result.intelligence.nights;
  const suggestedDays = destination?.suggestedDays.min || 3;
  const fullDays = nights ? nights + 1 : suggestedDays;
  const visibleDays = Math.min(7, Math.max(1, fullDays));
  const highlights = destination?.highlights?.length ? destination.highlights : ['Central area', 'Local neighbourhoods', 'Main sights'];
  const interests = result.plan.interests.length ? result.plan.interests : destination?.interests || [];
  const days: ItineraryDay[] = [];

  for (let index = 0; index < visibleDays; index += 1) {
    const day = index + 1;
    const first = day === 1;
    const last = day === visibleDays && Boolean(nights);
    const highlight = highlights[index % highlights.length];
    const focus = interestFocus(interests, day);
    const afternoon = afternoonFor(focus, city);
    const evening = eveningFor(interests, city);

    const morning = first
      ? { title: 'Arrive + orient', detail: `Settle in, learn the immediate area and avoid committing to a time-sensitive attraction right after arrival.` }
      : last
        ? { title: 'Easy final morning', detail: 'Keep the final morning low-risk and leave enough time for check-out and the airport or onward transport.' }
        : { title: highlight, detail: `Use ${highlight} as the main anchor, then keep nearby stops grouped around it.` };

    days.push({
      day,
      date: addDays(result.plan.checkin, index),
      title: first ? `Arrival + ${city} orientation` : last ? `Final day in ${city}` : `${highlight} + ${focus}`,
      focus,
      blocks: [
        { period: 'Morning', ...morning },
        { period: 'Afternoon', ...afternoon },
        { period: 'Evening', ...evening }
      ]
    });
  }

  return {
    days,
    coverageNote: fullDays > visibleDays ? `Showing the first ${visibleDays} days of a ${fullDays}-day calendar trip.` : undefined,
    disclaimer: 'Planning template only. Verify opening hours, transfer times, reservations and local conditions before booking.'
  };
}

function normalizeWeights(weights: Record<TravelCategory | 'buffer', number>, enabled: Set<TravelCategory>) {
  const keys: Array<TravelCategory | 'buffer'> = [...CATEGORIES.filter((category) => enabled.has(category)), 'buffer'];
  const sum = keys.reduce((total, key) => total + Math.max(0, weights[key]), 0) || 1;
  const normalized = { flights: 0, hotels: 0, tours: 0, cars: 0, buffer: 0 } as Record<TravelCategory | 'buffer', number>;
  for (const key of keys) normalized[key] = Math.max(0, weights[key]) / sum;
  return normalized;
}

function recommendedBudget(result: IntelligentTripPlanResult): BudgetAllocation | null {
  if (!result.budget) return null;
  const enabled = new Set(result.plan.needs);
  const weights: Record<TravelCategory | 'buffer', number> = {
    flights: enabled.has('flights') ? 28 : 0,
    hotels: enabled.has('hotels') ? 44 : 0,
    tours: enabled.has('tours') ? 13 : 0,
    cars: enabled.has('cars') ? 6 : 0,
    buffer: 9
  };

  if (result.plan.style === 'budget') {
    weights.hotels -= enabled.has('hotels') ? 3 : 0;
    weights.tours -= enabled.has('tours') ? 1 : 0;
    weights.buffer += 4;
  } else if (result.plan.style === 'comfort') {
    weights.hotels += enabled.has('hotels') ? 4 : 0;
    weights.buffer -= 2;
    weights.tours -= enabled.has('tours') ? 2 : 0;
  } else if (result.plan.style === 'premium') {
    weights.hotels += enabled.has('hotels') ? 7 : 0;
    weights.tours += enabled.has('tours') ? 2 : 0;
    weights.buffer -= 5;
  }

  const experienceInterest = result.plan.interests.some((item) => ['culture', 'food', 'nature', 'family', 'beach'].includes(item));
  if (experienceInterest && enabled.has('tours')) {
    weights.tours += 4;
    if (enabled.has('hotels')) weights.hotels -= 2;
    weights.buffer -= 2;
  }

  if (enabled.has('cars')) {
    if (result.intelligence.destination?.carUseful) {
      weights.cars += 4;
      if (enabled.has('hotels')) weights.hotels -= 2;
      weights.buffer -= 2;
    } else {
      weights.cars = Math.max(2, weights.cars - 4);
      if (enabled.has('tours')) weights.tours += 2;
      weights.buffer += 2;
    }
  }

  weights.buffer = Math.max(5, weights.buffer);
  const normalized = normalizeWeights(weights, enabled);
  const total = result.budget.total;
  const allocation: BudgetAllocation = {
    currency: result.budget.currency,
    total,
    flights: enabled.has('flights') ? rounded(total * normalized.flights) : 0,
    hotels: enabled.has('hotels') ? rounded(total * normalized.hotels) : 0,
    tours: enabled.has('tours') ? rounded(total * normalized.tours) : 0,
    cars: enabled.has('cars') ? rounded(total * normalized.cars) : 0,
    buffer: rounded(total * normalized.buffer)
  };

  const allocated = allocation.flights + allocation.hotels + allocation.tours + allocation.cars + allocation.buffer;
  allocation.buffer += total - allocated;
  return allocation;
}

function buildBudgetOptimizer(result: IntelligentTripPlanResult): BudgetOptimizer | null {
  if (!result.budget) return null;
  const recommended = recommendedBudget(result);
  if (!recommended) return null;
  const travelers = Math.max(1, result.plan.travelers);
  const nights = result.intelligence.nights;
  const total = result.budget.total;
  const movements: BudgetMovement[] = [...CATEGORIES, 'buffer'].map((category) => ({
    category,
    current: result.budget![category],
    recommended: recommended[category],
    delta: recommended[category] - result.budget![category]
  }));
  const recommendations: string[] = [];
  const strongest = [...movements]
    .filter((item) => item.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  for (const movement of strongest.slice(0, 3)) {
    const label = movement.category === 'tours' ? 'activities' : movement.category === 'cars' ? 'car rental' : movement.category;
    if (movement.delta > 0) recommendations.push(`Consider moving about ${movement.delta} ${result.budget.currency} more toward ${label}.`);
    else recommendations.push(`Consider reducing the ${label} target by about ${Math.abs(movement.delta)} ${result.budget.currency}.`);
  }

  if (result.plan.needs.includes('cars') && result.intelligence.destination && !result.intelligence.destination.carUseful) {
    recommendations.unshift(`A car is not essential in Omnia's typical ${result.intelligence.destination.city} profile, so keep that allocation lean unless you have day trips planned.`);
  }

  return {
    total,
    currency: result.budget.currency,
    perPerson: rounded(total / travelers),
    perNight: nights ? rounded(total / nights) : undefined,
    perPersonPerNight: nights ? rounded(total / travelers / nights) : undefined,
    recommended,
    movements,
    recommendations: recommendations.slice(0, 4),
    disclaimer: 'This optimizes your chosen budget allocation only. It does not estimate market prices or guarantee affordability.'
  };
}

function contextReady(category: TravelCategory, result: IntelligentTripPlanResult) {
  if (category === 'flights') return Boolean(result.plan.originIata && result.plan.destinationIata);
  return Boolean(result.plan.destination);
}

function buildComparisons(result: IntelligentTripPlanResult): CategoryComparison[] {
  return CATEGORIES
    .filter((category) => result.plan.needs.includes(category))
    .map((category) => {
      const offers = result.offers[category].map((offer: RankedTravelOffer): ComparisonOffer => ({
        partnerId: offer.partnerId,
        provider: offer.provider,
        rank: offer.rank,
        fitScore: offer.fitScore,
        configured: Boolean(offer.trackedUrl),
        contextReady: contextReady(category, result),
        datesIncluded: Boolean(result.plan.checkin && result.plan.checkout),
        budgetTarget: offer.budgetTarget,
        strengths: offer.fitReasons.slice(0, 3)
      }));
      const recommended = offers.find((offer) => offer.configured) || offers[0];
      return { category, recommendedPartnerId: recommended?.partnerId, offers };
    });
}

export function addDecisionSupport(result: IntelligentTripPlanResult): DecisionTripPlanResult {
  return {
    ...result,
    decisionSupport: {
      itinerary: buildItinerary(result),
      budgetOptimizer: buildBudgetOptimizer(result),
      comparisons: buildComparisons(result)
    }
  };
}
