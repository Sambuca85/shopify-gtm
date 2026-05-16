import { Card, Text, InlineStack, Badge } from '@shopify/polaris';

interface StatusCardProps {
  title: string;
  status: 'active' | 'inactive' | 'warning' | 'error';
  description: string;
}

export function StatusCard({ title, status, description }: StatusCardProps) {
  const statusConfig = {
    active: { status: 'success' as const, label: 'Attivo' },
    inactive: { status: 'warning' as const, label: 'Inattivo' },
    warning: { status: 'warning' as const, label: 'Attenzione' },
    error: { status: 'critical' as const, label: 'Errore' },
  };

  const config = statusConfig[status];

  return (
    <Card>
      <InlineStack align="space-between" blockAlign="center">
        <Text as="h3" variant="headingSm">
          {title}
        </Text>
        <Badge status={config.status}>{config.label}</Badge>
      </InlineStack>
      <div style={{ marginTop: '8px' }}>
        <Text as="p" variant="bodySm" tone="subdued">
          {description}
        </Text>
      </div>
    </Card>
  );
}
