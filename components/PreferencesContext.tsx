'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type OmniaPreferences,
  type PreferenceInput
} from '@/lib/preferences';

type PreferencesContextValue = {
  preferences: OmniaPreferences;
  ready: boolean;
  updatePreferences: (input: PreferenceInput) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<OmniaPreferences>(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPreferences(loadPreferences());
    setReady(true);
  }, []);

  const value = useMemo<PreferencesContextValue>(() => ({
    preferences,
    ready,
    updatePreferences(input) {
      const next = savePreferences(input);
      setPreferences(next);
    }
  }), [preferences, ready]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used within PreferencesProvider');
  return context;
}
