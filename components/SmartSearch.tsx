'use client';
import { useState } from 'react';
import { useCountry } from '@/components/CountryContext';

function toLocalISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function initialDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return { today: toLocalISO(today), tomorrow: toLocalISO(tomorrow) };
}

type Suggestion = { partnerId?: string; title: string; url: string; reason?: string };

export default function SmartSearch() {
  const { country } = useCountry();
  const initial = initialDates();
  const [q, setQ] = useState('Heraklion hotels this weekend');
  const [checkin, setCheckin] = useState(initial.today);
  const [checkout, setCheckout] = useState(initial.tomorrow);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  function normalizeDates(nextCheckin?: string) {
    const ci = nextCheckin ?? checkin;
    if (checkout <= ci) {
      const n = new Date(`${ci}T12:00:00`);
      n.setDate(n.getDate() + 1);
      setCheckout(toLocalISO(n));
    }
  }

  async function run() {
    if (!q.trim()) {
      setError('Enter what you want to search for.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, country, checkin, checkout })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.error || `HTTP ${res.status}`);
      const next = Array.isArray(data?.suggestions) ? data.suggestions : [];
      setSuggestions(next);
      if (!next.length) setError('No configured affiliate partner is available for this search yet.');
    } catch (e: any) {
      setError(String(e?.message || e) || 'Suggestion engine failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card" style={{ marginBottom: 16 }} aria-labelledby="smart-search-title">
      <h2 id="smart-search-title" className="section-title">Smart Search</h2>
      <p>Describe what you want and Omnia will route you to configured affiliate partners.</p>

      <div className="search-grid">
        <label className="field-label">
          Search
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void run(); }}
            placeholder='e.g. "Heraklion hotels this weekend" or "ATH-LHR flight"'
            maxLength={1200}
          />
        </label>
        <label className="field-label">
          From
          <input type="date" value={checkin} onChange={e => { setCheckin(e.target.value); normalizeDates(e.target.value); }} />
        </label>
        <label className="field-label">
          To
          <input type="date" min={checkin} value={checkout} onChange={e => setCheckout(e.target.value)} />
        </label>
        <button onClick={() => void run()} className="button search-action" disabled={loading}>
          {loading ? 'Working…' : 'Suggest'}
        </button>
      </div>

      {error && <div className="helper error-text" role="status">⚠ {error}</div>}

      {suggestions.length > 0 && (
        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          {suggestions.map((s, i) => (
            <div key={`${s.partnerId || s.title}-${i}`} className="row suggestion-row">
              <div>
                <div style={{ fontWeight: 700 }}>{s.title}</div>
                <div className="helper">{s.reason}</div>
              </div>
              <a
                href={`/api/out?partner=${encodeURIComponent(s.partnerId || s.title)}&url=${encodeURIComponent(s.url)}`}
                target="_blank"
                rel="nofollow sponsored noopener"
                className="button"
              >
                Open
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
