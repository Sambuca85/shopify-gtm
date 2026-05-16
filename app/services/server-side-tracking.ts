import type { ShopSettings } from '~/types';
import crypto from 'crypto';

interface ServerSideEvent {
  event_name: string;
  event_time: number;
  event_id?: string;
  user_data: {
    client_ip_address?: string;
    client_user_agent?: string;
    em?: string;
    ph?: string;
    external_id?: string;
    fbc?: string;
    fbp?: string;
    ct?: string;
    st?: string;
    country?: string;
    zp?: string;
  };
  custom_data: Record<string, any>;
  action_source: 'website';
  event_source_url?: string;
}

interface TikTokEvent {
  event_type: string;
  event_time: number;
  event_id?: string;
  user: {
    external_id?: string;
    email?: string;
    phone?: string;
    ttp?: string;
    ip?: string;
    user_agent?: string;
    locale?: string;
  };
  properties: Record<string, any>;
  page?: {
    url?: string;
    referrer?: string;
  };
}

export class ServerSideTrackingService {
  private settings: ShopSettings;

  constructor(settings: ShopSettings) {
    this.settings = settings;
  }

  async sendEvent(eventName: string, payload: Record<string, any>): Promise<void> {
    const promises: Promise<void>[] = [];

    // Meta CAPI
    if (this.settings.metaAccessToken && this.settings.metaPixelId) {
      promises.push(this.sendMetaEvent(eventName, payload));
    }

    // TikTok Events API
    if (this.settings.tiktokAccessToken && this.settings.tiktokPixelId) {
      promises.push(this.sendTikTokEvent(eventName, payload));
    }

    // GA4 Measurement Protocol
    if (this.settings.ga4MeasurementId) {
      promises.push(this.sendGA4Event(eventName, payload));
    }

    await Promise.allSettled(promises);
  }

