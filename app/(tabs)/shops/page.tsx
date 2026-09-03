'use client';
import OmniaAssistant from '@/components/OmniaAssistant';
import AffiliateCard from '@/components/AffiliateCard';
import { byCategory, forCountry } from '@/lib/affiliates';
import { useCountry } from '@/components/CountryContext';
import { useState } from 'react';

export default function Page() {
  const { country } = useCountry();
  const [query, setQuery] = useState('');
  const items = forCountry(byCategory('shops'), country);

  return (
    <main>
      <div className="helper">Country filter: <b>{country}</b> • Search terms are passed to supported shopping partners.</div>
      <label className="field-label" style={{ margin: '6px 0 16px' }}>
        Product search
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. noise cancelling headphones" maxLength={200} />
      </label>
      <div className="grid">
        {items.map(a => (
          <AffiliateCard
            key={a.id}
            partnerId={a.id}
            title={a.name}
            description={a.description}
            href={a.buildUrl({ country, q: query || undefined })}
            badge="Affiliate"
          />
        ))}
      </div>
      <OmniaAssistant />
    </main>
  );
}
