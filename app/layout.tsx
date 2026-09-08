import '../styles/globals.css';
import '../styles/platform.css';
import '../styles/intelligence.css';
import '../styles/human-needs.css';
import '../styles/human-decisions.css';
import '../styles/mobile.css';
import '../styles/preferences.css';
import Link from 'next/link';
import NavTabs from '@/components/NavTabs';
import MobileBottomNav from '@/components/MobileBottomNav';
import CountrySelect from '@/components/CountrySelect';
import { CountryProvider } from '@/components/CountryContext';
import { PreferencesProvider } from '@/components/PreferencesContext';

export const metadata = {
  title: 'Omnia – AI Travel & Shopping Agent',
  description: 'Tell Omnia what you need. Get a simple, structured decision flow for travel, shopping and finance.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Omnia – AI Travel & Shopping Agent',
    description: 'Start with what you need. Omnia handles the categories underneath.',
    type: 'website'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CountryProvider>
          <PreferencesProvider>
            <div className="container app-container">
              <header className="header app-header">
                <Link href="/" className="brand brand-link" aria-label="Omnia home">
                  <div className="logo" aria-hidden="true" />
                  <h1>Omnia</h1>
                </Link>
                <div className="header-actions">
                  <Link href="/preferences" className="preferences-link">Preferences</Link>
                  <CountrySelect />
                </div>
              </header>
              <NavTabs />
              {children}
              <footer className="footer">
                <div>© {new Date().getFullYear()} Omnia • Affiliate links may earn Omnia a commission.</div>
                <div style={{ marginTop: 6 }}>
                  <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms & Affiliate Disclosure</Link>
                </div>
              </footer>
            </div>
            <MobileBottomNav />
          </PreferencesProvider>
        </CountryProvider>
      </body>
    </html>
  );
}
