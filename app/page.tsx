import MobileStart from '@/components/MobileStart';
import TravelPlanner from '@/components/TravelPlanner';
import TravelScenarioLab from '@/components/TravelScenarioLab';
import SmartSearch from '@/components/SmartSearch';
import OmniaAssistant from '@/components/OmniaAssistant';

export default function Page() {
  return (
    <main className="home-shell">
      <MobileStart />

      <div id="travel-planner" className="primary-decision-flow">
        <TravelPlanner />
      </div>

      <section className="advanced-home-section" aria-label="Advanced travel options">
        <details>
          <summary>More ways to adjust this trip</summary>
          <div className="advanced-home-content">
            <TravelScenarioLab />
          </div>
        </details>
      </section>

      <section className="legacy-search-section advanced-home-section" aria-labelledby="quick-search-title">
        <details>
          <summary>Open category search</summary>
          <div className="advanced-home-content">
            <div className="section-heading">
              <div>
                <span className="eyebrow">QUICK SEARCH</span>
                <h2 id="quick-search-title">Search a specific category</h2>
              </div>
            </div>
            <SmartSearch />
          </div>
        </details>
      </section>

      <OmniaAssistant />
    </main>
  );
}
