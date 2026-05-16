import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { authenticate } from '~/shopify.server';
import { prisma } from '~/lib/db.server';
import { logTrackingEvent, getShopByDomain } from '~/lib/gtm.server';

export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log(`[Webhook] ${topic} for ${shop}`);

  const shopRecord = await getShopByDomain(shop);
  if (!shopRecord) {
    return json({ error: 'Shop not found' }, { status: 404 });
  }

  // Log webhook
  await prisma.webhookLog.create({
    data: {
      shopId: shopRecord.id,
      topic,
      payload: payload as any,
      status: 'SUCCESS',
    },
  });

  // Handle specific order events
  switch (topic) {
    case 'orders/create':
      await handleOrderCreated(shopRecord.id, payload);
      break;
    case 'orders/paid':
      await handleOrderPaid(shopRecord.id, payload);
      break;
    case 'orders/cancelled':
      await handleOrderCancelled(shopRecord.id, payload);
      break;
  }

  return json({ success: true });
}

async function handleOrderCreated(shopId: string, order: any) {
  await logTrackingEvent(shopId, 'order_created', {
    order_id: order.id,
    order_number: order.order_number,
    total_price: order.total_price,
    currency: order.currency,
    customer_id: order.customer?.id,
  });
}

async function handleOrderPaid(shopId: string, order: any) {
  // Format items for GA4
  const items = (order.line_items || []).map((item: any) => ({
    item_id: item.sku || item.variant_id,
    item_name: item.title,
    item_brand: item.vendor,
    price: parseFloat(item.price),
    quantity: item.quantity,
  }));

  await logTrackingEvent(shopId, 'purchase', {
    transaction_id: order.id,
    value: parseFloat(order.total_price),
    tax: parseFloat(order.total_tax),
    shipping: parseFloat(order.total_shipping || 0),
    currency: order.currency,
    coupon: order.discount_codes?.[0]?.code,
    items,
  });
}

async function handleOrderCancelled(shopId: string, order: any) {
  await logTrackingEvent(shopId, 'refund', {
    transaction_id: order.id,
    value: parseFloat(order.total_price),
    currency: order.currency,
  });
}
