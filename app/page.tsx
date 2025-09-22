import Link from 'next/link';

import SmartSearch from '@/components/SmartSearch';
import OmniaAssistant from '@/components/OmniaAssistant';

export default function Page() {
  return (
    <main>
      <SmartSearch />
      <div className="card" style={{marginBottom:16}}>
        <h3>Welcome to Omnia</h3>
        <p>
          Start earning with quick affiliate integrations across travel, shopping, finance and more.
          Pick a tab above, choose a country, and click through to partner sites using your affiliate IDs.
        </p>
        <div className="helper">
          Tip: Rename the app and update links in <code>/lib/affiliates.ts</code>. Fill your IDs in <code>.env.local</code>.
        </div>
        <div className="row">
          <span className="badge">MVP</span>
          <Link href="/hotels" className="button">Go to Hotels</Link>
        </div>
      </div>
          <OmniaAssistant />
    </main>
  );
}
