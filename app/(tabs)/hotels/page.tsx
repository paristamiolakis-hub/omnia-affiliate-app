'use client';
import OmniaAssistant from '@/components/OmniaAssistant';
import AffiliateCard from '@/components/AffiliateCard';
import { byCategory, forCountry } from '@/lib/affiliates';
import { useCountry } from '@/components/CountryContext';
import { useState } from 'react';

function toLocalISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function initialDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return { today: toLocalISO(today), tomorrow: toLocalISO(tomorrow) };
}

export default function Page() {
  const { country } = useCountry();
  const initial = initialDates();
  const [query, setQuery] = useState('Heraklion');
  const [checkin, setCheckin] = useState(initial.today);
  const [checkout, setCheckout] = useState(initial.tomorrow);
  const items = forCountry(byCategory('hotels'), country);

  function normalizeDates(nextCheckin: string) {
    if (checkout <= nextCheckin) {
      const next = new Date(`${nextCheckin}T12:00:00`);
      next.setDate(next.getDate() + 1);
      setCheckout(toLocalISO(next));
    }
  }

  return (
    <main>
      <div className="helper">Country filter: <b>{country}</b> • Results update as you edit the search.</div>
      <div className="search-grid" style={{ marginBottom: 16 }}>
        <label className="field-label">
          Destination
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search city or destination…" maxLength={200} />
        </label>
        <label className="field-label">
          Check-in
          <input type="date" value={checkin} onChange={e => { setCheckin(e.target.value); normalizeDates(e.target.value); }} />
        </label>
        <label className="field-label">
          Check-out
          <input type="date" min={checkin} value={checkout} onChange={e => setCheckout(e.target.value)} />
        </label>
      </div>

      <div className="grid">
        {items.map(a => (
          <AffiliateCard
            key={a.id}
            partnerId={a.id}
            title={a.name}
            description={a.description}
            href={a.buildUrl({ q: query || undefined, country, checkin, checkout })}
            badge="Affiliate"
          />
        ))}
      </div>
      <OmniaAssistant />
    </main>
  );
}
