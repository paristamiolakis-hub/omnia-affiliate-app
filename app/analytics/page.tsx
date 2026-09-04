'use client';

import { useEffect, useState } from 'react';
import { omniaStorage, type AnalyticsOverview } from '@/lib/storage';

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);

  useEffect(() => {
    omniaStorage.overview().then(setOverview);
  }, []);

  async function exportData() {
    const data = await omniaStorage.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `omnia-local-data-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main>
      <section className="travel-hero">
        <span className="eyebrow">LOCAL ANALYTICS</span>
        <h2>Omnia usage on this device</h2>
        <p>These metrics are stored only in this browser until a backend is connected.</p>
      </section>

      {!overview ? (
        <div className="card"><p>Loading analytics…</p></div>
      ) : (
        <>
          <div className="analytics-kpis">
            <div className="card"><span>Trip searches</span><strong>{overview.searches}</strong></div>
            <div className="card"><span>Saved trips</span><strong>{overview.savedTrips}</strong></div>
            <div className="card"><span>Affiliate clicks</span><strong>{overview.clicks}</strong></div>
          </div>

          <section className="card" style={{ marginTop: 16 }}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">PARTNERS</span>
                <h3>Click distribution</h3>
              </div>
              <button className="button secondary-button" type="button" onClick={exportData}>Export data</button>
            </div>
            {overview.partnerClicks.length === 0 ? (
              <p>No affiliate clicks recorded yet.</p>
            ) : (
              <div className="analytics-list">
                {overview.partnerClicks.map((item) => (
                  <div className="analytics-row" key={item.partner}>
                    <span>{item.partner}</span>
                    <strong>{item.clicks}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
