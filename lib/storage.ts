import type { TripPlanResult } from './travel';

export type LocalEventName = 'trip_search' | 'trip_saved' | 'trip_deleted' | 'affiliate_click';

export interface SavedTrip {
  id: string;
  query: string;
  country: string;
  title: string;
  result: TripPlanResult;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsEvent {
  id: string;
  name: LocalEventName;
  createdAt: string;
  sessionId: string;
  tripId?: string;
  partner?: string;
  source?: string;
  destination?: string;
  country?: string;
}

export interface AnalyticsOverview {
  searches: number;
  savedTrips: number;
  clicks: number;
  partnerClicks: Array<{ partner: string; clicks: number }>;
  recentEvents: AnalyticsEvent[];
}

export interface SaveTripInput {
  query: string;
  country: string;
  result: TripPlanResult;
}

export interface EventInput extends Omit<AnalyticsEvent, 'id' | 'createdAt' | 'sessionId'> {}

export interface OmniaStorageAdapter {
  saveTrip(input: SaveTripInput): Promise<SavedTrip>;
  getTrip(id: string): Promise<SavedTrip | null>;
  listTrips(): Promise<SavedTrip[]>;
  deleteTrip(id: string): Promise<void>;
  recordEvent(input: EventInput): Promise<AnalyticsEvent>;
  overview(): Promise<AnalyticsOverview>;
  exportData(): Promise<{ version: number; exportedAt: string; trips: SavedTrip[]; events: AnalyticsEvent[] }>;
}

const TRIPS_KEY = 'omnia.saved-trips.v1';
const EVENTS_KEY = 'omnia.analytics-events.v1';
const SESSION_KEY = 'omnia.session.v1';
const MAX_TRIPS = 100;
const MAX_EVENTS = 1500;

function hasBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function uid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function readArray<T>(key: string): T[] {
  if (!hasBrowserStorage()) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, value: T[]) {
  if (!hasBrowserStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function sessionId() {
  if (!hasBrowserStorage()) return 'serverless-preview';
  let value = window.localStorage.getItem(SESSION_KEY);
  if (!value) {
    value = uid();
    window.localStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

function tripTitle(input: SaveTripInput) {
  const destination = input.result.plan.destination || 'Trip';
  const origin = input.result.plan.origin;
  return origin ? `${origin} → ${destination}` : destination;
}

export const localStorageAdapter: OmniaStorageAdapter = {
  async saveTrip(input) {
    const now = new Date().toISOString();
    const trip: SavedTrip = {
      id: uid(),
      query: input.query.slice(0, 1800),
      country: input.country.slice(0, 8),
      title: tripTitle(input),
      result: input.result,
      createdAt: now,
      updatedAt: now
    };
    const trips = readArray<SavedTrip>(TRIPS_KEY);
    writeArray(TRIPS_KEY, [trip, ...trips].slice(0, MAX_TRIPS));
    await this.recordEvent({
      name: 'trip_saved',
      tripId: trip.id,
      destination: trip.result.plan.destination || undefined,
      country: trip.country,
      source: 'travel-planner'
    });
    return trip;
  },

  async getTrip(id) {
    return readArray<SavedTrip>(TRIPS_KEY).find((trip) => trip.id === id) || null;
  },

  async listTrips() {
    return readArray<SavedTrip>(TRIPS_KEY).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async deleteTrip(id) {
    const trips = readArray<SavedTrip>(TRIPS_KEY);
    const existing = trips.find((trip) => trip.id === id);
    writeArray(TRIPS_KEY, trips.filter((trip) => trip.id !== id));
    await this.recordEvent({
      name: 'trip_deleted',
      tripId: id,
      destination: existing?.result.plan.destination || undefined,
      country: existing?.country,
      source: 'my-trips'
    });
  },

  async recordEvent(input) {
    const event: AnalyticsEvent = {
      ...input,
      id: uid(),
      createdAt: new Date().toISOString(),
      sessionId: sessionId()
    };
    const events = readArray<AnalyticsEvent>(EVENTS_KEY);
    writeArray(EVENTS_KEY, [event, ...events].slice(0, MAX_EVENTS));
    return event;
  },

  async overview() {
    const events = readArray<AnalyticsEvent>(EVENTS_KEY);
    const partnerMap = new Map<string, number>();
    for (const event of events) {
      if (event.name === 'affiliate_click' && event.partner) {
        partnerMap.set(event.partner, (partnerMap.get(event.partner) || 0) + 1);
      }
    }
    return {
      searches: events.filter((event) => event.name === 'trip_search').length,
      savedTrips: readArray<SavedTrip>(TRIPS_KEY).length,
      clicks: events.filter((event) => event.name === 'affiliate_click').length,
      partnerClicks: [...partnerMap.entries()]
        .map(([partner, clicks]) => ({ partner, clicks }))
        .sort((a, b) => b.clicks - a.clicks),
      recentEvents: events.slice(0, 30)
    };
  },

  async exportData() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      trips: readArray<SavedTrip>(TRIPS_KEY),
      events: readArray<AnalyticsEvent>(EVENTS_KEY)
    };
  }
};

export const omniaStorage: OmniaStorageAdapter = localStorageAdapter;
