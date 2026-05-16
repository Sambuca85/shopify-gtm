import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { authenticate } from '~/shopify.server';

export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log(`[Webhook] App uninstalled from ${shop}`);

  // The uninstall logic is handled in shopify.server.ts hooks
  // This endpoint serves as a backup

  return json({ success: true });
}
