import '../styles/globals.css';
import NavTabs from '@/components/NavTabs';
import CountrySelect from '@/components/CountrySelect';
import { CountryProvider } from '@/components/CountryContext';

export const metadata = {
  title: 'Omnia – Super Affiliate Hub',
  description: 'Hotels, Cars, Flights, Tours, Shops & Finance in one app.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CountryProvider>
          <div className="container">
            <header className="header">
              <div className="brand">
                <div className="logo" />
                <h1>Omnia</h1>
              </div>
              <CountrySelect />
            </header>
            <NavTabs />
            {children}
            <footer className="footer">
              © {new Date().getFullYear()} Omnia • This app uses affiliate links. Prices and bookings are completed on partner sites.
            </footer>
          </div>
        </CountryProvider>
      </body>
    </html>
  );
}
