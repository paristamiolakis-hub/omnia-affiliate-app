'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { COUNTRIES, type CountryCode } from '@/lib/countries';

type Ctx = {
  country: CountryCode;
  setCountry: (c: CountryCode) => void;
};

const CountryContext = createContext<Ctx | null>(null);
const VALID_COUNTRIES = new Set(COUNTRIES.map((c) => c.code));

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountry] = useState<CountryCode>('GR');

  useEffect(() => {
    const stored = localStorage.getItem('country') as CountryCode | null;
    if (stored && VALID_COUNTRIES.has(stored)) setCountry(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem('country', country);
    document.cookie = `country=${country}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, [country]);

  return <CountryContext.Provider value={{ country, setCountry }}>{children}</CountryContext.Provider>;
}

export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error('useCountry must be used within CountryProvider');
  return ctx;
}
