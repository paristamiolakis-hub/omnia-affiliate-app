'use client';
import { useEffect, useRef, useState } from 'react';
import { useCountry } from '@/components/CountryContext';

type Msg = { role: 'user' | 'assistant'; content: string };
type Suggestion = { partnerId?: string; title: string; url: string; reason?: string };

export default function OmniaAssistant() {
  const { country } = useCountry();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('Find a hotel in Heraklion next weekend');
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Ask for hotels, cars, flights, tours, shops or finance. I will route you to configured partners.' }
  ]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  async function callAI(prompt: string) {
    setLoading(true);
    setSuggestions([]);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], country })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Assistant request failed.');
      const next = Array.isArray(data?.suggestions) ? data.suggestions : [];
      setSuggestions(next);
      setMessages(m => [...m, {
        role: 'assistant',
        content: next.length ? `I found ${next.length} configured option${next.length === 1 ? '' : 's'}.` : 'No configured partner is available for that request yet.'
      }]);
    } catch (e: any) {
      setMessages(m => [...m, { role: 'assistant', content: String(e?.message || 'Unable to reach the assistant.') }]);
    } finally {
      setLoading(false);
    }
  }

  function send() {
    const prompt = input.trim();
    if (!prompt || loading) return;
    setMessages(m => [...m, { role: 'user', content: prompt }]);
    void callAI(prompt);
    setInput('');
  }

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages, open]);

  return (
    <>
      <button onClick={() => setOpen(v => !v)} className="button assistant-toggle" aria-expanded={open} aria-controls="omnia-assistant-panel">
        {open ? 'Close Assistant' : 'Ask Omnia'}
      </button>
      {open && (
        <aside id="omnia-assistant-panel" className="assistant-panel" aria-label="Omnia Assistant">
          <div ref={ref} className="assistant-messages" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`message-bubble ${m.role === 'user' ? 'message-user' : 'message-assistant'}`}>
                {m.content}
              </div>
            ))}
            {suggestions.length > 0 && (
              <div className="assistant-suggestions">
                {suggestions.map((s, i) => (
                  <a
                    key={`${s.partnerId || s.title}-${i}`}
                    href={`/api/out?partner=${encodeURIComponent(s.partnerId || s.title)}&url=${encodeURIComponent(s.url)}`}
                    target="_blank"
                    rel="nofollow sponsored noopener"
                    className="assistant-suggestion"
                  >
                    <strong>{s.title}</strong>
                    <span>{s.reason}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="assistant-input-row">
            <label className="sr-only" htmlFor="omnia-assistant-input">Ask Omnia</label>
            <input
              id="omnia-assistant-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
              maxLength={1200}
              placeholder="Ask e.g. hotels in Athens"
            />
            <button onClick={send} className="button" disabled={loading}>{loading ? '…' : 'Send'}</button>
          </div>
        </aside>
      )}
    </>
  );
}
