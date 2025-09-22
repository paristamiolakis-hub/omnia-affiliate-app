'use client';
import OmniaAssistant from '@/components/OmniaAssistant';
import AffiliateCard from '@/components/AffiliateCard';
import { byCategory, forCountry } from '@/lib/affiliates';
import { useCountry } from '@/components/CountryContext';
import { useState } from 'react';

export default function Page() {
  const { country } = useCountry();
  const [query, setQuery] = useState('Heraklion');
  const items = forCountry(byCategory('cars'), country);

  return (
    <main>
      <div className="helper">Country filter: <b>{country}</b> • Change with the selector on the top-right.</div>
      <div style={{ display:'flex', gap:8, margin:'6px 0 16px' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search city…"
          style={{ flex:1, padding:'10px 12px', background:'var(--card)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:10 }}
        />
        <button onClick={()=>{}} className="button">Apply</button>
      </div>
      <div className="grid">
        {items.map(a => (
          <AffiliateCard
            key={a.id}
            title={a.name}
            description={a.description}
            href={a.buildUrl({ q: query || undefined, country })}
            badge="Affiliate"
          />
        ))}
      </div>
      <OmniaAssistant />
    </main>
  );
}