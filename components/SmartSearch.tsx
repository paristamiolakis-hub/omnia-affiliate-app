'use client';
import { useState } from 'react';
import { useCountry } from '@/components/CountryContext';

function toISO(d: Date) { return d.toISOString().slice(0,10); }
const today = new Date();
const tomorrow = new Date(Date.now() + 24*60*60*1000);

export default function SmartSearch() {
  const { country } = useCountry();
  const [q, setQ] = useState('Heraklion hotels this weekend');
  const [checkin, setCheckin] = useState(toISO(today));
  const [checkout, setCheckout] = useState(toISO(tomorrow));
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{title:string,url:string,reason?:string}[]>([]);
  const [error, setError] = useState<string | null>(null);

  function normalizeDates(nextCheckin?: string) {
    const ci = nextCheckin ?? checkin;
    if (checkout <= ci) {
      const n = new Date(ci);
      n.setDate(n.getDate() + 1);
      setCheckout(toISO(n));
    }
  }

  async function run() {
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
    if (!res.ok || data?.ok === false) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }
    setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
    if (!data?.suggestions?.length) setError('No suggestions yet for this query.');
  } catch (e: any) {
    setError(String(e?.message || e) || 'Suggestion engine failed.');
  } finally {
    setLoading(false);
  }
}
  return (
    <div className="card" style={{marginBottom:16}}>
      <h3>Smart Search</h3>
      <p>Describe what you want and I’ll route you to the right partners. Dates are optional.</p>

      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 0.8fr 0.8fr auto', gap:8, marginTop:8 }}>
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          // μέσα στο <input ... placeholder=... >
placeholder='e.g. "Heraklion hotels this weekend" or "Athens to London flight 12/01 → 15/01"'
          style={{ padding:'10px 12px', background:'var(--card)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:10 }}
        />
        <input
          type="date"
          value={checkin}
          onChange={e => { setCheckin(e.target.value); normalizeDates(e.target.value); }}
          style={{ padding:'10px 12px', background:'var(--card)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:10 }}
        />
        <input
          type="date"
          value={checkout}
          onChange={e => setCheckout(e.target.value)}
          style={{ padding:'10px 12px', background:'var(--card)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:10 }}
        />
        <button onClick={run} className="button" disabled={loading}>{loading?'Working…':'Suggest'}</button>
      </div>

      {error && <div className="helper" style={{ color:'#f88', marginTop:8 }}>⚠ {error}</div>}

      {suggestions.length>0 && (
        <div style={{marginTop:12, display:'grid', gap:8}}>
          {suggestions.map((s,i)=>(
            <div key={i} className="row" style={{justifyContent:'space-between'}}>
              <div>
                <div style={{fontWeight:700}}>{s.title}</div>
                <div className="helper">{s.reason}</div>
              </div>
              <a href={s.url} target="_blank" className="button">Open</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}