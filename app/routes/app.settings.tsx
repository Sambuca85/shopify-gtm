import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useActionData, useSubmit, useNavigation } from '@remix-run/react';
import { authenticate } from '~/shopify.server';
import { getShopSettings, updateShopSettings, getShopByDomain } from '~/lib/gtm.server';
import { DashboardLayout } from '~/components/DashboardLayout';
import { json, redirect } from '@remix-run/node';
import { useState, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Checkbox,
  Button,
  Banner,
  Tabs,
  Select,
  Form,
  Text,
  InlineStack,
  LegacyStack,
  Box,
  Divider,
  Link,
} from '@shopify/polaris';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = await getShopByDomain(session.shop);
  
  if (!shop) {
    throw new Response('Shop not found', { status: 404 });
  }

  const settings = await getShopSettings(shop.id);

  return json({
    shop: {
      domain: session.shop,
      id: shop.id,
    },
    settings: settings || {
      gtmContainerId: '',
      enabled: true,
      debugMode: false,
      consentMode: true,
      serverSideTracking: false,
      eventsConfig: {},
      pixelConfig: {},
      consentConfig: {},
      dataLayerConfig: {},
    },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const shop = await getShopByDomain(session.shop);
  if (!shop) {
    return json({ error: 'Shop not found' }, { status: 404 });
  }

  const settings = {
    gtmContainerId: formData.get('gtmContainerId') as string,
    gtmAuth: formData.get('gtmAuth') as string || null,
    gtmPreview: formData.get('gtmPreview') as string || null,
    enabled: formData.get('enabled') === 'on',
    debugMode: formData.get('debugMode') === 'on',
    consentMode: formData.get('consentMode') === 'on',
    serverSideTracking: formData.get('serverSideTracking') === 'on',
    ga4MeasurementId: formData.get('ga4MeasurementId') as string || null,
    metaPixelId: formData.get('metaPixelId') as string || null,
    tiktokPixelId: formData.get('tiktokPixelId') as string || null,
    pinterestTagId: formData.get('pinterestTagId') as string || null,
  };

  try {
    await updateShopSettings(shop.id, settings);
    return json({ success: true, message: 'Impostazioni salvate con successo' });
  } catch (error) {
    return json(
      { error: 'Errore durante il salvataggio delle impostazioni' },
      { status: 500 }
    );
  }
}

export default function Settings() {
  const { shop, settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [selectedTab, setSelectedTab] = useState(0);
  const [formState, setFormState] = useState({
    gtmContainerId: settings.gtmContainerId || '',
    gtmAuth: settings.gtmAuth || '',
    gtmPreview: settings.gtmPreview || '',
    enabled: settings.enabled,
    debugMode: settings.debugMode,
    consentMode: settings.consentMode,
    serverSideTracking: settings.serverSideTracking,
    ga4MeasurementId: settings.ga4MeasurementId || '',
    metaPixelId: settings.metaPixelId || '',
    tiktokPixelId: settings.tiktokPixelId || '',
    pinterestTagId: settings.pinterestTagId || '',
  });

  const handleChange = useCallback((field: string) => (value: string | boolean) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    Object.entries(formState).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        if (value) formData.append(key, 'on');
      } else {
        formData.append(key, value);
      }
    });
    submit(formData, { method: 'post' });
  }, [formState, submit]);

  const tabs = [
    { id: 'general', content: 'Generale', accessibilityLabel: 'Generale' },
    { id: 'pixels', content: 'Pixels', accessibilityLabel: 'Pixels' },
    { id: 'advanced', content: 'Avanzate', accessibilityLabel: 'Avanzate' },
  ];

  return (
    <DashboardLayout title="Impostazioni" shop={shop.domain}>
      <Page fullWidth backAction={{ content: 'Dashboard', url: '/app' }}>
        <Layout>
          {actionData?.success && (
            <Layout.Section>
              <Banner
                title={actionData.message}
                status="success"
                onDismiss={() => {}}
              />
            </Layout.Section>
          )}

          {actionData?.error && (
            <Layout.Section>
              <Banner title={actionData.error} status="critical" />
            </Layout.Section>
          )}

          <Layout.Section>
            <Card>
              <Tabs
                tabs={tabs}
                selected={selectedTab}
                onSelect={setSelectedTab}
              />
              <Box paddingBlockStart="400">
                <Form onSubmit={handleSubmit}>
                  {selectedTab === 0 && (
                    <FormLayout>
                      <Text as="h3" variant="headingMd">
                        Configurazione GTM
                      </Text>
                      
                      <TextField
                        label="GTM Container ID"
                        helpText="Inserisci il tuo Google Tag Manager Container ID (es. GTM-XXXXXX)"
                        value={formState.gtmContainerId}
                        onChange={handleChange('gtmContainerId')}
                        autoComplete="off"
                        placeholder="GTM-XXXXXX"
                      />

                      <InlineStack gap="400">
                        <Checkbox
                          label="Attiva tracking"
                          checked={formState.enabled}
                          onChange={handleChange('enabled')}
                        />
                        <Checkbox
                          label="Debug mode"
                          checked={formState.debugMode}
                          onChange={handleChange('debugMode')}
                          helpText="Abilita il logging dettagliato degli eventi"
                        />
                        <Checkbox
                          label="Consent Mode GDPR"
                          checked={formState.consentMode}
                          onChange={handleChange('consentMode')}
                          helpText="Rispetta il consenso utente prima di tracciare"
                        />
                      </InlineStack>

                      <TextField
                        label="GTM Auth (opzionale)"
                        helpText="Per ambienti di preview o testing"
                        value={formState.gtmAuth}
                        onChange={handleChange('gtmAuth')}
                        autoComplete="off"
                      />

                      <TextField
                        label="GTM Preview (opzionale)"
                        value={formState.gtmPreview}
                        onChange={handleChange('gtmPreview')}
                        autoComplete="off"
                      />
                    </FormLayout>
                  )}

                  {selectedTab === 1 && (
                    <FormLayout>
                      <Text as="h3" variant="headingMd">
                        Configurazione Pixels
                      </Text>

                      <TextField
                        label="GA4 Measurement ID"
                        helpText="Il tuo Google Analytics 4 Measurement ID (es. G-XXXXXXXXXX)"
                        value={formState.ga4MeasurementId}
                        onChange={handleChange('ga4MeasurementId')}
                        autoComplete="off"
                        placeholder="G-XXXXXXXXXX"
                      />

                      <TextField
                        label="Meta Pixel ID"
                        helpText="Il tuo Facebook/Meta Pixel ID"
                        value={formState.metaPixelId}
                        onChange={handleChange('metaPixelId')}
                        autoComplete="off"
                        placeholder="123456789012345"
                      />

                      <TextField
                        label="TikTok Pixel ID"
                        value={formState.tiktokPixelId}
                        onChange={handleChange('tiktokPixelId')}
                        autoComplete="off"
                      />

                      <TextField
                        label="Pinterest Tag ID"
                        value={formState.pinterestTagId}
                        onChange={handleChange('pinterestTagId')}
                        autoComplete="off"
                      />
                    </FormLayout>
                  )}

                  {selectedTab === 2 && (
                    <FormLayout>
                      <Text as="h3" variant="headingMd">
                        Impostazioni Avanzate
                      </Text>

                      <Checkbox
                        label="Server-side tracking"
                        checked={formState.serverSideTracking}
                        onChange={handleChange('serverSideTracking')}
                        helpText="Abilita l&apos;invio degli eventi lato server"
                      />

                      <Banner
                        title="Server-side tracking"
                        status="info"
                      >
                        <p>
                          Il server-side tracking migliora l&apos;affidabilità dei dati
                          e supera le limitazioni dei browser. Richiede configurazione
                          aggiuntiva del tuo server GTM.
                        </p>
                      </Banner>
                    </FormLayout>
                  )}

                  <Box paddingBlockStart="400">
                    <Button
                      submit
                      variant="primary"
                      loading={isSubmitting}
                    >
                      Salva impostazioni
                    </Button>
                  </Box>
                </Form>
              </Box>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <Text as="h3" variant="headingMd">
                Documentazione
              </Text>
              <Box paddingBlockStart="400">
                <LegacyStack vertical>
                  <Link url="https://support.google.com/tagmanager" external>
                    Guida GTM
                  </Link>
                  <Link url="https://developers.google.com/analytics/devguides/collection/ga4" external>
                    GA4 Ecommerce
                  </Link>
                  <Link url="https://developers.facebook.com/docs/meta-pixel" external>
                    Meta Pixel
                  </Link>
                </LegacyStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </DashboardLayout>
  );
}
