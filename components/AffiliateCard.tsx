import Link from 'next/link';

export default function AffiliateCard({
  title, description, href, badge, partnerId
}: { title: string; description?: string; href: string; badge?: string; partnerId?: string; }) {
  const configured = Boolean(href);
  const trackedHref = configured
    ? `/api/out?partner=${encodeURIComponent(partnerId || title)}&url=${encodeURIComponent(href)}`
    : '';

  return (
    <div className="card">
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="row">
        <span className="badge">{badge || 'Affiliate'}</span>
        {configured ? (
          <Link href={trackedHref} className="button" target="_blank" rel="nofollow sponsored noopener">
            Open
          </Link>
        ) : (
          <span className="button button-disabled" aria-disabled="true" title="Affiliate ID is not configured">
            Configure first
          </span>
        )}
      </div>
    </div>
  );
}