  private async sendMetaEvent(eventName: string, payload: Record<string, any>): Promise<void> {
    const pixelId = this.settings.metaPixelId;
    const accessToken = this.settings.metaAccessToken;
    
    if (!pixelId || !accessToken) return;

    const eventData: ServerSideEvent = {
      event_name: this.mapEventNameToMeta(eventName),
      event_time: Math.floor(Date.now() / 1000),
      event_id: payload.event_id || crypto.randomUUID(),
      user_data: {
        client_ip_address: payload.client_ip,
        client_user_agent: payload.user_agent,
        ...(payload.email && { em: this.hashData(payload.email) }),
        ...(payload.phone && { ph: this.hashData(payload.phone) }),
        ...(payload.customer_id && { external_id: this.hashData(payload.customer_id) }),
        ...(payload.fbc && { fbc: payload.fbc }),
        ...(payload.fbp && { fbp: payload.fbp }),
      },
      custom_data: this.formatMetaCustomData(eventName, payload),
      action_source: 'website',
      event_source_url: payload.page_url,
    };

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: [eventData],
            ...(this.settings.metaTestEventCode && { test_event_code: this.settings.metaTestEventCode }),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[Meta CAPI] Error:', error);
      }
    } catch (error) {
      console.error('[Meta CAPI] Failed to send event:', error);
    }
  }

  private async sendTikTokEvent(eventName: string, payload: Record<string, any>): Promise<void> {
    const pixelId = this.settings.tiktokPixelId;
    const accessToken = this.settings.tiktokAccessToken;
    
    if (!pixelId || !accessToken) return;

    const eventData: TikTokEvent = {
      event_type: this.mapEventNameToTikTok(eventName),
      event_time: Math.floor(Date.now() / 1000),
      event_id: payload.event_id || crypto.randomUUID(),
      user: {
        ...(payload.email && { email: this.hashData(payload.email) }),
        ...(payload.phone && { phone: this.hashData(payload.phone) }),
        ...(payload.customer_id && { external_id: this.hashData(payload.customer_id) }),
        ...(payload.ttp && { ttp: payload.ttp }),
        ...(payload.client_ip && { ip: payload.client_ip }),
        ...(payload.user_agent && { user_agent: payload.user_agent }),
      },
      properties: this.formatTikTokProperties(eventName, payload),
      page: {
        url: payload.page_url,
        referrer: payload.referrer,
      },
    };

    try {
      const response = await fetch(
        `https://business-api.tiktok.com/open_api/v1.3/event/track/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Access-Token': accessToken,
          },
          body: JSON.stringify({
            event_source: 'web',
            event_source_id: pixelId,
            data: [eventData],
            ...(this.settings.tiktokTestEventCode && { test_event_code: this.settings.tiktokTestEventCode }),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[TikTok Events API] Error:', error);
      }
    } catch (error) {
      console.error('[TikTok Events API] Failed to send event:', error);
    }
  }

  private async sendGA4Event(eventName: string, payload: Record<string, any>): Promise<void> {
    const measurementId = this.settings.ga4MeasurementId;
    // Note: GA4 Measurement Protocol requires an API secret which should be stored securely
    const apiSecret = process.env.GA4_API_SECRET;
    
    if (!measurementId || !apiSecret) return;

    const eventData = {
      client_id: payload.client_id || 'anonymous',
      events: [
        {
          name: eventName,
          params: {
            ...this.formatGA4Params(eventName, payload),
            session_id: payload.session_id,
            timestamp_micros: Date.now() * 1000,
          },
        },
      ],
      user_properties: payload.user_properties,
    };

    try {
      const response = await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
        {
          method: 'POST',
          body: JSON.stringify(eventData),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[GA4 Measurement Protocol] Error:', error);
      }
    } catch (error) {
      console.error('[GA4 Measurement Protocol] Failed to send event:', error);
    }
  }

  private mapEventNameToMeta(eventName: string): string {
    const eventMap: Record<string, string> = {
      'page_view': 'PageView',
      'view_item': 'ViewContent',
      'view_item_list': 'ViewContent',
      'add_to_cart': 'AddToCart',
      'begin_checkout': 'InitiateCheckout',
      'purchase': 'Purchase',
      'search': 'Search',
      'complete_registration': 'CompleteRegistration',
      'contact': 'Contact',
      'customize_product': 'CustomizeProduct',
      'donate': 'Donate',
      'find_location': 'FindLocation',
      'schedule': 'Schedule',
      'start_trial': 'StartTrial',
      'submit_application': 'SubmitApplication',
      'subscribe': 'Subscribe',
    };

    return eventMap[eventName] || 'CustomEvent';
  }

  private mapEventNameToTikTok(eventName: string): string {
    const eventMap: Record<string, string> = {
      'page_view': 'Browse',
      'view_item': 'ViewContent',
      'view_item_list': 'ViewContent',
      'add_to_cart': 'AddToCart',
      'begin_checkout': 'InitiateCheckout',
      'purchase': 'CompletePayment',
      'search': 'Search',
      'complete_registration': 'CompleteRegistration',
      'add_payment_info': 'AddPaymentInfo',
      'add_to_wishlist': 'AddToWishlist',
      'click_button': 'ClickButton',
      'contact': 'Contact',
      'download': 'Download',
      'submit_form': 'SubmitForm',
      'subscribe': 'Subscribe',
    };

    return eventMap[eventName] || eventName;
  }

  private formatMetaCustomData(eventName: string, payload: Record<string, any>): Record<string, any> {
    const customData: Record<string, any> = {
      content_type: 'product',
    };

    if (payload.ecommerce) {
      const { ecommerce } = payload;
      
      if (ecommerce.items) {
        customData.contents = ecommerce.items.map((item: any) => ({
          id: item.item_id || item.id,
          quantity: item.quantity || 1,
          item_price: item.price,
        }));
        customData.content_ids = ecommerce.items.map((item: any) => item.item_id || item.id);
        customData.num_items = ecommerce.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
      }

      if (ecommerce.value) {
        customData.value = ecommerce.value;
        customData.currency = ecommerce.currency || 'USD';
      }

      if (ecommerce.coupon) {
        customData.coupon = ecommerce.coupon;
      }
    }

    return customData;
  }

  private formatTikTokProperties(eventName: string, payload: Record<string, any>): Record<string, any> {
    const properties: Record<string, any> = {
      event_channel: 'web',
    };

    if (payload.ecommerce) {
      const { ecommerce } = payload;

      if (ecommerce.items) {
        properties.contents = ecommerce.items.map((item: any) => ({
          content_id: item.item_id || item.id,
          content_type: 'product',
          content_name: item.item_name || item.title,
          quantity: item.quantity || 1,
          price: item.price,
        }));
      }

      if (ecommerce.value) {
        properties.value = ecommerce.value;
        properties.currency = ecommerce.currency || 'USD';
      }

      if (ecommerce.query) {
        properties.query = ecommerce.query;
      }
    }

    return properties;
  }

  private formatGA4Params(eventName: string, payload: Record<string, any>): Record<string, any> {
    const params: Record<string, any> = {};

    if (payload.ecommerce) {
      const { ecommerce } = payload;

      if (ecommerce.items) {
        params.items = ecommerce.items;
      }

      if (ecommerce.value !== undefined) {
        params.value = ecommerce.value;
      }

      if (ecommerce.currency) {
        params.currency = ecommerce.currency;
      }

      if (ecommerce.transaction_id) {
        params.transaction_id = ecommerce.transaction_id;
      }

      if (ecommerce.coupon) {
        params.coupon = ecommerce.coupon;
      }
    }

    if (payload.page_location) {
      params.page_location = payload.page_location;
    }

    if (payload.page_title) {
      params.page_title = payload.page_title;
    }

    return params;
  }

  private hashData(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data.toLowerCase().trim())
      .digest('hex');
  }
}
