'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useCountry } from '@/components/CountryContext';
import { omniaStorage } from '@/lib/storage';
import type { TripPlanResult, TravelCategory } from '@/lib/travel';

const EXAMPLES = [
  'Rome 12-16 October for 2 people, budget €1200, from Athens',
  '4 days in Paris for a couple, up to €1500, culture and food',
  'Cheap weekend in Barcelona from Heraklion with hotel and activities'
];

const LABELS: Record<TravelCategory, string> = {
  flights: 'Flights',
  hotels: 'Hotels',
  tours: 'Things to do',
  cars: 'Car rental'
};

function money(value: number | undefined, currency: string) {
  if (value == null) return 'Not set';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

function statusLabel(value: boolean, yes: string, no: string) {
  return value ? `✓ ${yes}` : `○ ${no}`;
}

export default function TravelPlanner() {
  const { country } = useCountry();
  const [query, setQuery] = useState(EXAMPLES[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<TripPlanResult | null>(null);
  const [activeTripId, setActiveTripId] = useState<string | undefined>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tripId = params.get('trip');
    if (!tripId) return;

    omniaStorage.getTrip(tripId).then((trip) => {
      if (!trip) return;
      setQuery(trip.query);
      setResult(trip.result);
      setActiveTripId(trip.id);
      setSavedMessage('Loaded from My Trips');
    });
  }, []);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError('');
    setSavedMessage('');
    setActiveTripId(undefined);
    try {
      const response = await fetch('/api/travel/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, country })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || 'Could not build this trip.');
      const nextResult = data as TripPlanResult;
      setResult(nextResult);
      await omniaStorage.recordEvent({
        name: 'trip_search',
        destination: nextResult.plan.destination || undefined,
        country,
        source: 'travel-planner'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not build this trip.');
    } finally {
      setLoading(false);
    }
  }

  async function saveTrip() {
    if (!result || saving) return;
    setSaving(true);
    setSavedMessage('');
    try {
      const trip = await omniaStorage.saveTrip({ query, country, result });
      setActiveTripId(trip.id);
      setSavedMessage('Saved on this device');
    } finally {
      setSaving(false);
    }
  }

  async function recordPartnerClick(partner: string) {
    await omniaStorage.recordEvent({
      name: 'affiliate_click',
      tripId: activeTripId,
      partner,
      source: 'travel-planner',
      destination: result?.plan.destination || undefined,
      country
    });
  }

  const categories = useMemo(() => {
    if (!result) return [] as TravelCategory[];
    return (['flights', 'hotels', 'tours', 'cars'] as TravelCategory[])
      .filter((category) => result.plan.needs.includes(category));
  }, [result]);

  return (
    <section className="travel-agent" aria-labelledby="travel-agent-title">
      <div className="travel-hero">
        <span className="eyebrow">OMNIA TRAVEL AGENT</span>
        <h2 id="travel-agent-title">Tell Omnia the trip. Get one complete plan.</h2>
        <p>
          Describe where you want to go, when, who is travelling and your budget. Omnia turns it into a structured plan and prepares the right partner searches.
        </p>

        <form onSubmit={submit} className="travel-prompt-form">
          <label className="sr-only" htmlFor="travel-prompt">Describe your trip</label>
          <textarea
            id="travel-prompt"
            value={query}
            onChange={(event) => setQuery(event.target.value.slice(0, 1800))}
            placeholder="e.g. Rome 12–16 October, 2 people, from Athens, budget €1,200"
            rows={4}
          />
          <div className="travel-prompt-actions">
            <span className="helper" style={{ margin: 0 }}>Country context: <b>{country}</b></span>
            <button className="button travel-plan-button" type="submit" disabled={loading || !query.trim()}>
              {loading ? 'Building trip…' : 'Plan my trip'}
            </button>
          </div>
        </form>

        <div className="travel-examples" aria-label="Trip examples">
          {EXAMPLES.map((example) => (
            <button key={example} type="button" className="example-chip" onClick={() => setQuery(example)}>
              {example}
            </button>
          ))}
        </div>
        {error && <p className="error-text" role="alert">{error}</p>}
      </div>

      {result && (
        <div className="travel-results" aria-live="polite">
          <div className="trip-summary card">
            <div className="trip-summary-top">
              <div>
                <span className="eyebrow">COMPLETE TRIP</span>
                <h3>{result.plan.destination || 'Your trip'}</h3>
                <p>
                  {result.plan.origin ? `${result.plan.origin} → ` : ''}{result.plan.destination || 'Destination needed'}
                  {result.plan.checkin ? ` · ${result.plan.checkin}` : ''}
                  {result.plan.checkout ? ` → ${result.plan.checkout}` : ''}
                </p>
              </div>
              <div className="trip-actions">
                <span className="badge">{result.generatedBy === 'ai' ? 'AI structured' : 'Smart fallback'}</span>
                <button className="button secondary-button" type="button" onClick={saveTrip} disabled={saving}>
                  {saving ? 'Saving…' : 'Save trip'}
                </button>
              </div>
            </div>
            {savedMessage && <p className="save-message">{savedMessage}</p>}

            <div className="trip-facts">
              <div><span>Travellers</span><strong>{result.plan.travelers}</strong></div>
              <div><span>Style</span><strong>{result.plan.style}</strong></div>
              <div><span>Total budget</span><strong>{money(result.plan.budget, result.plan.currency)}</strong></div>
              <div><span>Airport</span><strong>{result.plan.destinationIata || '—'}</strong></div>
            </div>

            <div className="trip-completeness">
              <span>{statusLabel(result.completeness.destination, 'destination', 'destination')}</span>
              <span>{statusLabel(result.completeness.dates, 'dates', 'dates')}</span>
              <span>{statusLabel(result.completeness.origin, 'origin', 'origin')}</span>
              <span>{statusLabel(result.completeness.budget, 'budget', 'budget')}</span>
            </div>

            {result.plan.interests.length > 0 && (
              <div className="interest-row">
                {result.plan.interests.map((interest) => <span className="badge" key={interest}>{interest}</span>)}
              </div>
            )}
          </div>

          {result.budget && (
            <div className="budget-panel card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">BUDGET MAP</span>
                  <h3>Suggested allocation</h3>
                </div>
                <strong>{money(result.budget.total, result.budget.currency)}</strong>
              </div>
              <div className="budget-grid">
                {result.plan.needs.includes('flights') && <div><span>Flights</span><strong>{money(result.budget.flights, result.budget.currency)}</strong></div>}
                {result.plan.needs.includes('hotels') && <div><span>Hotels</span><strong>{money(result.budget.hotels, result.budget.currency)}</strong></div>}
                {result.plan.needs.includes('tours') && <div><span>Activities</span><strong>{money(result.budget.tours, result.budget.currency)}</strong></div>}
                {result.plan.needs.includes('cars') && <div><span>Car</span><strong>{money(result.budget.cars, result.budget.currency)}</strong></div>}
                <div><span>Buffer</span><strong>{money(result.budget.buffer, result.budget.currency)}</strong></div>
              </div>
              <p className="helper">These are planning targets, not live partner prices.</p>
            </div>
          )}

          <div className="offer-sections">
            {categories.map((category) => (
              <section className="offer-section" key={category}>
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">STEP {categories.indexOf(category) + 1}</span>
                    <h3>{LABELS[category]}</h3>
                  </div>
                  {result.budget && <span className="budget-target">Target {money(result.budget[category], result.budget.currency)}</span>}
                </div>

                <div className="grid">
                  {result.offers[category].length === 0 && (
                    <div className="card"><p>No configured affiliate partner is available for this category yet.</p></div>
                  )}
                  {result.offers[category].map((offer) => (
                    <article className="card travel-offer" key={offer.id}>
                      <div className="row">
                        <span className="badge">{offer.badge}</span>
                        <span className="offer-rank">#{offer.rank}</span>
                      </div>
                      <h3>{offer.title}</h3>
                      <p>{offer.description}</p>
                      <div className="offer-footer">
                        <span className="live-price-note">Price checked on partner</span>
                        {offer.trackedUrl ? (
                          <a
                            className="button"
                            href={offer.trackedUrl}
                            target="_blank"
                            rel="nofollow sponsored noopener"
                            onClick={() => recordPartnerClick(offer.partnerId)}
                          >
                            Search {offer.provider}
                          </a>
                        ) : (
                          <span className="button button-disabled">Configure partner</span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {result.warnings.length > 0 && (
            <div className="planner-notes card">
              <h3>Improve this plan</h3>
              <ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
