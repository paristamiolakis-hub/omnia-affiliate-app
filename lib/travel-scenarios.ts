import type { HumanPriority, HumanTripPlanResult } from './human-needs';

export interface TravelScenario {
  id: 'save-budget' | 'add-comfort' | 'shorter-trip' | 'less-hassle';
  title: string;
  label: string;
  description: string;
  prompt: string;
  priority: HumanPriority;
  changes: string[];
  disclaimer: string;
}

function subtractOneDay(isoDate?: string) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return undefined;
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return undefined;
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function structuredPrompt(result: HumanTripPlanResult, options: {
  budget?: number;
  checkout?: string;
  extra?: string;
} = {}) {
  const plan = result.plan;
  const parts: string[] = [];

  if (plan.destination) parts.push(`Trip to ${plan.destination}`);
  if (plan.checkin) parts.push(`from ${plan.checkin}`);
  if (options.checkout || plan.checkout) parts.push(`to ${options.checkout || plan.checkout}`);
  parts.push(`for ${Math.max(1, plan.travelers)} traveller${plan.travelers === 1 ? '' : 's'}`);
  if (plan.origin) parts.push(`departing from ${plan.origin}`);
  const budget = options.budget ?? plan.budget;
  if (budget != null) parts.push(`with a total budget of ${Math.round(budget)} ${plan.currency}`);
  if (plan.interests.length) parts.push(`interested in ${plan.interests.join(', ')}`);
  if (plan.needs.length) parts.push(`include ${plan.needs.join(', ')}`);
  if (options.extra) parts.push(options.extra);

  return parts.join(', ').slice(0, 1800);
}

export function buildTravelScenarios(result: HumanTripPlanResult): TravelScenario[] {
  const scenarios: TravelScenario[] = [];
  const budget = result.plan.budget;
  const currency = result.plan.currency;
  const nights = result.intelligence.nights;

  if (budget != null && budget > 250) {
    const lower = Math.max(100, budget - 200);
    scenarios.push({
      id: 'save-budget',
      title: `What if I spend ${Math.round(budget - lower)} ${currency} less?`,
      label: 'Save more',
      description: `Rebuild the same trip around a ${Math.round(lower)} ${currency} planning ceiling and protect essentials first.`,
      prompt: structuredPrompt(result, {
        budget: lower,
        extra: 'Protect essentials first, keep a contingency buffer and make optional activities easier to drop.'
      }),
      priority: 'save',
      changes: [
        `Planning budget becomes ${Math.round(lower)} ${currency}.`,
        'Optional spending gets less weight.',
        'Live prices may make some parts of the original trip infeasible.'
      ],
      disclaimer: 'This is a planning what-if, not a claim that the trip is available at the lower budget.'
    });
  }

  if (budget != null) {
    const higher = budget + 200;
    scenarios.push({
      id: 'add-comfort',
      title: `What if I add 200 ${currency}?`,
      label: 'More comfort',
      description: `Use the extra planning room mainly for accommodation comfort, buffers and fewer compromises.`,
      prompt: structuredPrompt(result, {
        budget: higher,
        extra: 'Use the extra budget mainly for comfort, easier logistics and contingency rather than simply adding more activities.'
      }),
      priority: 'comfort',
      changes: [
        `Planning budget becomes ${Math.round(higher)} ${currency}.`,
        'Accommodation and comfort receive more weight.',
        'The extra amount remains a target until partner prices are checked.'
      ],
      disclaimer: 'No upgrade or availability is assumed. Omnia only changes the planning allocation.'
    });
  }

  if (nights && nights > 1 && result.plan.checkout) {
    const shorterCheckout = subtractOneDay(result.plan.checkout);
    if (shorterCheckout) {
      scenarios.push({
        id: 'shorter-trip',
        title: 'What if I stay one day less?',
        label: '1 day shorter',
        description: 'Rebuild the itinerary with one fewer night while keeping the same priorities visible.',
        prompt: structuredPrompt(result, {
          checkout: shorterCheckout,
          extra: 'The trip is one night shorter. Keep the schedule realistic and avoid cramming every removed activity into the remaining days.'
        }),
        priority: result.humanNeeds.priority,
        changes: [
          `${nights} nights becomes ${nights - 1}.`,
          'The itinerary should remove or deprioritize activities rather than compress them.',
          'Any savings must be verified from live hotel, flight and activity prices.'
        ],
        disclaimer: 'A shorter stay can change availability and transport costs; no savings amount is predicted.'
      });
    }
  }

  scenarios.push({
    id: 'less-hassle',
    title: 'What if I want less hassle?',
    label: 'Simpler trip',
    description: 'Keep the same core trip but prioritize simpler logistics, recovery time and fewer moving parts.',
    prompt: structuredPrompt(result, {
      extra: 'Prioritize simple logistics, realistic arrival and departure buffers, fewer moving parts and recovery time. Avoid unnecessary transfers or car rental when it does not add clear value.'
    }),
    priority: 'easy',
    changes: [
      'Simpler logistics become more important than maximizing activities.',
      'More time buffer is protected.',
      'Optional transport complexity is challenged instead of assumed.'
    ],
    disclaimer: 'This scenario optimizes planning simplicity, not live journey duration or punctuality.'
  });

  return scenarios;
}
