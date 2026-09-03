import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const routes = ['', '/hotels', '/cars', '/flights', '/tours', '/shops', '/finance', '/privacy', '/terms'];
  return routes.map((path) => ({ url: `${base}${path}`, changeFrequency: 'weekly', priority: path === '' ? 1 : 0.7 }));
}
