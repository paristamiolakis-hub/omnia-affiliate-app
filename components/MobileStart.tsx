'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { omniaStorage, type SavedTrip } from '@/lib/storage';

const MODES = [
  {
    href: '#travel-planner',
    icon: '✈️',
    title: 'Plan a trip',
    description: 'Tell Omnia where you want to go and what matters.'
  },
  {
    href: '/shops',
    icon: '🛍️',
    title: 'Buy something',
    description: 'Start from the need, budget and must-haves.'
  },
  {
    href: '/finance',
    icon: '💳',
    title: 'Money & payments',
    description: 'Choose the job you need a money tool to do.'
  }
] as const;

export default function MobileStart() {
  const [recentTrip, setRecentTrip] = useState<SavedTrip | null>(null);

  useEffect(() => {
    omniaStorage.listTrips().then((trips) => setRecentTrip(trips[0] || null));
  }, []);

  return (
    <section className="mobile-start" aria-labelledby="mobile-start-title">
      <div className="mobile-start-copy">
        <span className="eyebrow">OMNIA</span>
        <h2 id="mobile-start-title">What do you need?</h2>
        <p>Start with the goal. Omnia handles the categories underneath.</p>
      </div>

      <div className="mobile-mode-grid">
        {MODES.map((mode) => (
          <Link key={mode.href} href={mode.href} className="mobile-mode-card">
            <span className="mobile-mode-icon" aria-hidden="true">{mode.icon}</span>
            <span className="mobile-mode-text">
              <strong>{mode.title}</strong>
              <small>{mode.description}</small>
            </span>
            <span className="mobile-mode-arrow" aria-hidden="true">›</span>
          </Link>
        ))}
      </div>

      {recentTrip && (
        <Link className="continue-card" href={`/?trip=${encodeURIComponent(recentTrip.id)}#travel-planner`}>
          <span>
            <small>CONTINUE WHERE YOU LEFT OFF</small>
            <strong>{recentTrip.title}</strong>
          </span>
          <span aria-hidden="true">Continue ›</span>
        </Link>
      )}
    </section>
  );
}
