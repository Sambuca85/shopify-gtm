import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useOutletContext } from '@remix-run/react';
import { authenticate } from '~/shopify.server';
import { getShopSettings, getShopByDomain } from '~/lib/gtm.server';
import { DashboardLayout } from '~/components/DashboardLayout';
import { StatusCard } from '~/components/StatusCard';
import { QuickActions } from '~/components/QuickActions';
import { RecentEvents } from '~/components/RecentEvents';
import { Page, Layout, Card, Text, Banner } from '@shopify/polaris';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = await getShopByDomain(session.shop);
  
  if (!shop) {
    throw new Response('Shop not found', { status: 404 });
  }

  const settings = await getShopSettings(shop.id);

  return {
    shop: {
      domain: session.shop,
      name: shop.name,
      plan: shop.plan,
    },
    settings: settings || null,
    hasSettings: !!settings,
    isGTMConfigured: !!settings?.gtmContainerId,
  };
}

export default function Index() {
  const { shop, settings, hasSettings, isGTMConfigured } = useLoaderData<typeof loader>();
  const { apiKey, host } = useOutletContext<{ apiKey: string; shop: string; host: string }>();

  const needsConfiguration = !hasSettings || !isGTMConfigured;

  return (
    <DashboardLayout title="Dashboard" shop={shop.domain}>
      <Page fullWidth>
        <Layout>
          {needsConfiguration && (
            <Layout.Section>
              <Banner
                title="Configurazione richiesta"
                status="warning"
                action={{ content: 'Configura GTM', url: '/app/settings' }}
              >
                <p>
                  Per iniziare a tracciare gli eventi ecommerce, configura il tuo
                  Google Tag Manager Container ID nelle impostazioni.
                </p>
              </Banner>
            </Layout.Section>
          )}

          <Layout.Section variant="oneThird">
            <StatusCard
              title="Stato GTM"
              status={isGTMConfigured ? 'active' : 'inactive'}
              description={
                isGTMConfigured
                  ? `Container: ${settings?.gtmContainerId}`
                  : 'Non configurato'
              }
            />
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <StatusCard
              title="Tracking Events"
              status={settings?.enabled ? 'active' : 'inactive'}
              description={
                settings?.enabled
                  ? 'Tracciamento attivo'
                  : 'Tracciamento disabilitato'
              }
            />
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <StatusCard
              title="Consent Mode"
              status={settings?.consentMode ? 'active' : 'inactive'}
              description={
                settings?.consentMode
                  ? 'GDPR compliance attivo'
                  : 'Consent mode disabilitato'
              }
            />
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Text as="h2" variant="headingMd">
                Benvenuto in GTM Advanced Tracking
              </Text>
              <div style={{ marginTop: '16px' }}>
                <Text as="p" variant="bodyMd">
                  Traccia automaticamente tutti gli eventi ecommerce sul tuo negozio
                  Shopify con Google Tag Manager. L&apos;app supporta:
                </Text>
                <ul style={{ marginTop: '12px', marginLeft: '20px' }}>
                  <li>Google Analytics 4 (GA4) ecommerce events</li>
                  <li>Meta Pixel (Facebook)</li>
                  <li>TikTok Pixel</li>
                  <li>Pinterest Tag</li>
                  <li>Server-side tracking</li>
                  <li>GDPR Consent Mode</li>
                </ul>
              </div>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <QuickActions shop={shop.domain} />
          </Layout.Section>

          <Layout.Section variant="twoThirds">
            <RecentEvents shopId={shop.domain} />
          </Layout.Section>
        </Layout>
      </Page>
    </DashboardLayout>
  );
}
