import { useLocation, useNavigate } from '@remix-run/react';
import { Navigation } from '@shopify/polaris';
import {
  HomeIcon,
  SettingsIcon,
  ReportsIcon,
  BugIcon,
  CodeIcon,
} from '@shopify/polaris-icons';

export function NavigationMenu() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/app' && location.pathname === '/app') return true;
    if (path !== '/app' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <Navigation location={location.pathname}>
      <Navigation.Section
        items={[
          {
            url: '/app',
            label: 'Dashboard',
            icon: HomeIcon,
            selected: isActive('/app'),
            onClick: () => navigate('/app'),
          },
          {
            url: '/app/events',
            label: 'Eventi',
            icon: ReportsIcon,
            selected: isActive('/app/events'),
            onClick: () => navigate('/app/events'),
          },
          {
            url: '/app/debug',
            label: 'Debug',
            icon: BugIcon,
            selected: isActive('/app/debug'),
            onClick: () => navigate('/app/debug'),
          },
          {
            url: '/app/settings',
            label: 'Impostazioni',
            icon: SettingsIcon,
            selected: isActive('/app/settings'),
            onClick: () => navigate('/app/settings'),
          },
          {
            url: '/app/code',
            label: 'Codice',
            icon: CodeIcon,
            selected: isActive('/app/code'),
            onClick: () => navigate('/app/code'),
          },
        ]}
      />
    </Navigation>
  );
}
