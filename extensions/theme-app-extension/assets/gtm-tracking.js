/**
 * GTM Advanced Tracking - Client-side Tracking Library
 * Handles dataLayer events, consent management, and ecommerce tracking
 */

(function() {
  'use strict';

  // Configuration
  const config = window.gtmTrackingConfig || {};
  const isDebug = config.debugMode || false;
  
  // Logger
  const logger = {
    log: function(...args) {
      if (isDebug) {
        console.log('[GTM Tracking]', ...args);
      }
    },
    error: function(...args) {
      console.error('[GTM Tracking]', ...args);
    },
    warn: function(...args) {
      if (isDebug) {
        console.warn('[GTM Tracking]', ...args);
      }
    }
  };

  // DataLayer helper
  const dataLayer = {
    push: function(event) {
      if (window.dataLayer) {
        window.dataLayer.push(event);
        logger.log('Pushed to dataLayer:', event);
      } else {
        logger.error('dataLayer not available');
      }
    }
  };

  // Consent Manager
  const consentManager = {
    hasConsent: function(type) {
      if (!config.consentMode) return true;
      
      // Check Shopify Customer Privacy API
      if (window.Shopify && window.Shopify.customerPrivacy) {
        try {
          const consent = window.Shopify.customerPrivacy.trackingConsentMetafield();
          
          switch(type) {
            case 'analytics':
              return consent.analyticsProcessingAllowed;
            case 'marketing':
              return consent.marketingAllowed;
            case 'preferences':
              return consent.preferencesProcessingAllowed;
            default:
              return consent.analyticsProcessingAllowed;
          }
        } catch(e) {
          logger.error('Error checking consent:', e);
          return false;
        }
      }
      
      // Default to denied for safety
      return false;
    },

    updateConsent: function(consent) {
      if (!window.dataLayer) return;
      
      window.dataLayer.push({
        event: 'consent',
        consent: {
          analytics_storage: consent.analytics ? 'granted' : 'denied',
          ad_storage: consent.marketing ? 'granted' : 'denied',
          ad_user_data: consent.marketing ? 'granted' : 'denied',
          ad_personalization: consent.marketing ? 'granted' : 'denied'
        }
      });
      
      logger.log('Consent updated:', consent);
    }
  };

  // GA4 Ecommerce Helper
  const ga4Helper = {
    formatItem: function(item) {
      return {
        item_id: item.sku || item.variant_id || item.id,
        item_name: item.product_title || item.title || item.name,
        item_brand: item.vendor || item.brand,
        item_category: item.product_type || item.category,
        item_category2: item.category2,
        item_category3: item.category3,
        item_category4: item.category4,
        item_category5: item.category5,
        item_variant: item.variant_title || item.variant,
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1,
        item_list_id: item.collection_id || item.list_id,
        item_list_name: item.collection_title || item.list_name,
        index: item.index,
        coupon: item.coupon,
        discount: parseFloat(item.discount) || 0,
        affiliation: item.affiliation || config.shopName
      };
    },

    formatItems: function(items) {
      if (!Array.isArray(items)) return [];
      return items.map((item, index) => this.formatItem({...item, index}));
    },

    pushEvent: function(eventName, ecommerce) {
      if (!consentManager.hasConsent('analytics')) {
        logger.log('Analytics consent not granted, skipping event:', eventName);
        return;
      }

      dataLayer.push({
        event: eventName,
        ecommerce: ecommerce,
        event_timestamp: new Date().toISOString()
      });
    }
  };

  // Meta Pixel Helper
  const metaHelper = {
    track: function(eventName, params) {
      if (!config.metaPixelId || !window.fbq) return;
      if (!consentManager.hasConsent('marketing')) {
        logger.log('Marketing consent not granted, skipping Meta event:', eventName);
        return;
      }
      
      window.fbq('track', eventName, params);
      logger.log('Meta Pixel event:', eventName, params);
    },

    trackCustom: function(eventName, params) {
      if (!config.metaPixelId || !window.fbq) return;
      if (!consentManager.hasConsent('marketing')) return;
      
      window.fbq('trackCustom', eventName, params);
      logger.log('Meta Pixel custom event:', eventName, params);
    }
  };

  // TikTok Pixel Helper
  const tiktokHelper = {
    track: function(eventName, params) {
      if (!config.tiktokPixelId || !window.ttq) return;
      if (!consentManager.hasConsent('marketing')) {
        logger.log('Marketing consent not granted, skipping TikTok event:', eventName);
        return;
      }
      
      window.ttq.track(eventName, params);
      logger.log('TikTok Pixel event:', eventName, params);
    }
  };

  // Pinterest Helper
  const pinterestHelper = {
    track: function(eventName, params) {
      if (!config.pinterestTagId || !window.pintrk) return;
      if (!consentManager.hasConsent('marketing')) {
        logger.log('Marketing consent not granted, skipping Pinterest event:', eventName);
        return;
      }
      
      window.pintrk('track', eventName, params);
      logger.log('Pinterest event:', eventName, params);
    }
  };

  // Ecommerce Event Handlers
  const ecommerceEvents = {
    viewItem: function(product) {
      const item = ga4Helper.formatItem(product);
      
      ga4Helper.pushEvent('view_item', {
        currency: config.shopCurrency,
        value: item.price,
        items: [item]
      });

      metaHelper.track('ViewContent', {
        content_ids: [item.item_id],
        content_type: 'product',
        content_name: item.item_name,
        currency: config.shopCurrency,
        value: item.price
      });

      tiktokHelper.track('ViewContent', {
        content_id: item.item_id,
        content_type: 'product',
        content_name: item.item_name,
        currency: config.shopCurrency,
        price: item.price
      });

      pinterestHelper.track('pagevisit');
    },

    viewItemList: function(listName, items) {
      const formattedItems = ga4Helper.formatItems(items);
      
      ga4Helper.pushEvent('view_item_list', {
        item_list_name: listName,
        items: formattedItems
      });

      metaHelper.track('ViewContent', {
        content_type: 'product_group',
        content_ids: formattedItems.map(i => i.item_id)
      });
    },

    addToCart: function(product, quantity) {
      const item = ga4Helper.formatItem({...product, quantity});
      
      ga4Helper.pushEvent('add_to_cart', {
        currency: config.shopCurrency,
        value: item.price * quantity,
        items: [item]
      });

      metaHelper.track('AddToCart', {
        content_ids: [item.item_id],
        content_type: 'product',
        content_name: item.item_name,
        currency: config.shopCurrency,
        value: item.price * quantity,
        num_items: quantity
      });

      tiktokHelper.track('AddToCart', {
        content_id: item.item_id,
        content_type: 'product',
        content_name: item.item_name,
        quantity: quantity,
        price: item.price,
        currency: config.shopCurrency
      });

      pinterestHelper.track('addtocart', {
        value: item.price * quantity,
        order_quantity: quantity,
        currency: config.shopCurrency
      });
    },

    removeFromCart: function(product, quantity) {
      const item = ga4Helper.formatItem({...product, quantity});
      
      ga4Helper.pushEvent('remove_from_cart', {
        currency: config.shopCurrency,
        value: item.price * quantity,
        items: [item]
      });
    },

    beginCheckout: function(cart) {
      const items = ga4Helper.formatItems(cart.items || []);
      
      ga4Helper.pushEvent('begin_checkout', {
        currency: cart.currency || config.shopCurrency,
        value: cart.total_price,
        coupon: cart.coupon,
        items: items
      });

      metaHelper.track('InitiateCheckout', {
        content_ids: items.map(i => i.item_id),
        content_type: 'product',
        num_items: items.reduce((sum, i) => sum + i.quantity, 0),
        currency: cart.currency || config.shopCurrency,
        value: cart.total_price
      });

      tiktokHelper.track('InitiateCheckout', {
        contents: items.map(i => ({
          content_id: i.item_id,
          content_type: 'product',
          content_name: i.item_name,
          quantity: i.quantity,
          price: i.price
        })),
        value: cart.total_price,
        currency: cart.currency || config.shopCurrency
      });
    },

    addShippingInfo: function(cart, shippingTier) {
      const items = ga4Helper.formatItems(cart.items || []);
      
      ga4Helper.pushEvent('add_shipping_info', {
        currency: cart.currency || config.shopCurrency,
        value: cart.total_price,
        shipping_tier: shippingTier,
        items: items
      });
    },

    addPaymentInfo: function(cart, paymentType) {
      const items = ga4Helper.formatItems(cart.items || []);
      
      ga4Helper.pushEvent('add_payment_info', {
        currency: cart.currency || config.shopCurrency,
        value: cart.total_price,
        payment_type: paymentType,
        items: items
      });
    },

    purchase: function(order) {
      const items = ga4Helper.formatItems(order.line_items || []);
      
      ga4Helper.pushEvent('purchase', {
        transaction_id: order.id || order.order_id,
        value: parseFloat(order.total_price) || 0,
        tax: parseFloat(order.total_tax) || 0,
        shipping: parseFloat(order.shipping_price) || 0,
        currency: order.currency || config.shopCurrency,
        coupon: order.coupon,
        items: items
      });

      metaHelper.track('Purchase', {
        content_ids: items.map(i => i.item_id),
        content_type: 'product',
        num_items: items.reduce((sum, i) => sum + i.quantity, 0),
        currency: order.currency || config.shopCurrency,
        value: parseFloat(order.total_price) || 0
      });

      tiktokHelper.track('CompletePayment', {
        contents: items.map(i => ({
          content_id: i.item_id,
          content_type: 'product',
          content_name: i.item_name,
          quantity: i.quantity,
          price: i.price
        })),
        value: parseFloat(order.total_price) || 0,
        currency: order.currency || config.shopCurrency
      });

      pinterestHelper.track('checkout', {
        value: parseFloat(order.total_price) || 0,
        order_quantity: items.reduce((sum, i) => sum + i.quantity, 0),
        currency: order.currency || config.shopCurrency
      });
    },

    search: function(searchTerm, resultsCount) {
      ga4Helper.pushEvent('search', {
        search_term: searchTerm
      });

      metaHelper.track('Search', {
        search_string: searchTerm
      });

      tiktokHelper.track('Search', {
        query: searchTerm
      });
    },

    viewCart: function(cart) {
      const items = ga4Helper.formatItems(cart.items || []);
      
      ga4Helper.pushEvent('view_cart', {
        currency: cart.currency || config.shopCurrency,
        value: cart.total_price,
        items: items
      });
    },

    addToWishlist: function(product) {
      const item = ga4Helper.formatItem(product);
      
      ga4Helper.pushEvent('add_to_wishlist', {
        currency: config.shopCurrency,
        value: item.price,
        items: [item]
      });

      metaHelper.track('AddToWishlist', {
        content_ids: [item.item_id],
        content_type: 'product',
        content_name: item.item_name,
        currency: config.shopCurrency,
        value: item.price
      });
    },

    generateLead: function(value, currency) {
      ga4Helper.pushEvent('generate_lead', {
        currency: currency || config.shopCurrency,
        value: value
      });

      metaHelper.track('Lead', {
        currency: currency || config.shopCurrency,
        value: value
      });

      tiktokHelper.track('SubmitForm', {
        value: value,
        currency: currency || config.shopCurrency
      });
    },

    login: function(method) {
      ga4Helper.pushEvent('login', {
        method: method || 'standard'
      });
    },

    signUp: function(method) {
      ga4Helper.pushEvent('sign_up', {
        method: method || 'standard'
      });

      metaHelper.track('CompleteRegistration');
      tiktokHelper.track('CompleteRegistration');
    }
  };

  // Shopify Analytics Subscriber (for checkout events)
  if (window.Shopify && window.Shopify.analytics) {
    window.Shopify.analytics.subscribe('checkout_started', function(event) {
      ecommerceEvents.beginCheckout(event.data.checkout);
    });

    window.Shopify.analytics.subscribe('checkout_completed', function(event) {
      ecommerceEvents.purchase(event.data.checkout);
    });

    window.Shopify.analytics.subscribe('payment_info_submitted', function(event) {
      ecommerceEvents.addPaymentInfo(event.data.checkout, event.data.paymentMethod);
    });
  }

  // Expose global API
  window.gtmEcommerce = ecommerceEvents;
  window.gtmConsent = consentManager;
  window.gtmLogger = logger;

  // Auto-track page views if enabled
  if (config.enabled) {
    document.addEventListener('DOMContentLoaded', function() {
      logger.log('GTM Tracking initialized');
      
      // Push page view event
      dataLayer.push({
        event: 'page_view',
        page_location: window.location.href,
        page_title: document.title,
        page_path: window.location.pathname,
        send_to: config.ga4MeasurementId
      });
    });
  }

})();
