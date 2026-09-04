'use client';

import { useMemo, useState } from 'react';
import AffiliateCard from '@/components/AffiliateCard';
import { useCountry } from '@/components/CountryContext';
import { byCategory, forCountry } from '@/lib/affiliates';

type ShoppingPriority = 'value' | 'durability' | 'easy-returns' | 'simple' | 'gift';

const PRIORITIES: Array<{ id: ShoppingPriority; label: string; description: string }> = [
  { id: 'value', label: 'Best value', description: 'Protect the total spend and focus on what matters most.' },
  { id: 'durability', label: 'Long-lasting', description: 'Prioritize warranty, repairability and expected useful life.' },
  { id: 'easy-returns', label: 'Easy returns', description: 'Reduce the risk of being stuck with the wrong product.' },
  { id: 'simple', label: 'Keep it simple', description: 'Avoid paying for features you do not actually need.' },
  { id: 'gift', label: 'Good gift', description: 'Protect delivery timing, exchange options and recipient fit.' }
];

function checklist(priority: ShoppingPriority) {
  const common = [
    'Compare the delivered total, not only the headline price.',
    'Check seller identity, warranty coverage and return terms before paying.',
    'Read the exact model, size, compatibility or included-accessory details.'
  ];
  const extra: Record<ShoppingPriority, string[]> = {
    value: ['Separate must-have features from nice-to-have extras before comparing products.'],
    durability: ['Look for repairability, replacement parts, warranty length and materials rather than relying only on review scores.'],
    'easy-returns': ['Confirm return window, return shipping cost, opened-item rules and any restocking fee.'],
    simple: ['Prefer the smallest feature set that solves the actual need; complexity can add cost and failure points.'],
    gift: ['Confirm delivery date, gift receipt/exchange options and whether the recipient can easily return or exchange it.']
  };
  return [...common, ...extra[priority]];
}

export default function HumanShopping() {
  const { country } = useCountry();
  const [need, setNeed] = useState('');
  const [budget, setBudget] = useState('');
  const [mustHave, setMustHave] = useState('');
  const [avoid, setAvoid] = useState('');
  const [priority, setPriority] = useState<ShoppingPriority>('value');

  const items = forCountry(byCategory('shops'), country);
  const partnerQuery = useMemo(() => [need.trim(), mustHave.trim()].filter(Boolean).join(' ').slice(0, 200), [need, mustHave]);
  const selected = PRIORITIES.find((item) => item.id === priority)!;
  const checks = checklist(priority);

  return (
    <main className="human-commerce-page">
      <section className="human-decision-hero card">
        <span className="eyebrow">SHOPPING FOR A REAL NEED</span>
        <h2>Start with what you need, not with a product list.</h2>
        <p>Omnia turns the purchase into a decision brief first. Partner sites still provide the live products, prices, stock and seller terms.</p>

        <div className="decision-form-grid">
          <label className="field-label">
            What do you need?
            <input value={need} onChange={(event) => setNeed(event.target.value.slice(0, 140))} placeholder="e.g. headphones for flights and office calls" />
          </label>
          <label className="field-label">
            Maximum spend
            <input value={budget} onChange={(event) => setBudget(event.target.value.slice(0, 40))} placeholder="e.g. 200 EUR" />
          </label>
          <label className="field-label">
            Must-have
            <input value={mustHave} onChange={(event) => setMustHave(event.target.value.slice(0, 120))} placeholder="e.g. USB-C, good microphone" />
          </label>
          <label className="field-label">
            Avoid
            <input value={avoid} onChange={(event) => setAvoid(event.target.value.slice(0, 120))} placeholder="e.g. heavy, subscription, proprietary cable" />
          </label>
        </div>

        <div className="need-priority-block">
          <span className="eyebrow">WHAT MATTERS MOST?</span>
          <div className="priority-grid commerce-priority-grid">
            {PRIORITIES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`priority-card ${priority === item.id ? 'priority-active' : ''}`}
                aria-pressed={priority === item.id}
                onClick={() => setPriority(item.id)}
              >
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="decision-brief card">
        <div className="section-heading">
          <div><span className="eyebrow">OMNIA DECISION BRIEF</span><h3>{need.trim() || 'Describe the purchase first'}</h3></div>
          <span className="badge">{selected.label}</span>
        </div>
        <div className="brief-facts">
          <div><span>Spending cap</span><strong>{budget.trim() || 'Not set'}</strong></div>
          <div><span>Must-have</span><strong>{mustHave.trim() || 'Not set'}</strong></div>
          <div><span>Avoid</span><strong>{avoid.trim() || 'Not set'}</strong></div>
        </div>
        <div className="decision-checks">
          <strong>Check before buying</strong>
          <ul>{checks.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <p className="helper">Omnia is not ranking live products here. Price, stock, reviews and seller policies must be checked on the partner site.</p>
      </section>

      <section>
        <div className="section-heading">
          <div><span className="eyebrow">SEARCH PARTNERS</span><h3>Open the live marketplace only when the need is clear</h3></div>
          <span className="helper">Country: <b>{country}</b></span>
        </div>
        <div className="grid">
          {items.map((affiliate) => (
            <AffiliateCard
              key={affiliate.id}
              partnerId={affiliate.id}
              title={affiliate.name}
              description={affiliate.description}
              href={affiliate.buildUrl({ country, q: partnerQuery || undefined })}
              badge="Live marketplace"
            />
          ))}
        </div>
      </section>
    </main>
  );
}
