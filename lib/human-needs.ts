import type { DecisionTripPlanResult } from './decision-engine';
import type { BudgetAllocation, TravelCategory } from './travel';

export type HumanPriority = 'balanced' | 'save' | 'comfort' | 'easy' | 'family' | 'experiences';

export interface PriorityDefinition {
  id: HumanPriority;
  label: string;
  shortLabel: string;
  description: string;
}

export interface PackageSelection {
  category: TravelCategory;
  partnerId?: string;
  provider?: string;
  fitScore?: number;
  configured: boolean;
  targetBudget?: number;
  reason: string;
}

export interface RecommendedTripPackage {
  priority: HumanPriority;
  title: string;
  summary: string;
  selections: PackageSelection[];
  targetBudget?: BudgetAllocation;
  reasons: string[];
  bookingChecks: string[];
  disclaimer: string;
}

export interface HumanChecklistItem {
  id: string;
  label: string;
  detail: string;
  importance: 'essential' | 'recommended';
}

export interface HumanNeedsSupport {
  priority: HumanPriority;
  priorityLabel: string;
  package: RecommendedTripPackage;
  checklist: HumanChecklistItem[];
}

export interface HumanTripPlanResult extends DecisionTripPlanResult {
  humanNeeds: HumanNeedsSupport;
}

export const HUMAN_PRIORITIES: PriorityDefinition[] = [
  { id: 'balanced', label: 'Best overall balance', shortLabel: 'Balanced', description: 'Keep cost, comfort and activities in reasonable balance.' },
  { id: 'save', label: 'Protect my budget', shortLabel: 'Save budget', description: 'Keep more buffer and avoid optional costs where possible.' },
  { id: 'comfort', label: 'More comfort', shortLabel: 'Comfort', description: 'Give more weight to accommodation quality and a less compressed plan.' },
  { id: 'easy', label: 'Less hassle', shortLabel: 'Less hassle', description: 'Prefer simpler logistics, fewer moving parts and more time buffers.' },
  { id: 'family', label: 'Family-friendly', shortLabel: 'Family', description: 'Favor predictable pacing, recovery time and family-oriented activities.' },
  { id: 'experiences', label: 'More experiences', shortLabel: 'Experiences', description: 'Protect more of the trip budget and time for things to do.' }
];

const CATEGORIES: TravelCategory[] = ['flights', 'hotels', 'tours', 'cars'];

function rounded(value: number) {
  return Math.max(0, Math.round(value));
}

function normalizePriority(value: unknown): HumanPriority {
  return HUMAN_PRIORITIES.some((item) => item.id === value) ? (value as HumanPriority) : 'balanced';
}

function rebalanceBudget(result: DecisionTripPlanResult, priority: HumanPriority): BudgetAllocation | undefined {
  const base = result.decisionSupport.budgetOptimizer?.recommended || result.budget || undefined;
  if (!base) return undefined;

  const enabled = new Set(result.plan.needs);
  const weights: Record<TravelCategory | 'buffer', number> = {
    flights: enabled.has('flights') ? base.flights : 0,
    hotels: enabled.has('hotels') ? base.hotels : 0,
    tours: enabled.has('tours') ? base.tours : 0,
    cars: enabled.has('cars') ? base.cars : 0,
    buffer: base.buffer
  };
  const total = base.total;
  const shift = Math.max(1, Math.round(total * 0.05));

  if (priority === 'save') {
    if (enabled.has('hotels')) weights.hotels = Math.max(0, weights.hotels - shift);
    if (enabled.has('tours')) weights.tours = Math.max(0, weights.tours - Math.round(shift * 0.5));
    if (enabled.has('cars') && !result.intelligence.destination?.carUseful) weights.cars = Math.max(0, weights.cars - Math.round(shift * 0.5));
    weights.buffer += shift + Math.round(shift * 0.5);
  } else if (priority === 'comfort') {
    if (enabled.has('hotels')) weights.hotels += shift;
    weights.buffer = Math.max(0, weights.buffer - Math.round(shift * 0.5));
    if (enabled.has('tours')) weights.tours = Math.max(0, weights.tours - Math.round(shift * 0.5));
  } else if (priority === 'easy') {
    weights.buffer += shift;
    if (enabled.has('cars') && !result.intelligence.destination?.carUseful) weights.cars = Math.max(0, weights.cars - Math.round(shift * 0.5));
    if (enabled.has('tours')) weights.tours = Math.max(0, weights.tours - Math.round(shift * 0.5));
  } else if (priority === 'family') {
    if (enabled.has('hotels')) weights.hotels += Math.round(shift * 0.6);
    weights.buffer += Math.round(shift * 0.4);
    if (enabled.has('tours')) weights.tours = Math.max(0, weights.tours - Math.round(shift * 0.4));
  } else if (priority === 'experiences') {
    if (enabled.has('tours')) weights.tours += shift;
    if (enabled.has('hotels')) weights.hotels = Math.max(0, weights.hotels - Math.round(shift * 0.5));
    weights.buffer = Math.max(0, weights.buffer - Math.round(shift * 0.5));
  }

  const activeKeys: Array<TravelCategory | 'buffer'> = [...CATEGORIES.filter((category) => enabled.has(category)), 'buffer'];
  const sum = activeKeys.reduce((acc, key) => acc + weights[key], 0) || 1;
  const allocation = {
    currency: base.currency,
    total,
    flights: enabled.has('flights') ? rounded(total * weights.flights / sum) : 0,
    hotels: enabled.has('hotels') ? rounded(total * weights.hotels / sum) : 0,
    tours: enabled.has('tours') ? rounded(total * weights.tours / sum) : 0,
    cars: enabled.has('cars') ? rounded(total * weights.cars / sum) : 0,
    buffer: rounded(total * weights.buffer / sum)
  } satisfies BudgetAllocation;

  const allocated = allocation.flights + allocation.hotels + allocation.tours + allocation.cars + allocation.buffer;
  allocation.buffer += total - allocated;
  return allocation;
}

