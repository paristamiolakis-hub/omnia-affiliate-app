'use client';

import { useEffect, useState } from 'react';
import { omniaStorage, type SavedTrip } from '@/lib/storage';

function money(value: number | undefined, currency: string) {
  if (value == null) return 'No budget';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

export default function MyTripsPage() {
  const [trips, setTrips] = useState<SavedTrip[]>([]);

  async function refresh() {
    setTrips(await omniaStorage.listTrips());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function remove(id: string) {
    await omniaStorage.deleteTrip(id);
    await refresh();
  }

  return (
    <main>
      <section className="travel-hero">
        <span className="eyebrow">MY TRIPS</span>
        <h2>Saved travel plans</h2>
        <p>Saved locally on this device. No account or external server is required.</p>
      </section>

      {trips.length === 0 ? (
        <div className="card">
          <h3>No saved trips yet</h3>
          <p>Build a trip from the Omnia Travel Agent and choose Save trip.</p>
        </div>
      ) : (
        <div className="grid">
          {trips.map((trip) => (
            <article className="card" key={trip.id}>
              <span className="badge">{trip.result.generatedBy === 'ai' ? 'AI structured' : 'Smart fallback'}</span>
              <h3>{trip.title}</h3>
              <p>
                {trip.result.plan.checkin || 'Dates not set'}
                {trip.result.plan.checkout ? ` → ${trip.result.plan.checkout}` : ''}
              </p>
              <div className="trip-facts compact-trip-facts">
                <div><span>Travellers</span><strong>{trip.result.plan.travelers}</strong></div>
                <div><span>Budget</span><strong>{money(trip.result.plan.budget, trip.result.plan.currency)}</strong></div>
              </div>
              <div className="helper">Saved {new Date(trip.createdAt).toLocaleString()}</div>
              <div className="row">
                <a className="button" href={`/?trip=${encodeURIComponent(trip.id)}`}>Open</a>
                <button className="button secondary-button" type="button" onClick={() => remove(trip.id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
