'use client';

import { buildTravelScenarios, type TravelScenario } from '@/lib/travel-scenarios';
import type { HumanTripPlanResult } from '@/lib/human-needs';

export default function TravelScenarioExplorer({
  result,
  loading,
  onRun
}: {
  result: HumanTripPlanResult;
  loading: boolean;
  onRun: (scenario: TravelScenario) => void;
}) {
  const scenarios = buildTravelScenarios(result);

  return (
    <section className="scenario-section" aria-labelledby="scenario-heading">
      <div className="section-heading">
        <div>
          <span className="eyebrow">WHAT IF?</span>
          <h3 id="scenario-heading">Compare another version of this trip</h3>
        </div>
        <span className="badge">Planning scenarios</span>
      </div>
      <p className="scenario-intro">
        Change one important constraint and let Omnia rebuild the plan. These are planning alternatives, not live-price guarantees.
      </p>
      <div className="scenario-grid">
        {scenarios.map((scenario) => (
          <article className="card scenario-card" key={scenario.id}>
            <div className="scenario-card-head">
              <span className="badge">{scenario.label}</span>
              <strong>{scenario.title}</strong>
            </div>
            <p>{scenario.description}</p>
            <ul>
              {scenario.changes.map((change) => <li key={change}>{change}</li>)}
            </ul>
            <div className="scenario-footer">
              <small>{scenario.disclaimer}</small>
              <button
                className="button secondary-button"
                type="button"
                disabled={loading}
                onClick={() => onRun(scenario)}
              >
                {loading ? 'Rebuilding…' : 'Try this scenario'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
