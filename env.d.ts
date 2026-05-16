/// <reference types="@shopify/app" />
/// <reference types="@shopify/shopify-api" />

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    gtmInitialized?: boolean;
    gtmTrackingConfig?: GTMTrackingConfig;
    Shopify?: {
      customerPrivacy?: {
        trackingConsentMetafield: () => Promise<{
          analyticsProcessingAllowed: boolean;
          marketingAllowed: boolean;
          preferencesProcessingAllowed: boolean;
          saleOfDataAllowed: boolean;
        }>;
      };
      shop?: string;
      currency?: string;
    };
  }

  interface GTMTrackingConfig {
    containerId: string;
    enabled: boolean;
    debugMode: boolean;
    consentMode: boolean;
    events: {
      pageView: boolean;
      productView: boolean;
      addToCart: boolean;
      removeFromCart: boolean;
      beginCheckout: boolean;
      purchase: boolean;
      search: boolean;
      userEvents: boolean;
    };
    pixels: {
      ga4: boolean;
      meta: boolean;
      tiktok: boolean;
      pinterest: boolean;
    };
  }

  interface GA4Item {
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
    item_variant?: string;
    location_id?: string;
    price: number;
    quantity?: number;
  }

  interface GA4EcommerceEvent {
    event: string;
    ecommerce: {
      transaction_id?: string;
      value?: number;
      tax?: number;
      shipping?: number;
      currency?: string;
      coupon?: string;
      items: GA4Item[];
    };
  }
}

export {};
