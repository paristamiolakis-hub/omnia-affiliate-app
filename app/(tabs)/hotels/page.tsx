'use client';
import OmniaAssistant from '@/components/OmniaAssistant';
import AffiliateCard from '@/components/AffiliateCard';
import { byCategory, forCountry } from '@/lib/affiliates';
import { useCountry } from '@/components/CountryContext';
import { useState } from 'react';

// helper: σημερινή + αύριο σε YYYY-MM-DD
function toISO(d: Date) { return d.toISOString().slice(0,10); }
const today = new Date();
const tomorrow = new Date(Date.now() + 24*60*60*1000);

export default function Page() {
  const { country } = useCountry();
  const [query, setQuery] = useState('Heraklion');
  const [checkin, setCheckin] = useState(toISO(today));
  const [checkout, setCheckout] = useState(toISO(tomorrow));

  const items = forCountry(byCategory('hotels'), country);

  function normalizeDates() {
    if (checkout <= checkin) {
      const next = new Date(checkin);
      next.setDate(next.getDate() + 1);
      setCheckout(toISO(next));
    }
  }

  return (
    <main>
      <div className="helper">
        Country filter: <b>{country}</b> • Change with the selector on the top-right.
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 0.8fr 0.8fr auto', gap:8, margin:'6px 0 16px' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search city or destination…"
          style={{ padding:'10px 12px', background:'var(--card)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:10 }}
        />
        <input
          type="date"
          value={checkin}
          onChange={e => { setCheckin(e.target.value); normalizeDates(); }}
          style={{ padding:'10px 12px', background:'var(--card)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:10 }}
        />
        <input
          type="date"
          value={checkout}
          onChange={e => setCheckout(e.target.value)}
          style={{ padding:'10px 12px', background:'var(--card)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:10 }}
        />
        <button onClick={()=>{}} className="button">Apply</button>
      </div>

      <div className="grid">
        {items.map(a => (
          <AffiliateCard
            key={a.id}
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