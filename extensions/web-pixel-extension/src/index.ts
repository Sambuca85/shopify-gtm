import { register } from '@shopify/web-pixels-extension';

register(({ analytics, browser, settings }) => {
  const CONFIG = {
    containerId: settings.gtm_container_id || '',
    endpointUrl: settings.endpoint_url || '',
    debugMode: false,
  };

  // Helper to send events to backend
  async function sendEvent(eventName: string, payload: Record<string, any>) {
    if (!CONFIG.endpointUrl) return;

    try {
      const response = await fetch(CONFIG.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: eventName,
          timestamp: new Date().toISOString(),
          payload,
        }),
      });

      if (!response.ok) {
        console.error('[GTM Web Pixel] Failed to send event:', eventName);
      }
    } catch (error) {
      console.error('[GTM Web Pixel] Error sending event:', error);
    }
  }

  // Helper to format GA4 items
  function formatGA4Item(item: any, index?: number): Record<string, any> {
    return {
      item_id: item.variant?.sku || item.variant?.id || item.id,
      item_name: item.product?.title || item.title,
      item_brand: item.product?.vendor,
      item_category: item.product?.type,
      item_variant: item.variant?.title,
      price: parseFloat(item.finalLinePrice?.amount || item.price || 0),
      quantity: item.quantity || 1,
      index: index,
    };
  }

  // Subscribe to standard Shopify events
  analytics.subscribe('page_viewed', (event) => {
    sendEvent('page_view', {
      page: {
        title: event.context.document?.title,
        url: event.context.document?.location?.href,
        path: event.context.document?.location?.pathname,
        referrer: event.context.document?.referrer,
      },
      clientId: event.clientId,
      timestamp: event.timestamp,
    });
  });

  analytics.subscribe('product_viewed', (event) => {
    const product = event.data.productVariant;
    
    sendEvent('view_item', {
      ecommerce: {
        currency: product?.price?.currencyCode,
        value: parseFloat(product?.price?.amount || 0),
        items: [formatGA4Item({
          id: product?.id,
          title: product?.product?.title,
          vendor: product?.product?.vendor,
          type: product?.product?.type,
          variant: { title: product?.title },
          finalLinePrice: product?.price,
        })],
      },
      clientId: event.clientId,
      timestamp: event.timestamp,
    });
  });

  analytics.subscribe('collection_viewed', (event) => {
    const collection = event.data.collection;
    
    sendEvent('view_item_list', {
      ecommerce: {
        item_list_id: collection?.id,
        item_list_name: collection?.title,
        items: (collection?.productVariants || []).map((item: any, index: number) => 
          formatGA4Item({
            id: item.id,
            title: item.product?.title,
            vendor: item.product?.vendor,
            type: item.product?.type,
            variant: { title: item.title },
            finalLinePrice: item.price,
          }, index)
        ),
      },
      clientId: event.clientId,
      timestamp: event.timestamp,
    });
  });

  analytics.subscribe('product_added_to_cart', (event) => {
    const cartLine = event.data.cartLine;
    const product = cartLine?.merchandise;
    
    sendEvent('add_to_cart', {
      ecommerce: {
        currency: cartLine?.cost?.totalAmount?.currencyCode,
        value: parseFloat(cartLine?.cost?.totalAmount?.amount || 0),
        items: [formatGA4Item({
          id: product?.id,
          title: product?.product?.title,
          vendor: product?.product?.vendor,
          type: product?.product?.type,
          variant: { title: product?.title, sku: product?.sku },
          finalLinePrice: product?.price,
          quantity: cartLine?.quantity,
        })],
      },
      clientId: event.clientId,
      timestamp: event.timestamp,
    });
  });

  analytics.subscribe('cart_viewed', (event) => {
    const cart = event.data.cart;
    
    sendEvent('view_cart', {
      ecommerce: {
        currency: cart?.cost?.totalAmount?.currencyCode,
        value: parseFloat(cart?.cost?.totalAmount?.amount || 0),
        items: (cart?.lines || []).map((line: any, index: number) =>
          formatGA4Item({
            id: line.merchandise?.id,
            title: line.merchandise?.product?.title,
            vendor: line.merchandise?.product?.vendor,
            type: line.merchandise?.product?.type,
            variant: { title: line.merchandise?.title, sku: line.merchandise?.sku },
            finalLinePrice: line.cost?.totalAmount,
            quantity: line.quantity,
          }, index)
        ),
      },
      clientId: event.clientId,
      timestamp: event.timestamp,
    });
  });

  analytics.subscribe('checkout_started', (event) => {
    const checkout = event.data.checkout;
    
    sendEvent('begin_checkout', {
      ecommerce: {
        currency: checkout?.currencyCode,
        value: parseFloat(checkout?.totalPrice?.amount || 0),
        coupon: checkout?.discountApplications?.[0]?.title,
        items: (checkout?.lineItems || []).map((item: any, index: number) =>
          formatGA4Item({
            id: item.variant?.id,
            title: item.title,
            vendor: item.variant?.product?.vendor,
            type: item.variant?.product?.type,
            variant: { title: item.variant?.title, sku: item.variant?.sku },
            finalLinePrice: item.price,
            quantity: item.quantity,
          }, index)
        ),
      },
      clientId: event.clientId,
      timestamp: event.timestamp,
    });
  });

  analytics.subscribe('checkout_address_info_submitted', (event) => {
    const checkout = event.data.checkout;
    
    sendEvent('add_shipping_info', {
      ecommerce: {
        currency: checkout?.currencyCode,
        value: parseFloat(checkout?.totalPrice?.amount || 0),
        shipping_tier: checkout?.shippingLine?.title,
        items: (checkout?.lineItems || []).map((item: any, index: number) =>
          formatGA4Item({
            id: item.variant?.id,
            title: item.title,
            finalLinePrice: item.price,
            quantity: item.quantity,
          }, index)
        ),
      },
      clientId: event.clientId,
      timestamp: event.timestamp,
    });
  });

  analytics.subscribe('checkout_contact_info_submitted', (event) => {
    // Track contact info submission
    sendEvent('add_contact_info', {
      email: event.data.checkout?.email,
      clientId: event.clientId,
      timestamp: event.timestamp,
    });
  });

  analytics.subscribe('payment_info_submitted', (event) => {
    const checkout = event.data.checkout;
    
    sendEvent('add_payment_info', {
      ecommerce: {
        currency: checkout?.currencyCode,
        value: parseFloat(checkout?.totalPrice?.amount || 0),
        payment_type: checkout?.transactions?.[0]?.gateway,
        items: (checkout?.lineItems || []).map((item: any, index: number) =>
          formatGA4Item({
            id: item.variant?.id,
            title: item.title,
            finalLinePrice: item.price,
            quantity: item.quantity,
          }, index)
        ),
      },
      clientId: event.clientId,
      timestamp: event.timestamp,
    });
  });

  analytics.subscribe('checkout_completed', (event) => {
    const checkout = event.data.checkout;
    
    sendEvent('purchase', {
      ecommerce: {
        transaction_id: checkout?.order?.id,
        value: parseFloat(checkout?.totalPrice?.amount || 0),
        tax: parseFloat(checkout?.totalTax?.amount || 0),
        shipping: parseFloat(checkout?.shippingLine?.price?.amount || 0),
        currency: checkout?.currencyCode,
        coupon: checkout?.discountApplications?.[0]?.title,
        items: (checkout?.lineItems || []).map((item: any, index: number) =>
          formatGA4Item({
            id: item.variant?.id,
            title: item.title,
            vendor: item.variant?.product?.vendor,
            type: item.variant?.product?.type,
            variant: { title: item.variant?.title, sku: item.variant?.sku },
            finalLinePrice: item.price,
            quantity: item.quantity,
          }, index)
        ),
      },
      clientId: event.clientId,
      timestamp: event.timestamp,
    });
  });

  analytics.subscribe('search_submitted', (event) => {
    sendEvent('search', {
      search_term: event.data.searchResult?.query,
      results_count: event.data.searchResult?.totalCount,
      clientId: event.clientId,
      timestamp: event.timestamp,
    });
  });

  analytics.subscribe('product_removed_from_cart', (event) => {
    const cartLine = event.data.cartLine;
    const product = cartLine?.merchandise;
    
    sendEvent('remove_from_cart', {
      ecommerce: {
        currency: cartLine?.cost?.totalAmount?.currencyCode,
        value: parseFloat(cartLine?.cost?.totalAmount?.amount || 0),
        items: [formatGA4Item({
          id: product?.id,
          title: product?.product?.title,
          vendor: product?.product?.vendor,
          type: product?.product?.type,
          variant: { title: product?.title, sku: product?.sku },
          finalLinePrice: product?.price,
          quantity: cartLine?.quantity,
        })],
      },
      clientId: event.clientId,
      timestamp: event.timestamp,
    });
  });

  // Log initialization
  console.log('[GTM Web Pixel] Initialized with config:', CONFIG);
});
