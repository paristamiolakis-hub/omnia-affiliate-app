'use client';
import { useEffect, useRef, useState } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function OmniaAssistant() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('Find a hotel in Heraklion next weekend');
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Hello! Ask me for hotels, cars, flights, tours, shops or finance. I will suggest the best links for your country.' }
  ]);
  const [json, setJson] = useState<any>(null);
  const ref = useRef<HTMLDivElement>(null);

  async function callAI(prompt: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });
      const data = await res.json();
      setJson(data);
      const suggestions = (data?.suggestions || []).map((s:any)=>`• ${s.title} → ${s.url}`).join('\n');
      setMessages(m => [...m, { role:'assistant', content: suggestions || 'No suggestions yet.' }]);
    } catch (e:any) {
      setMessages(m => [...m, { role:'assistant', content: 'Error: unable to reach AI endpoint.' }]);
    } finally {
      setLoading(false);
    }
  }

  function send() {
    if (!input.trim()) return;
    setMessages(m => [...m, { role:'user', content: input }]);
    void callAI(input);
    setInput('');
  }

  useEffect(()=>{
    if(ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages, open]);

  return (
    <>
      <button
        onClick={()=>setOpen(v=>!v)}
        style={{position:'fixed', right:20, bottom:20, zIndex:50}}
        className="button"
      >
        {open ? 'Close Assistant' : 'Ask Omnia'}
      </button>
      {open && (
        <div style={{position:'fixed', right:20, bottom:70, width:360, maxHeight:520, display:'flex', flexDirection:'column', gap:8, background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:12, zIndex:49}}>
          <div ref={ref} style={{overflow:'auto', flex:1, display:'flex', flexDirection:'column', gap:8}}>
            {messages.map((m,i)=>(
              <div key={i} style={{alignSelf: m.role==='user'?'flex-end':'flex-start', background:m.role==='user'?'#1f2a38':'#18202b', border:'1px solid var(--border)', padding:'8px 10px', borderRadius:10, maxWidth:'95%'}}>
                {m.content}
              </div>
            ))}
          </div>
          <div style={{display:'flex', gap:6}}>
            <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask e.g. hotels in Athens" style={{flex:1, padding:'10px 12px', background:'var(--card)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:10}}/>
            <button onClick={send} className="button" disabled={loading}>{loading?'…':'Send'}</button>
          </div>
        </div>
      )}
    </>
  );
}
