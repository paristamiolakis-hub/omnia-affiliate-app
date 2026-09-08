'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PRIMARY_TABS = [
  { href: '/', label: 'Home' },
  { href: '/my-trips', label: 'My Trips' },
  { href: '/destinations', label: 'Explore' },
  { href: '/shops', label: 'Shopping' },
  { href: '/finance', label: 'Finance' }
];

const SECONDARY_TABS = [
  { href: '/flights', label: 'Flights' },
  { href: '/hotels', label: 'Hotels' },
  { href: '/tours', label: 'Tours' },
  { href: '/cars', label: 'Cars' },
  { href: '/analytics', label: 'Analytics' }
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
}

export default function NavTabs() {
  const pathname = usePathname();
  return (
    <div className="desktop-nav-wrap">
      <nav className="nav primary-nav" aria-label="Primary navigation">
        {PRIMARY_TABS.map((t) => (
          <Link key={t.href} href={t.href} className={`tab ${isActive(pathname, t.href) ? 'active' : ''}`}>
            {t.label}
          </Link>
        ))}
      </nav>
      <details className="more-nav">
        <summary>More</summary>
        <nav aria-label="Secondary navigation" className="more-nav-menu">
          {SECONDARY_TABS.map((t) => (
            <Link key={t.href} href={t.href} className={isActive(pathname, t.href) ? 'active' : ''}>
              {t.label}
            </Link>
          ))}
        </nav>
      </details>
    </div>
  );
}
