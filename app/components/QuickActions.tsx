import { Card, Button, Text, LegacyStack } from '@shopify/polaris';
import { useNavigate } from '@remix-run/react';

interface QuickActionsProps {
  shop: string;
}

export function QuickActions({ shop }: QuickActionsProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <Text as="h3" variant="headingSm">
        Azioni Rapide
      </Text>
      <div style={{ marginTop: '16px' }}>
        <LegacyStack vertical>
          <Button
            fullWidth
            onClick={() => navigate('/app/settings')}
          >
            Configura GTM
          </Button>
          <Button
            fullWidth
            onClick={() => navigate('/app/debug')}
          >
            Test Eventi
          </Button>
          <Button
            fullWidth
            onClick={() => navigate('/app/code')}
          >
            Esporta Codice
          </Button>
        </LegacyStack>
      </div>
    </Card>
  );
}
