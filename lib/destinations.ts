export interface DestinationProfile {
  slug: string;
  city: string;
  country: string;
  countryCode: string;
  flightCode: string;
  aliases: string[];
  summary: string;
  highlights: string[];
  interests: string[];
  suggestedDays: { min: number; max: number };
  carUseful: boolean;
}

export const DESTINATIONS: DestinationProfile[] = [
  { slug: 'athens', city: 'Athens', country: 'Greece', countryCode: 'GR', flightCode: 'ATH', aliases: ['athens','athina','αθηνα','αθήνα'], summary: 'Ancient landmarks, dense neighbourhoods, food and easy urban sightseeing.', highlights: ['Acropolis','Plaka','Monastiraki'], interests: ['culture','food','nightlife','family'], suggestedDays: { min: 2, max: 4 }, carUseful: false },
  { slug: 'heraklion', city: 'Heraklion', country: 'Greece', countryCode: 'GR', flightCode: 'HER', aliases: ['heraklion','iraklio','ηρακλειο','ηράκλειο'], summary: 'A practical base for Crete with archaeology, local food and access to the island.', highlights: ['Knossos','Old Harbour','Cretan food'], interests: ['culture','food','beach','family'], suggestedDays: { min: 2, max: 5 }, carUseful: true },
  { slug: 'chania', city: 'Chania', country: 'Greece', countryCode: 'GR', flightCode: 'CHQ', aliases: ['chania','hania','χανια','χανιά'], summary: 'Venetian harbour atmosphere with beaches, food and western Crete day trips.', highlights: ['Old Venetian Harbour','Old Town','West Crete beaches'], interests: ['romantic','food','beach','nature'], suggestedDays: { min: 3, max: 6 }, carUseful: true },
  { slug: 'santorini', city: 'Santorini', country: 'Greece', countryCode: 'GR', flightCode: 'JTR', aliases: ['santorini','thira','θηρα','θήρα','σαντορινη','σαντορίνη'], summary: 'Caldera views, compact villages and a strong romantic short-break profile.', highlights: ['Oia','Caldera','Fira'], interests: ['romantic','food','beach'], suggestedDays: { min: 2, max: 4 }, carUseful: false },
  { slug: 'mykonos', city: 'Mykonos', country: 'Greece', countryCode: 'GR', flightCode: 'JMK', aliases: ['mykonos','μυκονος','μύκονος'], summary: 'Beach-focused island break with nightlife, dining and compact sightseeing.', highlights: ['Chora','Little Venice','Beaches'], interests: ['nightlife','beach','romantic','food'], suggestedDays: { min: 2, max: 4 }, carUseful: false },
  { slug: 'rhodes', city: 'Rhodes', country: 'Greece', countryCode: 'GR', flightCode: 'RHO', aliases: ['rhodes','rodos','ροδος','ρόδος'], summary: 'Medieval city, beaches and a larger island footprint suited to mixed itineraries.', highlights: ['Medieval City','Lindos','Beaches'], interests: ['culture','beach','family','nature'], suggestedDays: { min: 3, max: 6 }, carUseful: true },
  { slug: 'thessaloniki', city: 'Thessaloniki', country: 'Greece', countryCode: 'GR', flightCode: 'SKG', aliases: ['thessaloniki','salonika','θεσσαλονικη','θεσσαλονίκη'], summary: 'Food-led city break with waterfront walks, history and nightlife.', highlights: ['Waterfront','Ano Poli','Food scene'], interests: ['food','culture','nightlife'], suggestedDays: { min: 2, max: 4 }, carUseful: false },
  { slug: 'rome', city: 'Rome', country: 'Italy', countryCode: 'IT', flightCode: 'FCO', aliases: ['rome','roma','ρωμη','ρώμη'], summary: 'A high-density culture and food destination where major sights fit naturally into a multi-day city break.', highlights: ['Colosseum','Vatican City','Historic centre'], interests: ['culture','food','romantic','family'], suggestedDays: { min: 3, max: 5 }, carUseful: false },
  { slug: 'milan', city: 'Milan', country: 'Italy', countryCode: 'IT', flightCode: 'MXP', aliases: ['milan','milano','μιλανο','μιλάνο'], summary: 'Design, shopping and culture with efficient transport and easy short-break planning.', highlights: ['Duomo','Brera','Navigli'], interests: ['shopping','culture','food','nightlife'], suggestedDays: { min: 2, max: 4 }, carUseful: false },
  { slug: 'venice', city: 'Venice', country: 'Italy', countryCode: 'IT', flightCode: 'VCE', aliases: ['venice','venezia','βενετια','βενετία'], summary: 'Walkable, romantic and distinctive, with sightseeing concentrated around the lagoon.', highlights: ['St Mark’s Square','Grand Canal','Rialto'], interests: ['romantic','culture','food'], suggestedDays: { min: 2, max: 4 }, carUseful: false },
  { slug: 'florence', city: 'Florence', country: 'Italy', countryCode: 'IT', flightCode: 'FLR', aliases: ['florence','firenze','φλωρεντια','φλωρεντία'], summary: 'Compact Renaissance city with strong art, food and walkable sightseeing.', highlights: ['Duomo','Uffizi','Ponte Vecchio'], interests: ['culture','food','romantic'], suggestedDays: { min: 2, max: 4 }, carUseful: false },
  { slug: 'naples', city: 'Naples', country: 'Italy', countryCode: 'IT', flightCode: 'NAP', aliases: ['naples','napoli','ναπολη','νάπολη'], summary: 'Energetic food and culture base with access to Pompeii and the Bay of Naples.', highlights: ['Historic centre','Pompeii access','Local food'], interests: ['food','culture','nature'], suggestedDays: { min: 2, max: 5 }, carUseful: false },
  { slug: 'paris', city: 'Paris', country: 'France', countryCode: 'FR', flightCode: 'CDG', aliases: ['paris','παρισι','παρίσι'], summary: 'Classic multi-day city break balancing culture, food, shopping and neighbourhood exploration.', highlights: ['Eiffel Tower','Louvre','Montmartre'], interests: ['culture','romantic','food','shopping'], suggestedDays: { min: 3, max: 6 }, carUseful: false },
  { slug: 'london', city: 'London', country: 'United Kingdom', countryCode: 'GB', flightCode: 'LHR', aliases: ['london','λονδινο','λονδίνο'], summary: 'Large, varied city with museums, neighbourhoods, shopping and nightlife requiring deliberate daily grouping.', highlights: ['Westminster','British Museum','West End'], interests: ['culture','shopping','family','nightlife','food'], suggestedDays: { min: 3, max: 6 }, carUseful: false },
  { slug: 'barcelona', city: 'Barcelona', country: 'Spain', countryCode: 'ES', flightCode: 'BCN', aliases: ['barcelona','βαρκελωνη','βαρκελώνη'], summary: 'Architecture, food, nightlife and beach access in a compact urban trip.', highlights: ['Sagrada Família','Gothic Quarter','Barceloneta'], interests: ['culture','food','nightlife','beach'], suggestedDays: { min: 3, max: 5 }, carUseful: false },
  { slug: 'madrid', city: 'Madrid', country: 'Spain', countryCode: 'ES', flightCode: 'MAD', aliases: ['madrid','μαδριτη','μαδρίτη'], summary: 'Art, food and nightlife with strong public transport and an easy city-break structure.', highlights: ['Prado','Retiro','Centro'], interests: ['culture','food','nightlife','shopping'], suggestedDays: { min: 2, max: 5 }, carUseful: false },
  { slug: 'lisbon', city: 'Lisbon', country: 'Portugal', countryCode: 'PT', flightCode: 'LIS', aliases: ['lisbon','lisboa','λισαβονα','λισαβόνα'], summary: 'Hillside neighbourhoods, food, viewpoints and easy day-trip potential.', highlights: ['Alfama','Belém','Viewpoints'], interests: ['food','culture','romantic','nightlife'], suggestedDays: { min: 3, max: 5 }, carUseful: false },
  { slug: 'berlin', city: 'Berlin', country: 'Germany', countryCode: 'DE', flightCode: 'BER', aliases: ['berlin','βερολινο','βερολίνο'], summary: 'History, contemporary culture and nightlife across a large but well-connected city.', highlights: ['Museum Island','Brandenburg Gate','Neighbourhood nightlife'], interests: ['culture','nightlife','food'], suggestedDays: { min: 3, max: 5 }, carUseful: false },
  { slug: 'amsterdam', city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', flightCode: 'AMS', aliases: ['amsterdam','αμστερνταμ','άμστερνταμ'], summary: 'Compact canal city suited to walking, museums and short urban breaks.', highlights: ['Canal ring','Museum quarter','Jordaan'], interests: ['culture','romantic','nightlife'], suggestedDays: { min: 2, max: 4 }, carUseful: false },
  { slug: 'vienna', city: 'Vienna', country: 'Austria', countryCode: 'AT', flightCode: 'VIE', aliases: ['vienna','wien','βιεννη','βιέννη'], summary: 'Classical culture, cafés and efficient transport make Vienna easy to structure.', highlights: ['Schönbrunn','Historic centre','Museums'], interests: ['culture','food','romantic'], suggestedDays: { min: 2, max: 4 }, carUseful: false },
  { slug: 'prague', city: 'Prague', country: 'Czechia', countryCode: 'CZ', flightCode: 'PRG', aliases: ['prague','praha','πραγα','πράγα'], summary: 'Walkable historic core with architecture, food and nightlife for a compact break.', highlights: ['Old Town','Charles Bridge','Prague Castle'], interests: ['culture','romantic','nightlife','food'], suggestedDays: { min: 2, max: 4 }, carUseful: false },
  { slug: 'budapest', city: 'Budapest', country: 'Hungary', countryCode: 'HU', flightCode: 'BUD', aliases: ['budapest','βουδαπεστη','βουδαπέστη'], summary: 'Thermal baths, river views, culture and nightlife in a strong-value city-break format.', highlights: ['Danube','Buda Castle','Thermal baths'], interests: ['culture','nightlife','romantic','food'], suggestedDays: { min: 2, max: 4 }, carUseful: false },
  { slug: 'brussels', city: 'Brussels', country: 'Belgium', countryCode: 'BE', flightCode: 'BRU', aliases: ['brussels','bruxelles','βρυξελλες','βρυξέλλες'], summary: 'Compact European capital with food, architecture and easy rail connections.', highlights: ['Grand Place','Sablon','European Quarter'], interests: ['food','culture'], suggestedDays: { min: 2, max: 3 }, carUseful: false },
  { slug: 'copenhagen', city: 'Copenhagen', country: 'Denmark', countryCode: 'DK', flightCode: 'CPH', aliases: ['copenhagen','kobenhavn','κοπεγχαγη','κοπεγχάγη'], summary: 'Design-led, bike-friendly city with food, waterfront and family attractions.', highlights: ['Nyhavn','Tivoli','Design districts'], interests: ['food','family','culture','romantic'], suggestedDays: { min: 2, max: 4 }, carUseful: false },
  { slug: 'dublin', city: 'Dublin', country: 'Ireland', countryCode: 'IE', flightCode: 'DUB', aliases: ['dublin','δουβλινο','δουβλίνο'], summary: 'Compact centre, pub culture, history and easy access to coastal day trips.', highlights: ['Trinity area','Temple Bar area','Coastal access'], interests: ['culture','nightlife','food','nature'], suggestedDays: { min: 2, max: 4 }, carUseful: false },
  { slug: 'zurich', city: 'Zurich', country: 'Switzerland', countryCode: 'CH', flightCode: 'ZRH', aliases: ['zurich','zuerich','ζυριχη','ζυρίχη'], summary: 'Compact lakeside city that works well as both a city break and a Swiss transport hub.', highlights: ['Old Town','Lake Zurich','Rail connections'], interests: ['nature','culture','shopping'], suggestedDays: { min: 2, max: 3 }, carUseful: false },
  { slug: 'istanbul', city: 'Istanbul', country: 'Türkiye', countryCode: 'TR', flightCode: 'IST', aliases: ['istanbul','constantinople','κωνσταντινουπολη','κωνσταντινούπολη'], summary: 'Large cross-continental city mixing landmark culture, food, shopping and neighbourhood exploration.', highlights: ['Sultanahmet','Bosphorus','Grand Bazaar'], interests: ['culture','food','shopping','romantic'], suggestedDays: { min: 3, max: 5 }, carUseful: false },
  { slug: 'dubai', city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', flightCode: 'DXB', aliases: ['dubai','ντουμπαι','ντουμπάι'], summary: 'Modern high-comfort destination combining shopping, attractions, beaches and desert activities.', highlights: ['Downtown','Dubai Marina','Desert activities'], interests: ['shopping','family','beach','premium'], suggestedDays: { min: 3, max: 5 }, carUseful: false },
  { slug: 'abu-dhabi', city: 'Abu Dhabi', country: 'United Arab Emirates', countryCode: 'AE', flightCode: 'AUH', aliases: ['abu dhabi','αμπου νταμπι','άμπου ντάμπι'], summary: 'Culture, beaches and major attractions spread across a lower-density capital.', highlights: ['Sheikh Zayed Grand Mosque','Saadiyat','Yas Island'], interests: ['culture','family','beach','premium'], suggestedDays: { min: 2, max: 4 }, carUseful: true },
  { slug: 'new-york', city: 'New York', country: 'United States', countryCode: 'US', flightCode: 'JFK', aliases: ['new york','nyc','νεα υορκη','νέα υόρκη'], summary: 'Dense, high-energy multi-day city trip with culture, food, shopping and neighbourhood variety.', highlights: ['Manhattan','Museums','Neighbourhoods'], interests: ['culture','food','shopping','nightlife','family'], suggestedDays: { min: 4, max: 7 }, carUseful: false },
  { slug: 'los-angeles', city: 'Los Angeles', country: 'United States', countryCode: 'US', flightCode: 'LAX', aliases: ['los angeles','los angeles ca','λος αντζελες','λος άντζελες'], summary: 'Large, spread-out destination where neighbourhood choice and transport planning matter.', highlights: ['Hollywood','Santa Monica','Arts districts'], interests: ['beach','shopping','food','family'], suggestedDays: { min: 4, max: 7 }, carUseful: true },
  { slug: 'miami', city: 'Miami', country: 'United States', countryCode: 'US', flightCode: 'MIA', aliases: ['miami','μαιαμι','μαϊάμι'], summary: 'Beach, nightlife, food and neighbourhoods with optional wider South Florida exploration.', highlights: ['South Beach','Wynwood','Little Havana'], interests: ['beach','nightlife','food','shopping'], suggestedDays: { min: 3, max: 5 }, carUseful: true },
  { slug: 'singapore', city: 'Singapore', country: 'Singapore', countryCode: 'SG', flightCode: 'SIN', aliases: ['singapore','σιγκαπουρη','σιγκαπούρη'], summary: 'Highly connected city-state with food, attractions and efficient short-stay logistics.', highlights: ['Marina Bay','Hawker centres','Gardens'], interests: ['food','family','shopping','culture'], suggestedDays: { min: 3, max: 5 }, carUseful: false },
  { slug: 'tokyo', city: 'Tokyo', country: 'Japan', countryCode: 'JP', flightCode: 'HND', aliases: ['tokyo','τοκιο','τόκιο'], summary: 'Large, layered city where neighbourhood-based planning improves food, culture and shopping days.', highlights: ['Shibuya','Asakusa','Shinjuku'], interests: ['food','culture','shopping','family','nightlife'], suggestedDays: { min: 4, max: 7 }, carUseful: false },
  { slug: 'bangkok', city: 'Bangkok', country: 'Thailand', countryCode: 'TH', flightCode: 'BKK', aliases: ['bangkok','μπανγκοκ','μπάνγκοκ'], summary: 'Food, temples, shopping and nightlife with strong value across a busy urban itinerary.', highlights: ['Old City','Riverside','Markets'], interests: ['food','culture','shopping','nightlife'], suggestedDays: { min: 3, max: 5 }, carUseful: false }
];

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function searchable(value: string) {
  return ` ${normalizeText(value).replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim()} `;
}

function aliasIndex(text: string, alias: string) {
  const needle = searchable(alias);
  const index = text.indexOf(needle);
  return index < 0 ? -1 : index;
}

export function getDestinationBySlug(slug: string) {
  return DESTINATIONS.find((destination) => destination.slug === slug);
}

export function resolveDestination(value?: string): DestinationProfile | undefined {
  if (!value?.trim()) return undefined;
  const directCode = value.trim().toUpperCase().match(/\b[A-Z]{3}\b/);
  if (directCode) return DESTINATIONS.find((destination) => destination.flightCode === directCode[0]);

  const text = searchable(value);
  return DESTINATIONS.find((destination) =>
    [destination.city, ...destination.aliases].some((alias) => aliasIndex(text, alias) >= 0)
  );
}

export function destinationsMentioned(value: string) {
  const text = searchable(value);
  return DESTINATIONS.flatMap((destination) => {
    let index = -1;
    for (const alias of [destination.city, ...destination.aliases]) {
      const next = aliasIndex(text, alias);
      if (next >= 0 && (index < 0 || next < index)) index = next;
    }
    return index >= 0 ? [{ destination, index }] : [];
  }).sort((a, b) => a.index - b.index).map((entry) => entry.destination);
}
