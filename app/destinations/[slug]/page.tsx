import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DESTINATIONS, getDestinationBySlug } from '@/lib/destinations';

export function generateStaticParams() {
  return DESTINATIONS.map((destination) => ({ slug: destination.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const destination = getDestinationBySlug(params.slug);
  if (!destination) return {};
  return {
    title: `${destination.city} Travel Guide | Omnia`,
    description: `${destination.summary} Build a complete ${destination.city} trip with Omnia.`
  };
}

export default function DestinationPage({ params }: { params: { slug: string } }) {
  const destination = getDestinationBySlug(params.slug);
  if (!destination) notFound();

  const suggestedPrompt = `${destination.city} for ${destination.suggestedDays.min}-${destination.suggestedDays.max} days, 2 people, culture and food`;

  return (
    <main className="destination-guide">
      <section className="destination-guide-hero">
        <span className="eyebrow">{destination.country.toUpperCase()} · {destination.flightCode}</span>
        <h2>{destination.city}</h2>
        <p>{destination.summary}</p>
        <div className="destination-guide-actions">
          <Link className="button" href={`/?prompt=${encodeURIComponent(suggestedPrompt)}`}>Plan {destination.city}</Link>
          <Link className="button secondary-button" href="/destinations">All destinations</Link>
        </div>
      </section>

      <section className="destination-guide-grid">
        <article className="card">
          <span className="eyebrow">TRIP SHAPE</span>
          <h3>How Omnia models this destination</h3>
          <div className="destination-facts">
            <div><span>Suggested stay</span><strong>{destination.suggestedDays.min}-{destination.suggestedDays.max} days</strong></div>
            <div><span>Main airport</span><strong>{destination.flightCode}</strong></div>
            <div><span>Car</span><strong>{destination.carUseful ? 'Can be useful' : 'Usually optional'}</strong></div>
          </div>
        </article>

        <article className="card">
          <span className="eyebrow">HIGHLIGHTS</span>
          <h3>Good anchors for the itinerary</h3>
          <div className="interest-row">
            {destination.highlights.map((highlight) => <span className="badge" key={highlight}>{highlight}</span>)}
          </div>
        </article>

        <article className="card">
          <span className="eyebrow">BEST FOR</span>
          <h3>Trip interests</h3>
          <div className="interest-row">
            {destination.interests.map((interest) => <span className="badge" key={interest}>{interest}</span>)}
          </div>
        </article>
      </section>

      <section className="destination-guide-note card">
        <h3>What this guide does — and does not do</h3>
        <p>Omnia uses this profile to improve destination recognition, trip-readiness guidance and partner ranking. Live prices, availability and booking terms are still confirmed on each partner site.</p>
      </section>
    </main>
  );
}
