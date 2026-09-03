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
      <div className="helper">Country filter: <b>{country}</b> • Results update as you type.</div>
      <label className="field-label" style={{ margin: '6px 0 16px' }}>
        Pickup city
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search city…" maxLength={200} />
      </label>
      <div className="grid">
        {items.map(a => (
          <AffiliateCard
            key={a.id}
            partnerId={a.id}
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
