import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { prisma } from '~/lib/db.server';
import { logTrackingEvent, getShopByDomain, validateGTMContainerId } from '~/lib/gtm.server';
import { getClientIP, parseUserAgent } from '~/lib/utils';
import { ServerSideTrackingService } from '~/services/server-side-tracking';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json();
    const { event, payload, shopDomain, containerId } = body;

    if (!event || !shopDomain) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate shop
    const shop = await getShopByDomain(shopDomain);
    if (!shop || !shop.isActive) {
      return json({ error: 'Shop not found or inactive' }, { status: 404 });
    }

    // Log event
    const clientInfo = parseUserAgent(request.headers.get('user-agent') || '');
    
    const trackingEvent = await logTrackingEvent(
      shop.id,
      event,
      payload,
      {
        eventType: 'web',
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') || undefined,
      }
    );

    // Server-side tracking if enabled
    if (shop.settings?.serverSideTracking) {
      const ssService = new ServerSideTrackingService(shop.settings);
      await ssService.sendEvent(event, payload);
    }

    return json({
      success: true,
      eventId: trackingEvent.id,
    });

  } catch (error) {
    console.error('[Tracking API] Error:', error);
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shopDomain = url.searchParams.get('shop');
  
  if (!shopDomain) {
    return json({ error: 'Missing shop parameter' }, { status: 400 });
  }

  const shop = await getShopByDomain(shopDomain);
  if (!shop) {
    return json({ error: 'Shop not found' }, { status: 404 });
  }

  return json({
    shop: {
      domain: shop.shopifyDomain,
      isActive: shop.isActive,
    },
    settings: shop.settings ? {
      enabled: shop.settings.enabled,
      debugMode: shop.settings.debugMode,
      consentMode: shop.settings.consentMode,
      gtmContainerId: shop.settings.gtmContainerId,
      ga4MeasurementId: shop.settings.ga4MeasurementId,
      metaPixelId: shop.settings.metaPixelId,
      tiktokPixelId: shop.settings.tiktokPixelId,
      pinterestTagId: shop.settings.pinterestTagId,
    } : null,
  });
}
