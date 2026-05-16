import { prisma } from './db.server';
import type { ShopSettings, TrackingEvent, GA4Item } from '~/types';

export async function getShopSettings(shopId: string): Promise<ShopSettings | null> {
  const settings = await prisma.shopSettings.findUnique({
    where: { shopId },
  });

  if (!settings) return null;

  return {
    ...settings,
    eventsConfig: settings.eventsConfig as ShopSettings['eventsConfig'],
    pixelConfig: settings.pixelConfig as ShopSettings['pixelConfig'],
    consentConfig: settings.consentConfig as ShopSettings['consentConfig'],
    dataLayerConfig: settings.dataLayerConfig as ShopSettings['dataLayerConfig'],
    serverSideConfig: settings.serverSideConfig as ShopSettings['serverSideConfig'] || undefined,
  } as ShopSettings;
}

export async function updateShopSettings(
  shopId: string,
  data: Partial<ShopSettings>
): Promise<ShopSettings> {
  const settings = await prisma.shopSettings.upsert({
    where: { shopId },
    create: {
      shopId,
      ...data,
      eventsConfig: data.eventsConfig || {},
      pixelConfig: data.pixelConfig || {},
      consentConfig: data.consentConfig || {},
      dataLayerConfig: data.dataLayerConfig || {},
    },
    update: data,
  });

  return {
    ...settings,
    eventsConfig: settings.eventsConfig as ShopSettings['eventsConfig'],
    pixelConfig: settings.pixelConfig as ShopSettings['pixelConfig'],
    consentConfig: settings.consentConfig as ShopSettings['consentConfig'],
    dataLayerConfig: settings.dataLayerConfig as ShopSettings['dataLayerConfig'],
  } as ShopSettings;
}

export async function logTrackingEvent(
  shopId: string,
  eventName: string,
  payload: Record<string, any>,
  options: {
    eventType?: 'web' | 'server' | 'pixel';
    clientId?: string;
    sessionId?: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<TrackingEvent> {
  const event = await prisma.trackingEvent.create({
    data: {
      shopId,
      eventName,
      eventType: options.eventType || 'web',
      payload,
      status: 'PENDING',
      attempts: 0,
      clientId: options.clientId,
      sessionId: options.sessionId,
      userId: options.userId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    },
  });

  return event as TrackingEvent;
}

export async function updateEventStatus(
  eventId: string,
  status: 'SENT' | 'FAILED' | 'RETRY',
  errorMessage?: string
): Promise<void> {
  await prisma.trackingEvent.update({
    where: { id: eventId },
    data: {
      status,
      errorMessage,
      sentAt: status === 'SENT' ? new Date() : undefined,
      attempts: { increment: 1 },
    },
  });
}

export function formatGA4Item(shopifyItem: any): GA4Item {
  return {
    item_id: shopifyItem.variant_id || shopifyItem.id,
    item_name: shopifyItem.title || shopifyItem.product_title,
    item_brand: shopifyItem.vendor,
    item_category: shopifyItem.product_type,
    item_variant: shopifyItem.variant_title,
    price: parseFloat(shopifyItem.price) || 0,
    quantity: shopifyItem.quantity || 1,
    ...(shopifyItem.sku && { item_id: shopifyItem.sku }),
  };
}

export function formatGA4Items(items: any[]): GA4Item[] {
  return items.map((item, index) => ({
    ...formatGA4Item(item),
    index,
  }));
}

export function validateGTMContainerId(containerId: string): boolean {
  return /^GTM-[A-Z0-9]{4,}$/.test(containerId);
}

export function generateDataLayerScript(
  settings: ShopSettings,
  shopData: { domain: string; currency: string }
): string {
  const dataLayerConfig = settings.dataLayerConfig || {};
  
  return `
window.dataLayer = window.dataLayer || [];
window.gtmTrackingConfig = {
  containerId: '${settings.gtmContainerId || ''}',
  enabled: ${settings.enabled},
  debugMode: ${settings.debugMode},
  consentMode: ${settings.consentMode},
  shopDomain: '${shopData.domain}',
  currency: '${shopData.currency}',
  events: ${JSON.stringify(settings.eventsConfig || {})},
  pixels: ${JSON.stringify(settings.pixelConfig || {})},
  dataLayerConfig: ${JSON.stringify(dataLayerConfig)}
};

// Initialize consent state
window.dataLayer.push({
  event: 'gtm.init_consent',
  consent: ${settings.consentMode ? `'${settings.consentConfig?.defaultConsent || 'denied'}'` : `'granted'`}
});

// Push initial configuration
dataLayer.push({
  event: 'gtm.config',
  shopDomain: '${shopData.domain}',
  currency: '${shopData.currency}',
  timestamp: new Date().toISOString()
});
`;
}

export async function getShopByDomain(shopDomain: string) {
  return prisma.shop.findUnique({
    where: { shopifyDomain: shopDomain },
    include: { settings: true },
  });
}

export async function validateShopAccess(
  shopDomain: string,
  sessionToken?: string
): Promise<boolean> {
  const shop = await getShopByDomain(shopDomain);
  if (!shop) return false;
  if (!shop.isActive) return false;
  return true;
}
