import Link from 'next/link';

export default function AffiliateCard({
  title, description, href, badge
}: { title: string; description?: string; href: string; badge?: string; }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="row">
        <span className="badge">{badge || 'Affiliate'}</span>
        <Link href={href} className="button" target="_blank">Open</Link>
      </div>
    </div>
  );
}
