import type { MetadataRoute } from 'next';
import { DESTINATIONS } from '@/lib/destinations';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const routes = ['', '/hotels', '/cars', '/flights', '/tours', '/shops', '/finance', '/my-trips', '/analytics', '/destinations', '/privacy', '/terms'];
  const staticRoutes = routes.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : path === '/destinations' ? 0.85 : 0.7
  }));
  const destinationRoutes = DESTINATIONS.map((destination) => ({
    url: `${base}/destinations/${destination.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.75
  }));
  return [...staticRoutes, ...destinationRoutes];
}
