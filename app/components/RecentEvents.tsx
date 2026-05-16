import { useEffect, useState } from 'react';
import { Card, DataTable, Text, Badge, SkeletonBodyText } from '@shopify/polaris';

interface Event {
  id: string;
  eventName: string;
  timestamp: string;
  status: 'sent' | 'failed' | 'pending';
}

interface RecentEventsProps {
  shopId: string;
}

export function RecentEvents({ shopId }: RecentEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching recent events
    setTimeout(() => {
      setEvents([
        { id: '1', eventName: 'page_view', timestamp: new Date().toISOString(), status: 'sent' },
        { id: '2', eventName: 'view_item', timestamp: new Date(Date.now() - 60000).toISOString(), status: 'sent' },
        { id: '3', eventName: 'add_to_cart', timestamp: new Date(Date.now() - 120000).toISOString(), status: 'sent' },
        { id: '4', eventName: 'begin_checkout', timestamp: new Date(Date.now() - 180000).toISOString(), status: 'pending' },
      ]);
      setLoading(false);
    }, 1000);
  }, [shopId]);

  const rows = events.map(event => [
    event.eventName,
    new Date(event.timestamp).toLocaleString(),
    <Badge
      key={event.id}
      status={
        event.status === 'sent'
          ? 'success'
          : event.status === 'failed'
          ? 'critical'
          : 'attention'
      }
    >
      {event.status}
    </Badge>,
  ]);

  return (
    <Card>
      <Text as="h3" variant="headingSm">
        Eventi Recenti
      </Text>
      <div style={{ marginTop: '16px' }}>
        {loading ? (
          <SkeletonBodyText lines={4} />
        ) : (
          <DataTable
            columnContentTypes={['text', 'text', 'text']}
            headings={['Evento', 'Timestamp', 'Stato']}
            rows={rows}
            footerContent={`Ultimi ${events.length} eventi`}
          />
        )}
      </div>
    </Card>
  );
}
