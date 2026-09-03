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
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  return { today: toLocalISO(today), nextWeek: toLocalISO(nextWeek) };
}

export default function Page() {
  const { country } = useCountry();
  const initial = initialDates();
  const [origin, setOrigin] = useState('ATH');
  const [dest, setDest] = useState('LHR');
  const [depart, setDepart] = useState(initial.today);
  const [ret, setRet] = useState(initial.nextWeek);
  const items = forCountry(byCategory('flights'), country);

  function normalizeDates(nextDepart: string) {
    if (ret <= nextDepart) {
      const n = new Date(`${nextDepart}T12:00:00`);
      n.setDate(n.getDate() + 3);
      setRet(toLocalISO(n));
    }
  }

  const q = `${origin}-${dest}`;

  return (
    <main>
      <div className="helper">Country filter: <b>{country}</b> • Enter 3-letter IATA airport codes.</div>
      <div className="search-grid flight-search-grid" style={{ marginBottom: 16 }}>
        <label className="field-label">
          Origin
          <input value={origin} onChange={e => setOrigin(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))} placeholder="ATH" maxLength={3} />
        </label>
        <label className="field-label">
          Destination
          <input value={dest} onChange={e => setDest(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))} placeholder="LHR" maxLength={3} />
        </label>
        <label className="field-label">
          Depart
          <input type="date" value={depart} onChange={e => { setDepart(e.target.value); normalizeDates(e.target.value); }} />
        </label>
        <label className="field-label">
          Return
          <input type="date" min={depart} value={ret} onChange={e => setRet(e.target.value)} />
        </label>
      </div>

      <div className="grid">
        {items.map(a => (
          <AffiliateCard
            key={a.id}
            partnerId={a.id}
            title={a.name}
            description={a.description}
            href={a.buildUrl({ q, country, checkin: depart, checkout: ret })}
            badge="Affiliate"
          />
        ))}
      </div>
      <OmniaAssistant />
    </main>
  );
}
