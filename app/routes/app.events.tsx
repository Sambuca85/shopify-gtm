import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { authenticate } from '~/shopify.server';
import { getShopByDomain } from '~/lib/gtm.server';
import { DashboardLayout } from '~/components/DashboardLayout';
import { prisma } from '~/lib/db.server';
import { json } from '@remix-run/node';
import {
  Page,
  Layout,
  Card,
  DataTable,
  Text,
  Badge,
  Pagination,
  Select,
  InlineStack,
} from '@shopify/polaris';
import { useState, useCallback } from 'react';

const EVENTS_PER_PAGE = 25;

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = await getShopByDomain(session.shop);
  
  if (!shop) {
    throw new Response('Shop not found', { status: 404 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const status = url.searchParams.get('status') || 'all';

  const where = {
    shopId: shop.id,
    ...(status !== 'all' && { status: status.toUpperCase() }),
  };

  const totalEvents = await prisma.trackingEvent.count({ where });
  const events = await prisma.trackingEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * EVENTS_PER_PAGE,
    take: EVENTS_PER_PAGE,
  });

  return json({
    shop: { domain: session.shop },
    events: events.map(e => ({
      id: e.id,
      eventName: e.eventName,
      eventType: e.eventType,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
      attempts: e.attempts,
    })),
    totalPages: Math.ceil(totalEvents / EVENTS_PER_PAGE),
    currentPage: page,
    totalEvents,
  });
}

export default function EventsPage() {
  const { shop, events, totalPages, currentPage, totalEvents } = useLoaderData<typeof loader>();
  const [selectedStatus, setSelectedStatus] = useState('all');

  const statusOptions = [
    { label: 'Tutti', value: 'all' },
    { label: 'Inviati', value: 'sent' },
    { label: 'In attesa', value: 'pending' },
    { label: 'Falliti', value: 'failed' },
  ];

  const rows = events.map(event => [
    event.eventName,
    event.eventType,
    <Badge
      key={`${event.id}-status`}
      status={
        event.status === 'SENT'
          ? 'success'
          : event.status === 'FAILED'
          ? 'critical'
          : event.status === 'PENDING'
          ? 'attention'
          : 'warning'
      }
    >
      {event.status.toLowerCase()}
    </Badge>,
    new Date(event.createdAt).toLocaleString(),
    event.attempts.toString(),
  ]);

  const handleStatusChange = useCallback((value: string) => {
    setSelectedStatus(value);
    // Reload with new status filter
    window.location.href = `/app/events?status=${value}&page=1`;
  }, []);

  return (
    <DashboardLayout title="Eventi di Tracking" shop={shop.domain}>
      <Page fullWidth>
        <Layout>
          <Layout.Section>
            <Card>
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Eventi ({totalEvents})
                </Text>
                <div style={{ width: '200px' }}>
                  <Select
                    label="Filtra per stato"
                    labelHidden
                    options={statusOptions}
                    value={selectedStatus}
                    onChange={handleStatusChange}
                  />
                </div>
              </InlineStack>
              <div style={{ marginTop: '16px' }}>
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'numeric']}
                  headings={['Evento', 'Tipo', 'Stato', 'Data', 'Tentativi']}
                  rows={rows}
                />
              </div>
              {totalPages > 1 && (
                <div style={{ marginTop: '16px' }}>
                  <Pagination
                    hasPrevious={currentPage > 1}
                    onPrevious={() => {
                      window.location.href = `/app/events?status=${selectedStatus}&page=${currentPage - 1}`;
                    }}
                    hasNext={currentPage < totalPages}
                    onNext={() => {
                      window.location.href = `/app/events?status=${selectedStatus}&page=${currentPage + 1}`;
                    }}
                  />
                </div>
              )}
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </DashboardLayout>
  );
}
