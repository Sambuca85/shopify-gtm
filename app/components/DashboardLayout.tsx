import { useNavigate } from '@remix-run/react';
import { Page, Badge } from '@shopify/polaris';
import type { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  shop: string;
}

export function DashboardLayout({ children, title, shop }: DashboardLayoutProps) {
  const navigate = useNavigate();

  return (
    <Page
      title={title}
      titleMetadata={<Badge status="success">{shop}</Badge>}
    >
      {children}
    </Page>
  );
}
