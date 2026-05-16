import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { useLoaderData, useActionData, useSubmit } from '@remix-run/react';
import { authenticate } from '~/shopify.server';
import { getShopByDomain } from '~/lib/gtm.server';
import { DashboardLayout } from '~/components/DashboardLayout';
import { json } from '@remix-run/node';
import { useState, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  FormLayout,
  TextField,
  Select,
  Banner,
  CodeBlock,
  InlineStack,
  Box,
  List,
} from '@shopify/polaris';

const TEST_EVENTS = [
  { label: 'page_view', value: 'page_view' },
  { label: 'view_item', value: 'view_item' },
  { label: 'view_item_list', value: 'view_item_list' },
  { label: 'add_to_cart', value: 'add_to_cart' },
  { label: 'begin_checkout', value: 'begin_checkout' },
  { label: 'purchase', value: 'purchase' },
  { label: 'search', value: 'search' },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = await getShopByDomain(session.shop);
  
  if (!shop) {
    throw new Response('Shop not found', { status: 404 });
  }

  return json({
    shop: { domain: session.shop },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const eventType = formData.get('eventType') as string;
  const customPayload = formData.get('customPayload') as string;

  try {
    let payload: any = {};
    
    if (customPayload) {
      payload = JSON.parse(customPayload);
    } else {
      // Generate default payload based on event type
      payload = generateTestPayload(eventType);
    }

    // Simulate sending event
    const result = {
      success: true,
      event: eventType,
      payload,
      timestamp: new Date().toISOString(),
    };

    return json({ result });
  } catch (error) {
    return json(
      { error: 'Errore durante il test: ' + (error as Error).message },
      { status: 400 }
    );
  }
}

function generateTestPayload(eventType: string) {
  const basePayload = {
    event_timestamp: new Date().toISOString(),
    page_location: 'https://example.myshopify.com',
    page_title: 'Test Page',
  };

  switch (eventType) {
    case 'view_item':
      return {
        ...basePayload,
        ecommerce: {
          currency: 'USD',
          value: 29.99,
          items: [{
            item_id: 'SKU123',
            item_name: 'Test Product',
            item_brand: 'Test Brand',
            item_category: 'Test Category',
            price: 29.99,
            quantity: 1,
          }],
        },
      };
    case 'add_to_cart':
      return {
        ...basePayload,
        ecommerce: {
          currency: 'USD',
          value: 29.99,
          items: [{
            item_id: 'SKU123',
            item_name: 'Test Product',
            price: 29.99,
            quantity: 1,
          }],
        },
      };
    case 'purchase':
      return {
        ...basePayload,
        ecommerce: {
          transaction_id: 'TEST-123',
          value: 59.98,
          tax: 5.00,
          shipping: 10.00,
          currency: 'USD',
          coupon: 'TEST10',
          items: [{
            item_id: 'SKU123',
            item_name: 'Test Product',
            price: 29.99,
            quantity: 2,
          }],
        },
      };
    default:
      return basePayload;
  }
}

export default function DebugPage() {
  const { shop } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const [selectedEvent, setSelectedEvent] = useState('page_view');
  const [customPayload, setCustomPayload] = useState('');
  const [showPayload, setShowPayload] = useState(false);

  const handleTest = useCallback(() => {
    const formData = new FormData();
    formData.append('eventType', selectedEvent);
    if (customPayload) {
      formData.append('customPayload', customPayload);
    }
    submit(formData, { method: 'post' });
  }, [selectedEvent, customPayload, submit]);

  return (
    <DashboardLayout title="Debug & Test" shop={shop.domain}>
      <Page fullWidth>
        <Layout>
          <Layout.Section>
            <Card>
              <Text as="h2" variant="headingMd">
                Test Eventi
              </Text>
              <Box paddingBlockStart="400">
                <FormLayout>
                  <Select
                    label="Tipo di evento"
                    options={TEST_EVENTS}
                    value={selectedEvent}
                    onChange={setSelectedEvent}
                    helpText="Seleziona l&apos;evento da testare"
                  />

                  <TextField
                    label="Payload JSON personalizzato (opzionale)"
                    value={customPayload}
                    onChange={setCustomPayload}
                    multiline={4}
                    helpText="Lascia vuoto per usare il payload di default"
                    placeholder='{"ecommerce": {...}}'
                  />

                  <InlineStack gap="400">
                    <Button onClick={handleTest} variant="primary">
                      Test Evento
                    </Button>
                    <Button onClick={() => setShowPayload(!showPayload)}>
                      {showPayload ? 'Nascondi' : 'Mostra'} Payload
                    </Button>
                  </InlineStack>
                </FormLayout>
              </Box>
            </Card>
          </Layout.Section>

          {actionData?.result && (
            <Layout.Section>
              <Card>
                <Text as="h3" variant="headingMd">
                  Risultato Test
                </Text>
                <Box paddingBlockStart="400">
                  <CodeBlock>{JSON.stringify(actionData.result, null, 2)}</CodeBlock>
                </Box>
              </Card>
            </Layout.Section>
          )}

          {actionData?.error && (
            <Layout.Section>
              <Banner title={actionData.error} status="critical" />
            </Layout.Section>
          )}

          {showPayload && (
            <Layout.Section>
              <Card>
                <Text as="h3" variant="headingMd">
                  Payload di Default
                </Text>
                <Box paddingBlockStart="400">
                  <CodeBlock>
                    {JSON.stringify(generateTestPayload(selectedEvent), null, 2)}
                  </CodeBlock>
                </Box>
              </Card>
            </Layout.Section>
          )}

          <Layout.Section>
            <Card>
              <Text as="h2" variant="headingMd">
                Guida Debug
              </Text>
              <Box paddingBlockStart="400">
                <List type="number">
                  <List.Item>
                    Apri il browser DevTools (F12) → Tab Console
                  </List.Item>
                  <List.Item>
                    Cerca messaggi con prefisso [GTM Tracking]
                  </List.Item>
                  <List.Item>
                    Digita dataLayer nella console per vedere gli eventi
                  </List.Item>
                  <List.Item>
                    Usa Google Tag Manager Preview per verificare i tag
                  </List.Item>
                  <List.Item>
                    Controlla la sezione Eventi nella dashboard per lo storico
                  </List.Item>
                </List>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </DashboardLayout>
  );
}
