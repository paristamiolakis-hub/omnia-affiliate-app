import TravelPlanner from '@/components/TravelPlanner';
import SmartSearch from '@/components/SmartSearch';
import OmniaAssistant from '@/components/OmniaAssistant';

export default function Page() {
  return (
    <main>
      <TravelPlanner />

      <section className="legacy-search-section" aria-labelledby="quick-search-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">QUICK SEARCH</span>
            <h2 id="quick-search-title">Prefer the old one-step search?</h2>
          </div>
        </div>
        <SmartSearch />
      </section>

      <OmniaAssistant />
    </main>
  );
}
