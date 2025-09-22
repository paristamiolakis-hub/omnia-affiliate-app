'use client';
import { useCountry } from './CountryContext';
import { COUNTRIES } from '@/lib/countries';

export default function CountrySelect() {
  const { country, setCountry } = useCountry();
  return (
    <select className="country-select" value={country} onChange={e => setCountry(e.target.value as any)}>
      {COUNTRIES.map(c => (
        <option key={c.code} value={c.code}>{c.name}</option>
      ))}
    </select>
  );
}
