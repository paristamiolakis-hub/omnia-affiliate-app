import test from 'node:test';
import assert from 'node:assert/strict';
import { destinationsMentioned, resolveDestination } from '../lib/destinations';
import { allocateBudget, type TripIntent } from '../lib/travel';
import { buildSafeFallbackIntent } from '../lib/safe-travel-fallback';
import {
  PARTNER_CAPABILITIES,
  assertLiveQuote,
  getPartnerCapability,
  partnerConfigStatus
} from '../lib/partner-capabilities';

function plan(overrides: Partial<TripIntent> = {}): TripIntent {
  return {
    rawQuery: 'Rome from Athens for 2 people, budget 1200 EUR',
    origin: 'Athens',
    originIata: 'ATH',
    destination: 'Rome',
    destinationIata: 'FCO',
    checkin: '2026-10-12',
    checkout: '2026-10-16',
    travelers: 2,
    budget: 1200,
    currency: 'EUR',
    style: 'balanced',
    interests: ['culture', 'food'],
    needs: ['flights', 'hotels', 'tours'],
    ...overrides
  };
}

test('destination resolver handles Greek aliases and IATA codes', () => {
  assert.equal(resolveDestination('Θέλω Ρώμη')?.flightCode, 'FCO');
  assert.equal(resolveDestination('ATH')?.city, 'Athens');
});

test('destination mention matching does not treat partial words as places', () => {
  const mentioned = destinationsMentioned('I want a relaxing weekend in Rome');
  assert.deepEqual(mentioned.map((item) => item.city), ['Rome']);
});

test('safe fallback removes false Los Angeles origin from the word relaxing', () => {
  const result = buildSafeFallbackIntent('I want a relaxing weekend in Rome for 2 people', 'GR');
  assert.equal(result.destination, 'Rome');
  assert.equal(result.destinationIata, 'FCO');
  assert.equal(result.origin, undefined);
  assert.equal(result.originIata, undefined);
});

test('safe fallback respects explicit from-direction regardless of mention order', () => {
  const result = buildSafeFallbackIntent('Rome for 2 people, budget 1200 EUR, from Athens', 'GR');
  assert.equal(result.origin, 'Athens');
  assert.equal(result.originIata, 'ATH');
  assert.equal(result.destination, 'Rome');
  assert.equal(result.destinationIata, 'FCO');
});

test('budget allocation always preserves the exact requested total', () => {
  for (const style of ['budget', 'balanced', 'comfort', 'premium'] as const) {
    const allocation = allocateBudget(plan({ style }));
    assert.ok(allocation);
    const sum = allocation.flights + allocation.hotels + allocation.tours + allocation.cars + allocation.buffer;
    assert.equal(sum, allocation.total);
    assert.equal(allocation.total, 1200);
  }
});

test('disabled travel categories receive zero allocation', () => {
  const allocation = allocateBudget(plan({ needs: ['hotels'], budget: 999 }));
  assert.ok(allocation);
  assert.equal(allocation.flights, 0);
  assert.equal(allocation.tours, 0);
  assert.equal(allocation.cars, 0);
  assert.equal(allocation.hotels + allocation.buffer, 999);
});

test('current partner registry never claims live pricing or availability', () => {
  assert.ok(PARTNER_CAPABILITIES.length >= 8);
  for (const capability of PARTNER_CAPABILITIES) {
    assert.equal(capability.dataMode, 'deeplink');
    assert.equal(capability.livePrice, false);
    assert.equal(capability.liveAvailability, false);
  }
  assert.equal(getPartnerCapability('skyscanner')?.searchRedirect, true);
});

test('partner configuration status exposes missing key names but no secret values', () => {
  const empty = partnerConfigStatus('booking', {} as NodeJS.ProcessEnv);
  assert.equal(empty.configured, false);
  assert.deepEqual(empty.missing, ['NEXT_PUBLIC_BOOKING_AID']);

  const configured = partnerConfigStatus('booking', { NEXT_PUBLIC_BOOKING_AID: 'secret-value' } as NodeJS.ProcessEnv);
  assert.equal(configured.configured, true);
  assert.deepEqual(configured.missing, []);
  assert.equal(JSON.stringify(configured).includes('secret-value'), false);
});

test('live quote contract rejects unsafe or fabricated-looking payload shapes', () => {
  const valid = {
    partnerId: 'future-partner',
    externalId: 'offer-1',
    title: 'Verified offer',
    currency: 'EUR',
    totalPrice: 200,
    deeplink: 'https://example.com/offer/1',
    available: true,
    fetchedAt: '2026-09-04T08:00:00.000Z'
  };
  assert.equal(assertLiveQuote(valid), valid);
  assert.throws(() => assertLiveQuote({ ...valid, totalPrice: -1 }));
  assert.throws(() => assertLiveQuote({ ...valid, deeplink: 'http://example.com/offer/1' }));
  assert.throws(() => assertLiveQuote({ ...valid, currency: 'EURO' }));
  assert.throws(() => assertLiveQuote({ ...valid, fetchedAt: 'not-a-date' }));
});
