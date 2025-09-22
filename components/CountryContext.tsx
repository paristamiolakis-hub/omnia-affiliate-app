'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { CountryCode } from '@/lib/countries';

type Ctx = {
  country: CountryCode;
  setCountry: (c: CountryCode) => void;
}

const CountryContext = createContext<Ctx | null>(null);

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountry] = useState<CountryCode>('GR');

  useEffect(() => {
    // Try load from localStorage
    const stored = localStorage.getItem('country') as CountryCode | null;
    if (stored) setCountry(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem('country', country);
  }, [country]);

  return <CountryContext.Provider value={{ country, setCountry }}>{children}</CountryContext.Provider>;
}

export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error('useCountry must be used within CountryProvider');
  return ctx;
}
