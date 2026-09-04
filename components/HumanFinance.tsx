'use client';

import { useState } from 'react';
import AffiliateCard from '@/components/AffiliateCard';
import { useCountry } from '@/components/CountryContext';
import { byCategory, forCountry } from '@/lib/affiliates';

type FinanceGoal = 'travel-payments' | 'daily-spending' | 'expense-control' | 'international' | 'simple';

const GOALS: Array<{ id: FinanceGoal; label: string; description: string }> = [
  { id: 'travel-payments', label: 'Travel payments', description: 'Cards, currencies and everyday spending while travelling.' },
  { id: 'daily-spending', label: 'Daily spending', description: 'A practical everyday payment setup with clear costs.' },
  { id: 'expense-control', label: 'Control spending', description: 'Visibility, limits and budgeting matter more than extra features.' },
  { id: 'international', label: 'International use', description: 'Transfers, currencies and cross-border use are important.' },
  { id: 'simple', label: 'Keep it simple', description: 'Avoid unnecessary plans, add-ons and complexity.' }
];

function checks(goal: FinanceGoal) {
  const common = [
    'Check the exact fee schedule, plan price and any fair-use or usage limits.',
    'Verify card, cash withdrawal, transfer and foreign-exchange charges for your actual use.',
    'Read eligibility, account closure, chargeback and support terms before opening an account.'
  ];
  const extra: Record<FinanceGoal, string[]> = {
    'travel-payments': ['Check weekend/after-hours FX rules, ATM operator fees and whether you need a backup payment method abroad.'],
    'daily-spending': ['Compare recurring plan cost against the features you will actually use each month.'],
    'expense-control': ['Look for spend notifications, category visibility, limits and export tools rather than rewards alone.'],
    international: ['Compare transfer fees, receiving fees, supported currencies and intermediary-bank costs where relevant.'],
    simple: ['Prefer the lowest-complexity plan that covers the actual need; avoid paying for unused premium features.']
  };
  return [...common, ...extra[goal]];
}

export default function HumanFinance() {
  const { country } = useCountry();
  const [goal, setGoal] = useState<FinanceGoal>('travel-payments');
  const [usage, setUsage] = useState('');
  const [concerns, setConcerns] = useState('');
  const items = forCountry(byCategory('finance'), country);
  const selected = GOALS.find((item) => item.id === goal)!;

  return (
    <main className="human-commerce-page">
      <section className="human-decision-hero card">
        <span className="eyebrow">FINANCE FOR A REAL NEED</span>
        <h2>Start with the job the money tool must do.</h2>
        <p>
          Omnia helps structure the decision and exposes the checks that matter. It does not provide personalized investment, credit, tax or legal advice.
        </p>

        <div className="need-priority-block">
          <span className="eyebrow">WHAT ARE YOU TRYING TO DO?</span>
          <div className="priority-grid commerce-priority-grid">
            {GOALS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`priority-card ${goal === item.id ? 'priority-active' : ''}`}
                aria-pressed={goal === item.id}
                onClick={() => setGoal(item.id)}
              >
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="decision-form-grid">
          <label className="field-label">
            How will you use it?
            <input value={usage} onChange={(event) => setUsage(event.target.value.slice(0, 180))} placeholder="e.g. 3 trips/year, card purchases, some ATM cash" />
          </label>
          <label className="field-label">
            What do you want to avoid?
            <input value={concerns} onChange={(event) => setConcerns(event.target.value.slice(0, 180))} placeholder="e.g. monthly fees, poor support, hidden FX limits" />
          </label>
        </div>
      </section>

      <section className="decision-brief card">
        <div className="section-heading">
          <div><span className="eyebrow">OMNIA DECISION BRIEF</span><h3>{selected.label}</h3></div>
          <span className="badge">Country {country}</span>
        </div>
        <p>{selected.description}</p>
        <div className="brief-facts">
          <div><span>Expected use</span><strong>{usage.trim() || 'Not set'}</strong></div>
          <div><span>Avoid</span><strong>{concerns.trim() || 'Not set'}</strong></div>
        </div>
        <div className="decision-checks">
          <strong>Check before signing up</strong>
          <ul>{checks(goal).map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <p className="helper">
          Partner eligibility, fees, features and regulatory terms can change. Confirm all current terms directly with the provider before opening or funding an account.
        </p>
      </section>

      <section>
        <div className="section-heading">
          <div><span className="eyebrow">AVAILABLE PARTNERS</span><h3>Review current provider terms</h3></div>
        </div>
        <div className="grid">
          {items.map((affiliate) => (
            <AffiliateCard
              key={affiliate.id}
              partnerId={affiliate.id}
              title={affiliate.name}
              description={affiliate.description}
              href={affiliate.buildUrl({ country })}
              badge="Provider"
            />
          ))}
        </div>
      </section>
    </main>
  );
}
