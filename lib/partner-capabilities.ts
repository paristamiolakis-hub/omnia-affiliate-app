export type PartnerDataMode = 'deeplink' | 'api' | 'feed';

export interface PartnerCapability {
  partnerId: string;
  dataMode: PartnerDataMode;
  searchRedirect: boolean;
  livePrice: boolean;
  liveAvailability: boolean;
  conversionPostback: boolean;
  requiredConfig: string[];
  notes: string;
}

export const PARTNER_CAPABILITIES: PartnerCapability[] = [
  { partnerId: 'booking', dataMode: 'deeplink', searchRedirect: true, livePrice: false, liveAvailability: false, conversionPostback: false, requiredConfig: ['NEXT_PUBLIC_BOOKING_AID'], notes: 'Tracked hotel search deeplinks only. Live inventory requires a separate approved data integration.' },
  { partnerId: 'agoda', dataMode: 'deeplink', searchRedirect: true, livePrice: false, liveAvailability: false, conversionPostback: false, requiredConfig: ['NEXT_PUBLIC_AGODA_AFFID'], notes: 'Tracked hotel search deeplinks only.' },
  { partnerId: 'hotelscom', dataMode: 'deeplink', searchRedirect: true, livePrice: false, liveAvailability: false, conversionPostback: false, requiredConfig: ['NEXT_PUBLIC_HOTELSCOM_PID'], notes: 'Tracked hotel search deeplinks only.' },
  { partnerId: 'rentalcars', dataMode: 'deeplink', searchRedirect: true, livePrice: false, liveAvailability: false, conversionPostback: false, requiredConfig: ['NEXT_PUBLIC_RENTALCARS_CODE'], notes: 'Tracked car-rental search deeplinks only.' },
  { partnerId: 'skyscanner', dataMode: 'deeplink', searchRedirect: true, livePrice: false, liveAvailability: false, conversionPostback: false, requiredConfig: ['NEXT_PUBLIC_SKYSCANNER_PID'], notes: 'Flight-search deeplinks only. No fare is treated as live until a data adapter supplies it.' },
  { partnerId: 'getyourguide', dataMode: 'deeplink', searchRedirect: true, livePrice: false, liveAvailability: false, conversionPostback: false, requiredConfig: ['NEXT_PUBLIC_GETYOURGUIDE_AFFID'], notes: 'Activity-search deeplinks only.' },
  { partnerId: 'amazon', dataMode: 'deeplink', searchRedirect: true, livePrice: false, liveAvailability: false, conversionPostback: false, requiredConfig: ['NEXT_PUBLIC_AMAZON_TAG'], notes: 'Product query forwarding only. Omnia does not ingest product price, stock or reviews.' },
  { partnerId: 'revolut', dataMode: 'deeplink', searchRedirect: true, livePrice: false, liveAvailability: false, conversionPostback: false, requiredConfig: ['NEXT_PUBLIC_REVOLUT_CAMPAIGN_ID'], notes: 'Referral deeplink only. Eligibility, fees and terms remain provider-side.' }
];

const CAPABILITY_BY_ID = new Map(PARTNER_CAPABILITIES.map((item) => [item.partnerId, item]));

export function getPartnerCapability(partnerId: string) {
  return CAPABILITY_BY_ID.get(partnerId);
}

export function partnerConfigStatus(partnerId: string, env: NodeJS.ProcessEnv = process.env) {
  const capability = getPartnerCapability(partnerId);
  if (!capability) return { known: false, configured: false, missing: [] as string[] };
  const missing = capability.requiredConfig.filter((key) => !(env[key] || '').trim());
  return { known: true, configured: missing.length === 0, missing };
}

export interface LivePartnerSearchInput {
  country: string;
  query?: string;
  originIata?: string;
  destinationIata?: string;
  checkin?: string;
  checkout?: string;
  travelers?: number;
  currency?: string;
}

export interface LivePartnerQuote {
  partnerId: string;
  externalId: string;
  title: string;
  currency: string;
  totalPrice: number;
  deeplink: string;
  available: boolean;
  fetchedAt: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface PartnerSearchAdapter {
  partnerId: string;
  mode: Exclude<PartnerDataMode, 'deeplink'>;
  search(input: LivePartnerSearchInput): Promise<LivePartnerQuote[]>;
}

export function assertLiveQuote(quote: LivePartnerQuote) {
  if (!quote.partnerId || !quote.externalId || !quote.title) throw new Error('Live quote identity is incomplete.');
  if (!Number.isFinite(quote.totalPrice) || quote.totalPrice < 0) throw new Error('Live quote price must be a finite non-negative number.');
  if (!/^[A-Z]{3}$/.test(quote.currency)) throw new Error('Live quote currency must be a three-letter code.');
  const url = new URL(quote.deeplink);
  if (url.protocol !== 'https:') throw new Error('Live quote deeplink must use HTTPS.');
  if (!Number.isFinite(Date.parse(quote.fetchedAt))) throw new Error('Live quote fetchedAt must be a valid timestamp.');
  return quote;
}
