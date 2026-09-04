'use client';

import { useEffect, useMemo, useState } from 'react';
import type { HumanPriority } from '@/lib/human-needs';

type ScenarioId = 'save' | 'comfort' | 'shorter' | 'easy';

const SCENARIOS: Array<{ id: ScenarioId; label: string; title: string; description: string; priority: HumanPriority }> = [
  { id: 'save', label: '-200 budget', title: 'Spend less', description: 'Lower the stated budget by 200 when a budget can be detected, then protect essentials and buffer.', priority: 'save' },
  { id: 'comfort', label: '+200 budget', title: 'Add comfort', description: 'Raise the stated budget by 200 when detectable and use the extra room for comfort and fewer compromises.', priority: 'comfort' },
  { id: 'shorter', label: '1 day less', title: 'Shorter trip', description: 'Ask Omnia to remove one day/night and simplify the itinerary instead of compressing it.', priority: 'balanced' },
  { id: 'easy', label: 'Less hassle', title: 'Simpler trip', description: 'Keep the trip goal but prioritize simple logistics, time buffers and fewer moving parts.', priority: 'easy' }
];

function adjustBudget(prompt: string, delta: number) {
  const patterns = [
    /(budget\s*(?:of|is|:)?\s*[€$£]?\s*)(\d{2,6})/i,
    /([€$£]\s*)(\d{2,6})/,
    /(up to\s*[€$£]?\s*)(\d{2,6})/i
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (!match) continue;
    const amount = Number(match[2]);
    if (!Number.isFinite(amount)) continue;
    const next = Math.max(100, amount + delta);
    return prompt.replace(pattern, `${match[1]}${Math.round(next)}`);
  }
  return `${prompt}. Use a total planning budget ${delta > 0 ? `200 more` : `200 less`} than my current budget.`;
}

function buildScenarioPrompt(prompt: string, id: ScenarioId) {
  const base = prompt.trim().slice(0, 1600);
  if (id === 'save') return `${adjustBudget(base, -200)}. Protect essentials first, keep contingency and make optional spending easy to remove.`.slice(0, 1800);
  if (id === 'comfort') return `${adjustBudget(base, 200)}. Use extra budget mainly for accommodation comfort, easier logistics and contingency.`.slice(0, 1800);
  if (id === 'shorter') return `${base}. Rebuild this trip one day or one night shorter. Remove lower-priority activities instead of cramming them into the remaining time.`.slice(0, 1800);
  return `${base}. Prioritize simple logistics, realistic arrival/departure buffers, fewer moving parts and recovery time. Avoid unnecessary transfers or car rental.`.slice(0, 1800);
}

export default function TravelScenarioLab() {
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedPrompt = params.get('prompt');
    if (sharedPrompt?.trim()) setPrompt(sharedPrompt.trim().slice(0, 1800));
  }, []);

  const ready = Boolean(prompt.trim());
  const hint = useMemo(() => ready ? 'Each scenario re-opens the planner with one constraint changed.' : 'Paste the trip request you are considering, or open a shared Omnia trip link first.', [ready]);

  function runScenario(id: ScenarioId, priority: HumanPriority) {
    if (!ready) return;
    const params = new URLSearchParams({ prompt: buildScenarioPrompt(prompt, id), priority });
    window.location.href = `/?${params.toString()}`;
  }

  return (
    <section className="scenario-lab card" aria-labelledby="scenario-lab-title">
      <div className="section-heading">
        <div><span className="eyebrow">TRAVEL SCENARIO LAB</span><h2 id="scenario-lab-title">What changes if one constraint changes?</h2></div>
        <span className="badge">What-if planning</span>
      </div>
      <p>Use the same trip idea and test the trade-off instead of starting from zero.</p>
      <label className="field-label">
        Trip request
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value.slice(0, 1800))} rows={3} placeholder="Paste or write the trip request you want to compare" />
      </label>
      <p className="helper">{hint} These scenarios do not claim live savings, prices or availability.</p>
      <div className="scenario-grid">
        {SCENARIOS.map((scenario) => (
          <article className="scenario-card" key={scenario.id}>
            <span className="badge">{scenario.label}</span>
            <h3>{scenario.title}</h3>
            <p>{scenario.description}</p>
            <button className="button secondary-button" type="button" disabled={!ready} onClick={() => runScenario(scenario.id, scenario.priority)}>
              Build this version
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
