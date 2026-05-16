export interface Shop {
  id: string;
  shopifyDomain: string;
  name: string;
  email: string;
  plan: string;
  currency: string;
  timezone: string;
  country: string;
  installedAt: Date;
  updatedAt: Date;
  isActive: boolean;
  accessToken?: string;
  settings?: ShopSettings;
}

export interface ShopSettings {
  id: string;
  shopId: string;
  gtmContainerId: string | null;
  gtmAuth: string | null;
  gtmPreview: string | null;
  enabled: boolean;
  debugMode: boolean;
  consentMode: boolean;
  serverSideTracking: boolean;
  events: EventSettings;
  pixels: PixelSettings;
  consent: ConsentSettings;
  dataLayerConfig: DataLayerConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventSettings {
  pageView: boolean;
  productView: boolean;
  collectionView: boolean;
  addToCart: boolean;
  removeFromCart: boolean;
  cartView: boolean;
  beginCheckout: boolean;
  addShippingInfo: boolean;
  addPaymentInfo: boolean;
  purchase: boolean;
  refund: boolean;
  search: boolean;
  login: boolean;
  signUp: boolean;
  generateLead: boolean;
  addToWishlist: boolean;
  share: boolean;
  customizeProduct: boolean;
  selectItem: boolean;
  selectPromotion: boolean;
  viewPromotion: boolean;
}

export interface PixelSettings {
  ga4: boolean;
  meta: boolean;
  tiktok: boolean;
  pinterest: boolean;
  snapchat: boolean;
  twitter: boolean;
  linkedin: boolean;
}

export interface ConsentSettings {
  defaultConsent: 'granted' | 'denied';
  gdprEnabled: boolean;
  ccpaEnabled: boolean;
  waitForUpdate: number;
  regions: string[];
  adsDataRedaction: boolean;
  urlPassthrough: boolean;
}

export interface DataLayerConfig {
  prefix: string;
  customDimensions: Record<string, string>;
  userProperties: string[];
  enhancedEcommerce: boolean;
  sendToGA4: boolean;
  sendToUA: boolean;
}

export interface TrackingEvent {
  id: string;
  shopId: string;
  eventName: string;
  eventType: 'web' | 'server' | 'pixel';
  payload: Record<string, any>;
  status: 'pending' | 'sent' | 'failed' | 'retry';
  attempts: number;
  errorMessage?: string;
  createdAt: Date;
  sentAt?: Date;
  clientId?: string;
  sessionId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DebugLog {
  id: string;
  shopId: string;
  eventName: string;
  dataLayerPayload: Record<string, any>;
  timestamp: Date;
  status: 'success' | 'error' | 'warning';
  message?: string;
  stackTrace?: string;
  clientInfo?: {
    userAgent: string;
    url: string;
    referrer: string;
  };
}

export interface WebhookLog {
  id: string;
  shopId: string;
  topic: string;
  payload: Record<string, any>;
  processedAt: Date;
  status: 'success' | 'error' | 'pending';
  errorMessage?: string;
}

export interface ConsentLog {
  id: string;
  shopId: string;
  customerId?: string;
  consent: {
    analytics: boolean;
    marketing: boolean;
    preferences: boolean;
    saleOfData: boolean;
  };
  timestamp: Date;
  source: 'web' | 'api' | 'admin';
  region?: string;
}

export interface GA4PurchaseEvent {
  transaction_id: string;
  value: number;
  tax?: number;
  shipping?: number;
  currency: string;
  coupon?: string;
  items: GA4Item[];
}

export interface GA4Item {
  item_id: string;
  item_name: string;
  affiliation?: string;
  coupon?: string;
  discount?: number;
  index?: number;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_category4?: string;
  item_category5?: string;
  item_list_id?: string;
  item_list_name?: string;
  item_variant?: string;
  location_id?: string;
  price: number;
  quantity?: number;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  vendor?: string;
  product_type?: string;
  variants: ShopifyVariant[];
  price: string;
  compare_at_price?: string;
  image?: string;
  images: string[];
  tags: string[];
  collections: string[];
  featured_image?: string;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  sku?: string;
  price: string;
  compare_at_price?: string;
  inventory_quantity: number;
  options: Record<string, string>;
  featured_image?: string;
}

export interface ShopifyLineItem {
  id: string;
  product_id: string;
  variant_id: string;
  title: string;
  quantity: number;
  price: string;
  final_price: string;
  sku?: string;
  vendor?: string;
  variant_title?: string;
  grams: number;
}

export interface ServerSideEvent {
  event_name: string;
  event_time: string;
  event_source_url?: string;
  user_data: {
    client_user_agent?: string;
    client_ip_address?: string;
    em?: string;
    ph?: string;
    external_id?: string;
    fbc?: string;
    fbp?: string;
    subscription_id?: string;
  };
  custom_data: Record<string, any>;
  action_source: 'website' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
}

export interface TikTokEvent {
  event_type: string;
  event_time: number;
  user: {
    external_id?: string;
    email?: string;
    phone?: string;
    ttp?: string;
    ip?: string;
    user_agent?: string;
  };
  properties: Record<string, any>;
  page?: {
    url?: string;
    referrer?: string;
  };
}