function selectionReason(category: TravelCategory, priority: HumanPriority, configured: boolean) {
  if (!configured) return 'No configured partner is available for this category yet.';
  if (priority === 'save') return category === 'tours' ? 'Kept as an optional experience search while protecting budget buffer.' : 'Highest available Omnia fit within the current partner set.';
  if (priority === 'comfort') return category === 'hotels' ? 'Accommodation is emphasized for the comfort-first plan.' : 'Highest available fit while preserving a comfort-oriented plan.';
  if (priority === 'easy') return 'Chosen as the clearest configured search path with the strongest current fit.';
  if (priority === 'family') return category === 'hotels' ? 'Accommodation is treated as a higher-priority family anchor.' : 'Highest current fit for a predictable family trip structure.';
  if (priority === 'experiences') return category === 'tours' ? 'Activities are emphasized for an experience-first trip.' : 'Highest available fit while protecting activity time and budget.';
  return 'Highest configured Omnia fit for this part of the trip.';
}

function buildSelections(result: DecisionTripPlanResult, priority: HumanPriority, targetBudget?: BudgetAllocation) {
  return CATEGORIES
    .filter((category) => result.plan.needs.includes(category))
    .map((category): PackageSelection => {
      const offers = result.offers[category];
      const selected = offers.find((offer) => Boolean(offer.trackedUrl)) || offers[0];
      const configured = Boolean(selected?.trackedUrl);
      return {
        category,
        partnerId: selected?.partnerId,
        provider: selected?.provider,
        fitScore: selected?.fitScore,
        configured,
        targetBudget: targetBudget?.[category] || result.budget?.[category],
        reason: selectionReason(category, priority, configured)
      };
    });
}

function packageCopy(priority: HumanPriority, destination: string) {
  const city = destination || 'your destination';
  const copy: Record<HumanPriority, { title: string; summary: string }> = {
    balanced: { title: `Recommended plan for ${city}`, summary: 'A balanced package that keeps logistics, comfort, activities and budget buffer visible in one place.' },
    save: { title: `Budget-protected plan for ${city}`, summary: 'A planning package that keeps more money uncommitted and treats optional costs cautiously.' },
    comfort: { title: `Comfort-first plan for ${city}`, summary: 'A planning package that protects accommodation comfort and avoids overloading the schedule.' },
    easy: { title: `Lower-friction plan for ${city}`, summary: 'A planning package built around fewer moving parts, clearer next steps and more recovery time.' },
    family: { title: `Family-friendly plan for ${city}`, summary: 'A planning package with slower pacing, stronger accommodation priority and more schedule buffer.' },
    experiences: { title: `Experience-first plan for ${city}`, summary: 'A planning package that protects more time and budget for activities and destination experiences.' }
  };
  return copy[priority];
}

