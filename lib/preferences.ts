import type { HumanPriority } from './human-needs';
import type { TripIntent } from './travel';
import { resolveDestination } from './destinations';

export interface OmniaPreferences {
  version: 1;
  onboardingComplete: boolean;
  homeDeparture: string;
  travelers: number;
  travelPriority: HumanPriority;
  updatedAt: string;
}

export type PreferenceInput = Partial<Pick<OmniaPreferences, 'onboardingComplete' | 'homeDeparture' | 'travelers' | 'travelPriority'>>;

export const DEFAULT_PREFERENCES: OmniaPreferences = {
  version: 1,
  onboardingComplete: false,
  homeDeparture: '',
  travelers: 2,
  travelPriority: 'balanced',
  updatedAt: ''
};

const STORAGE_KEY = 'omnia.preferences.v1';
const PRIORITIES = new Set<HumanPriority>(['balanced', 'save', 'comfort', 'easy', 'family', 'experiences']);

export function sanitizePreferences(input: unknown): OmniaPreferences {
  const raw = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const travelers = Number(raw.travelers);
  const travelPriority = PRIORITIES.has(raw.travelPriority as HumanPriority)
    ? raw.travelPriority as HumanPriority
    : DEFAULT_PREFERENCES.travelPriority;

  return {
    version: 1,
    onboardingComplete: raw.onboardingComplete === true,
    homeDeparture: typeof raw.homeDeparture === 'string' ? raw.homeDeparture.trim().slice(0, 80) : '',
    travelers: Number.isInteger(travelers) && travelers >= 1 && travelers <= 20 ? travelers : DEFAULT_PREFERENCES.travelers,
    travelPriority,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt.slice(0, 40) : ''
  };
}

export function loadPreferences(): OmniaPreferences {
  if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizePreferences(JSON.parse(raw)) : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(input: PreferenceInput): OmniaPreferences {
  const current = loadPreferences();
  const next = sanitizePreferences({
    ...current,
    ...input,
    updatedAt: new Date().toISOString()
  });
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function clearPreferences() {
  if (typeof window !== 'undefined' && window.localStorage) window.localStorage.removeItem(STORAGE_KEY);
}

export function applyTravelPreferences(plan: TripIntent, input: unknown): TripIntent {
  const preferences = sanitizePreferences(input);
  let next = { ...plan };

  if (!next.origin && !next.originIata && preferences.homeDeparture) {
    const departure = resolveDestination(preferences.homeDeparture);
    next.origin = departure?.city || preferences.homeDeparture;
    next.originIata = departure?.flightCode;
  }

  const mentionsTravellers = /\b\d{1,2}\s*(?:people|persons|adults|travellers|travelers|guests|άτομα|ατομα|ενήλικες|ενηλικες)\b/i.test(next.rawQuery);
  if (!mentionsTravellers) next.travelers = preferences.travelers;

  return next;
}
