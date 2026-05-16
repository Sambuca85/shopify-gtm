import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';
import { AppProvider as PolarisAppProvider } from '@shopify/polaris';
import polarisStyles from '@shopify/polaris/build/esm/styles.css?url';
import { json } from '@remix-run/node';
import { authenticate } from '~/shopify.server';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: polarisStyles },
  {
    rel: 'preconnect',
    href: 'https://cdn.shopify.com',
  },
  {
    rel: 'preconnect',
    href: 'https://fonts.googleapis.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  
  return json({
    apiKey: process.env.SHOPIFY_API_KEY,
    shop: session.shop,
    host: new URL(request.url).searchParams.get('host') || '',
  });
}

export default function App() {
  const { apiKey, shop, host } = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <PolarisAppProvider i18n={{
          Polaris: {
            Common: {
              undo: 'Undo',
              redo: 'Redo',
              expand: 'Expand',
              collapse: 'Collapse',
            },
          },
        }}>
          <Outlet context={{ apiKey, shop, host }} />
        </PolarisAppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