function buildReasons(result: DecisionTripPlanResult, priority: HumanPriority) {
  const reasons: string[] = [];
  const destination = result.plan.destination || 'the destination';
  if (priority === 'save') reasons.push('Keeps a larger contingency buffer instead of assuming every euro must be spent.');
  if (priority === 'comfort') reasons.push('Gives accommodation more weight and keeps the itinerary less compressed.');
  if (priority === 'easy') reasons.push('Prioritizes simple logistics and time buffers over packing in more optional items.');
  if (priority === 'family') reasons.push('Protects recovery time and treats accommodation as an important family anchor.');
  if (priority === 'experiences') reasons.push('Protects more of the planning budget for activities and destination experiences.');
  if (priority === 'balanced') reasons.push('Balances accommodation, transport, activities and contingency instead of maximizing one dimension.');

  if (result.intelligence.destination?.carUseful) reasons.push(`${destination} can benefit from car flexibility in Omnia's destination profile.`);
  else if (result.plan.needs.includes('cars')) reasons.push(`A car is optional for a typical ${destination} stay, so compare its convenience against the extra cost and complexity.`);
  if (result.intelligence.nights) reasons.push(`The plan is structured around ${result.intelligence.nights} nights rather than a generic city-break template.`);
  return reasons.slice(0, 4);
}

function buildBookingChecks(result: DecisionTripPlanResult, priority: HumanPriority) {
  const checks: string[] = [];
  if (result.plan.needs.includes('flights')) checks.push('Compare total flight cost after baggage, seat and payment fees — not only the headline fare.');
  if (result.plan.needs.includes('hotels')) checks.push('Check the exact location, cancellation terms, taxes/fees and room setup before paying.');
  if (priority === 'easy') checks.push('Prefer simpler transport and arrival times that leave margin for delays and check-in.');
  if (priority === 'family') checks.push('Confirm room occupancy, child policies, adjacent seating needs and realistic rest breaks before booking.');
  if (priority === 'comfort') checks.push('Compare room type, transfer burden and schedule intensity — not only star rating.');
  if (priority === 'save') checks.push('Keep part of the budget uncommitted until mandatory fees and local transport are clear.');
  if (priority === 'experiences') checks.push('Reserve time before buying multiple timed activities so the itinerary does not become rigid.');
  return checks.slice(0, 4);
}

function buildChecklist(result: DecisionTripPlanResult, priority: HumanPriority): HumanChecklistItem[] {
  const items: HumanChecklistItem[] = [
    { id: 'documents', label: 'Entry documents', detail: 'Check passport/ID validity, visa or entry requirements using official government sources for the actual travellers and dates.', importance: 'essential' },
    { id: 'fees', label: 'True booking total', detail: 'Review baggage, taxes, resort/city fees, deposits, cancellation terms and payment charges before confirming.', importance: 'essential' },
    { id: 'arrival', label: 'Arrival plan', detail: 'Know how you will get from the airport/station to the accommodation, especially for late arrivals.', importance: 'recommended' },
    { id: 'offline', label: 'Offline essentials', detail: 'Keep booking references, accommodation address and key transport details available offline.', importance: 'recommended' }
  ];

  if (priority === 'family' || result.plan.interests.includes('family')) {
    items.push({ id: 'family', label: 'Family logistics', detail: 'Check room occupancy, seating, transfer duration, meal timing and rest windows for the actual ages travelling.', importance: 'essential' });
  }
  if (priority === 'easy') {
    items.push({ id: 'buffer', label: 'Time buffer', detail: 'Avoid stacking time-sensitive bookings directly after arrival or before departure.', importance: 'recommended' });
  }
  items.push({ id: 'special-needs', label: 'Personal requirements', detail: 'Add mobility, dietary, accessibility or other important requirements to the trip request so they can shape the plan; verify them directly with providers.', importance: 'essential' });
  return items;
}

export function addHumanNeeds(result: DecisionTripPlanResult, priorityInput?: unknown): HumanTripPlanResult {
  const priority = normalizePriority(priorityInput);
  const definition = HUMAN_PRIORITIES.find((item) => item.id === priority)!;
  const targetBudget = rebalanceBudget(result, priority);
  const copy = packageCopy(priority, result.plan.destination);

  return {
    ...result,
    humanNeeds: {
      priority,
      priorityLabel: definition.label,
      package: {
        priority,
        title: copy.title,
        summary: copy.summary,
        selections: buildSelections(result, priority, targetBudget),
        targetBudget,
        reasons: buildReasons(result, priority),
        bookingChecks: buildBookingChecks(result, priority),
        disclaimer: 'Recommended package means Omnia’s current planning recommendation. It is not a booking, a live-price bundle, or a guarantee of availability.'
      },
      checklist: buildChecklist(result, priority)
    }
  };
}
