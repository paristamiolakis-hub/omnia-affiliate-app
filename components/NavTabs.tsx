'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'Home' },
  { href: '/hotels', label: 'Hotels' },
  { href: '/cars', label: 'Cars' },
  { href: '/flights', label: 'Flights' },
  { href: '/tours', label: 'Tours' },
  { href: '/shops', label: 'Shops' },
  { href: '/finance', label: 'Finance' }
];

export default function NavTabs() {
  const pathname = usePathname();
  return (
    <nav className="nav">
      {TABS.map(t => {
        const active = pathname === t.href;
        return (
          <Link key={t.href} href={t.href} className={`tab ${active ? 'active' : ''}`}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
