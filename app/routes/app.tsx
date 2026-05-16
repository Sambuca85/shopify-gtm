import type { LoaderFunctionArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';
import { authenticate } from '~/shopify.server';
import { NavigationMenu } from '~/components/NavigationMenu';
import { Page, Frame } from '@shopify/polaris';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  return {
    apiKey: process.env.SHOPIFY_API_KEY!,
    host: new URL(request.url).searchParams.get('host') || '',
    shop: session.shop,
  };
}

export default function AppLayout() {
  const { apiKey, host, shop } = useLoaderData<typeof loader>();

  return (
    <Frame navigation={<NavigationMenu />}>
      <Outlet context={{ apiKey, shop, host }} />
    </Frame>
  );
}
