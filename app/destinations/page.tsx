import Link from 'next/link';
import { DESTINATIONS } from '@/lib/destinations';

export const metadata = {
  title: 'Travel Destinations | Omnia',
  description: 'Explore Omnia destination guides and start a complete AI-assisted trip plan.'
};

export default function DestinationsPage() {
  return (
    <main>
      <section className="destination-index-hero">
        <span className="eyebrow">DESTINATION INTELLIGENCE</span>
        <h2>Choose a city. Then let Omnia build the trip.</h2>
        <p>Focused destination profiles feed the same planning engine used for flights, hotels, activities, cars and budget allocation.</p>
      </section>

      <div className="destination-grid">
        {DESTINATIONS.map((destination) => (
          <Link className="card destination-card" key={destination.slug} href={`/destinations/${destination.slug}`}>
            <span className="eyebrow">{destination.country}</span>
            <h3>{destination.city}</h3>
            <p>{destination.summary}</p>
            <div className="destination-card-meta">
              <span>{destination.flightCode}</span>
              <span>{destination.suggestedDays.min}-{destination.suggestedDays.max} days</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
