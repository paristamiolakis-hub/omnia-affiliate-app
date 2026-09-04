import { NextResponse } from 'next/server';
import { PARTNER_CAPABILITIES, partnerConfigStatus } from '../../../../lib/partner-capabilities';

export const runtime = 'edge';

export async function GET() {
  const partners = PARTNER_CAPABILITIES.map((capability) => {
    const config = partnerConfigStatus(capability.partnerId);
    return {
      partnerId: capability.partnerId,
      dataMode: capability.dataMode,
      searchRedirect: capability.searchRedirect,
      livePrice: capability.livePrice,
      liveAvailability: capability.liveAvailability,
      conversionPostback: capability.conversionPostback,
      configured: config.configured,
      missingConfig: config.missing,
      notes: capability.notes
    };
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    partners,
    liveComparisonReady: partners.some((partner) => partner.livePrice && partner.liveAvailability)
  });
}
