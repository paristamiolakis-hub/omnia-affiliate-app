import '../styles/globals.css';
import Link from 'next/link';
import NavTabs from '@/components/NavTabs';
import CountrySelect from '@/components/CountrySelect';
import { CountryProvider } from '@/components/CountryContext';

export const metadata = {
  title: 'Omnia – AI Travel & Shopping Agent',
  description: 'Tell Omnia what you want to do. Get a structured travel plan, budget map and trusted partner searches in one place.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Omnia – AI Travel & Shopping Agent',
    description: 'Plan a complete trip from one natural-language request.',
    type: 'website'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CountryProvider>
          <div className="container">
            <header className="header">
              <div className="brand">
                <div className="logo" aria-hidden="true" />
                <h1>Omnia</h1>
              </div>
              <CountrySelect />
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
        </CountryProvider>
      </body>
    </html>
  );
}
