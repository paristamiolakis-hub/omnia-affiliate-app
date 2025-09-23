'use client';
import OmniaAssistant from '@/components/OmniaAssistant';
import AffiliateCard from '@/components/AffiliateCard';
import { byCategory, forCountry } from '@/lib/affiliates';
import { useCountry } from '@/components/CountryContext';
import { useState } from 'react';

function toISO(d: Date) { return d.toISOString().slice(0,10); }
const today = new Date();
const nextWeek = new Date(Date.now() + 7*24*60*60*1000);

export default function Page() {
  const { country } = useCountry();
  const [origin, setOrigin] = useState('ATH');
  const [dest, setDest] = useState('LHR');
  const [depart, setDepart] = useState(toISO(today));
  const [ret, setRet] = useState(toISO(nextWeek));

  const items = forCountry(byCategory('flights'), country);

  function normalizeDates(nextDepart?: string) {
    const d = nextDepart ?? depart;
    if (ret <= d) {
      const n = new Date(d);
      n.setDate(n.getDate() + 3);
      setRet(toISO(n));
    }
  }

  const q = `${origin}-${dest}`;

  return (
    <main>
      <div className="helper">
        Country filter: <b>{country}</b> • Change with the selector on the top-right.
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'0.5fr 0.5fr 0.8fr 0.8fr auto', gap:8, margin:'6px 0 16px' }}>
        <input
          value={origin}
          onChange={e => setOrigin(e.target.value.toUpperCase().slice(0,3))}
          placeholder="Origin IATA (e.g. ATH)"
          style={{ padding:'10px 12px', background:'var(--card)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:10 }}
        />
        <input
          value={dest}
          onChange={e => setDest(e.target.value.toUpperCase().slice(0,3))}
          placeholder="Dest IATA (e.g. LHR)"
          style={{ padding:'10px 12px', background:'var(--card)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:10 }}
        />
        <input
          type="date"
          value={depart}
          onChange={e => { setDepart(e.target.value); normalizeDates(e.target.value); }}
          style={{ padding:'10px 12px', background:'var(--card)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:10 }}
        />
        <input
          type="date"
          value={ret}
          onChange={e => setRet(e.target.value)}
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
            href={a.buildUrl({ q, country, checkin: depart, checkout: ret })}
            badge="Affiliate"
          />
        ))}
      </div>

      <OmniaAssistant />
    </main>
  );
}