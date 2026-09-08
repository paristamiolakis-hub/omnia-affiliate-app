'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { usePreferences } from '@/components/PreferencesContext';
import { HUMAN_PRIORITIES, type HumanPriority } from '@/lib/human-needs';

const DEPARTURE_EXAMPLES = ['Athens', 'Heraklion', 'Thessaloniki'];

export default function PreferencesForm() {
  const { preferences, ready, updatePreferences } = usePreferences();
  const [departure, setDeparture] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [priority, setPriority] = useState<HumanPriority>('balanced');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!ready) return;
    setDeparture(preferences.homeDeparture);
    setTravelers(preferences.travelers);
    setPriority(preferences.travelPriority);
  }, [preferences, ready]);

  function submit(event: FormEvent) {
    event.preventDefault();
    updatePreferences({
      onboardingComplete: true,
      homeDeparture: departure,
      travelers,
      travelPriority: priority
    });
    document.cookie = `omnia_home_departure=${encodeURIComponent(departure.trim().slice(0, 80))}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.cookie = `omnia_travelers=${travelers}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.cookie = `omnia_priority=${priority}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setSaved(true);
  }

  if (!ready) return <main className="preferences-page"><p className="helper">Loading preferences…</p></main>;

  return (
    <main className="preferences-page">
      <section className="preferences-hero card">
        <span className="eyebrow">MAKE OMNIA FASTER</span>
        <h2>Your usual defaults</h2>
        <p>Set these once. Omnia can use them only when you leave the same detail out of a future request.</p>
      </section>

      <form className="preferences-form card" onSubmit={submit}>
        <label className="field-label preference-field">
          Where do you usually leave from?
          <input
            value={departure}
            onChange={(event) => { setDeparture(event.target.value.slice(0, 80)); setSaved(false); }}
            placeholder="e.g. Heraklion"
            autoComplete="off"
          />
        </label>
        <div className="preference-chips" aria-label="Common departure examples">
          {DEPARTURE_EXAMPLES.map((item) => (
            <button key={item} type="button" className="preference-chip" onClick={() => { setDeparture(item); setSaved(false); }}>{item}</button>
          ))}
        </div>

        <fieldset className="preference-fieldset">
          <legend>How many people do you usually plan for?</legend>
          <div className="traveler-stepper">
            <button type="button" aria-label="Remove traveler" onClick={() => { setTravelers((value) => Math.max(1, value - 1)); setSaved(false); }}>−</button>
            <strong>{travelers}</strong>
            <button type="button" aria-label="Add traveler" onClick={() => { setTravelers((value) => Math.min(20, value + 1)); setSaved(false); }}>+</button>
          </div>
        </fieldset>

        <fieldset className="preference-fieldset">
          <legend>What usually matters most when you travel?</legend>
          <div className="preference-priority-list">
            {HUMAN_PRIORITIES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`preference-option ${priority === item.id ? 'selected' : ''}`}
                aria-pressed={priority === item.id}
                onClick={() => { setPriority(item.id); setSaved(false); }}
              >
                <span><strong>{item.shortLabel}</strong><small>{item.description}</small></span>
                <span aria-hidden="true">{priority === item.id ? '✓' : '›'}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="preference-privacy-note">
          <strong>Stored on this device</strong>
          <span>These defaults stay in this browser for now. They are not a claim about you and can be changed at any time.</span>
        </div>

        <button className="button preference-save" type="submit">{saved ? 'Saved ✓' : 'Save preferences'}</button>
        {saved && <Link href="/#travel-planner" className="preference-continue">Plan a trip with fewer details →</Link>}
      </form>
    </main>
  );
}
