import { prisma } from '~/lib/db.server';

interface ConsentData {
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  saleOfData: boolean;
}

export class GDPRConsentService {
  private shopId: string;

  constructor(shopId: string) {
    this.shopId = shopId;
  }

  async getConsent(customerId?: string): Promise<ConsentData | null> {
    if (customerId) {
      // Get customer-specific consent
      const log = await prisma.consentLog.findFirst({
        where: {
          shopId: this.shopId,
          customerId,
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      if (log) {
        return log.consent as ConsentData;
      }
    }

    // Return default consent settings
    const settings = await prisma.shopSettings.findUnique({
      where: { shopId: this.shopId },
    });

    if (settings?.consentConfig) {
      const config = settings.consentConfig as any;
      const defaultConsent = config.defaultConsent || 'denied';
      const granted = defaultConsent === 'granted';

      return {
        analytics: granted,
        marketing: granted,
        preferences: granted,
        saleOfData: granted,
      };
    }

    // Default to denied for safety
    return {
      analytics: false,
      marketing: false,
      preferences: false,
      saleOfData: false,
    };
  }

  async updateConsent(
    consent: ConsentData,
    customerId?: string,
    source: 'web' | 'api' | 'admin' = 'web',
    region?: string
  ): Promise<void> {
    await prisma.consentLog.create({
      data: {
        shopId: this.shopId,
        customerId,
        consent,
        source,
        region,
      },
    });

    // Update customer privacy settings if needed
    if (customerId) {
      // Additional logic to update customer privacy settings in Shopify
    }
  }

  async hasConsent(type: keyof ConsentData, customerId?: string): Promise<boolean> {
    const consent = await this.getConsent(customerId);
    if (!consent) return false;
    return consent[type];
  }

  async validateConsentForRegion(region: string): Promise<boolean> {
    const settings = await prisma.shopSettings.findUnique({
      where: { shopId: this.shopId },
    });

    if (!settings?.consentConfig) return false;

    const config = settings.consentConfig as any;
    const regions = config.regions || [];

    // If no specific regions configured, require consent everywhere
    if (regions.length === 0) return true;

    // Check if region requires consent
    return regions.includes(region.toUpperCase());
  }

  generateConsentScript(): string {
    return `
(function() {
  'use strict';

  // Default consent state
  const defaultConsent = {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted'
  };

  // Initialize dataLayer with consent
  window.dataLayer = window.dataLayer || [];
  
  function gtag() {
    window.dataLayer.push(arguments);
  }

  // Set default consent
  gtag('consent', 'default', defaultConsent);

  // Consent update function
  window.updateGTMConsent = function(consent) {
    const consentState = {
      analytics_storage: consent.analytics ? 'granted' : 'denied',
      ad_storage: consent.marketing ? 'granted' : 'denied',
      ad_user_data: consent.marketing ? 'granted' : 'denied',
      ad_personalization: consent.marketing ? 'granted' : 'denied',
      functionality_storage: consent.preferences ? 'granted' : 'denied',
      personalization_storage: consent.preferences ? 'granted' : 'denied',
    };

    gtag('consent', 'update', consentState);

    // Send to backend
    fetch('/apps/gtm-tracking/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      }),
    }).catch(console.error);
  };

  // Check for existing consent
  const savedConsent = localStorage.getItem('gtm_consent');
  if (savedConsent) {
    try {
      const consent = JSON.parse(savedConsent);
      window.updateGTMConsent(consent);
    } catch (e) {
      console.error('Error parsing saved consent:', e);
    }
  }

  // Listen for Shopify Customer Privacy API
  if (window.Shopify && window.Shopify.customerPrivacy) {
    window.Shopify.customerPrivacy.trackingConsentMetafield().then(function(consent) {
      window.updateGTMConsent({
        analytics: consent.analyticsProcessingAllowed,
        marketing: consent.marketingAllowed,
        preferences: consent.preferencesProcessingAllowed,
        saleOfData: consent.saleOfDataAllowed
      });
    });
  }
})();
`;
  }

  // Generate Google Consent Mode v2 script
  generateConsentModeV2Script(): string {
    return `
<!-- Google Consent Mode v2 -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }

  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'analytics_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'wait_for_update': 500
  });

  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', true);
</script>
`;
  }
}
