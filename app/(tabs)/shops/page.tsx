'use client';
import OmniaAssistant from '@/components/OmniaAssistant';
import AffiliateCard from '@/components/AffiliateCard';
import { byCategory, forCountry } from '@/lib/affiliates';
import { useCountry } from '@/components/CountryContext';

export default function Page() {
  const { country } = useCountry();
  const items = forCountry(byCategory('shops'), country);

  return (
    <main>
      <div className="helper">Country filter: <b>{country}</b> • Change with the selector on the top-right.</div>
      <div className="grid">
        {items.map(a => (
          <AffiliateCard
            key={a.id}
            title={a.name}
            description={a.description}
            href={a.buildUrl({ country })}
            badge="Affiliate"
          />
        ))}
      </div>
      <OmniaAssistant />
    </main>
  );
}
