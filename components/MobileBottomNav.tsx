'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Home', icon: '⌂' },
  { href: '/my-trips', label: 'Trips', icon: '✈' },
  { href: '/destinations', label: 'Explore', icon: '⌖' },
  { href: '/shops', label: 'Shop', icon: '◫' },
  { href: '/finance', label: 'Money', icon: '◉' }
] as const;

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
      {ITEMS.map((item) => {
        const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`));
        return (
          <Link key={item.href} href={item.href} className={active ? 'mobile-nav-item active' : 'mobile-nav-item'}>
            <span className="mobile-nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
