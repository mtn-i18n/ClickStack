import * as React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { Spotlight, SpotlightActionData } from '@mantine/spotlight';
import {
  IconActivityHeartbeat,
  IconBell,
  IconChartLine,
  IconDeviceLaptop,
  IconGridDots,
  IconHelpCircle,
  IconLayout,
  IconLogs,
  IconSearch,
  IconSettings,
} from '@tabler/icons-react';

import { useBrandDisplayName, useLogomark } from './brand';
import { IS_K8S_DASHBOARD_ENABLED } from './config';
import { useDashboards } from './dashboard';
import { useSavedSearches } from './savedSearch';

import '@mantine/spotlight/styles.css';

export const useSpotlightActions = () => {
  const router = useRouter();
  const brandName = useBrandDisplayName();
  const logomark = useLogomark({ size: 16 });

  const { data: logViewsData } = useSavedSearches();
  const { data: dashboardsData } = useDashboards();
  const { t } = useTranslation('nav');

  const actions = React.useMemo<SpotlightActionData[]>(() => {
    const logViews = logViewsData ?? [];
    const dashboards = dashboardsData ?? [];

    const logViewActions: SpotlightActionData[] = [];

    // Saved searches
    logViews.forEach(logView => {
      logViewActions.push({
        id: logView.id,
        group: t('spotlight.groups.savedSearches'),
        leftSection: <IconLogs size={16} />,
        label: logView.name,
        keywords: ['search', 'log', 'saved'],
        onClick: () => {
          router.push(`/search/${logView.id}`);
        },
      });
    });

    // Dashboards
    dashboards.forEach(dashboard => {
      logViewActions.push({
        id: dashboard.id,
        group: t('spotlight.groups.dashboards'),
        leftSection: <IconLayout size={16} />,
        label: dashboard.name,
        keywords: ['dashboard'],
        onClick: () => {
          router.push(`/dashboards/${dashboard.id}`);
        },
      });
    });

    // Preset dashboards
    const presetDashboards = [
      {
        id: 'preset-services',
        label: t('services'),
        description: t('spotlight.presetServicesDescription'),
        href: '/services',
        keywords: ['preset', 'dashboard', 'http', 'latency', 'errors'],
      },
      {
        id: 'preset-clickhouse',
        label: 'ClickHouse',
        description: t('spotlight.presetClickhouseDescription'),
        href: '/clickhouse',
        keywords: ['preset', 'dashboard', 'database', 'queries'],
      },
      ...(IS_K8S_DASHBOARD_ENABLED
        ? [
            {
              id: 'preset-kubernetes',
              label: 'Kubernetes',
              description: t('spotlight.presetKubernetesDescription'),
              href: '/kubernetes',
              keywords: ['preset', 'dashboard', 'k8s', 'pods', 'cluster'],
            },
          ]
        : []),
    ];

    presetDashboards.forEach(preset => {
      logViewActions.push({
        id: preset.id,
        group: t('spotlight.groups.presetDashboards'),
        leftSection: <IconLayout size={16} />,
        label: preset.label,
        description: preset.description,
        keywords: preset.keywords,
        onClick: () => {
          router.push(preset.href);
        },
      });
    });

    logViewActions.push(
      {
        id: 'search',
        group: t('spotlight.groups.menu'),
        leftSection: <IconLogs size={16} />,
        label: t('search'),
        description: t('spotlight.searchDescription'),
        keywords: ['log', 'events', 'logs'],
        onClick: () => {
          router.push('/search');
        },
      },
      {
        id: 'chart-explorer',
        group: t('spotlight.groups.menu'),
        leftSection: <IconChartLine size={16} />,
        label: t('chartExplorer'),
        description: t('spotlight.chartExplorerDescription'),
        keywords: ['graph', 'metrics'],
        onClick: () => {
          router.push('/chart');
        },
      },
      {
        id: 'new-dashboard',
        group: t('spotlight.groups.menu'),
        leftSection: <IconGridDots size={16} />,
        label: t('dashboards'),
        description: t('spotlight.newDashboardDescription'),
        keywords: ['graph'],
        onClick: () => {
          router.push('/dashboards');
        },
      },
      {
        id: 'sessions',
        group: t('spotlight.groups.menu'),
        leftSection: <IconDeviceLaptop size={16} />,
        label: t('clientSessions'),
        description: t('spotlight.clientSessionsDescription'),
        keywords: ['browser', 'web'],
        onClick: () => {
          router.push('/sessions');
        },
      },
      {
        id: 'alerts',
        group: t('spotlight.groups.menu'),
        leftSection: <IconBell size={16} />,
        label: t('alerts'),
        description: t('spotlight.alertsDescription'),
        onClick: () => {
          router.push('/alerts');
        },
      },
      {
        id: 'service-health',
        group: t('spotlight.groups.menu'),
        label: t('spotlight.serviceHealth'),
        leftSection: <IconActivityHeartbeat size={16} />,
        description: t('spotlight.serviceHealthDescription'),
        onClick: () => {
          router.push('/services');
        },
      },
      {
        id: 'team-settings',
        group: t('spotlight.groups.menu'),
        leftSection: <IconSettings size={16} />,
        label: t('teamSettings'),

        onClick: () => {
          router.push('/team');
        },
      },
      {
        id: 'documentation',
        group: t('spotlight.groups.menu'),
        leftSection: <IconHelpCircle size={16} />,
        label: t('documentation'),
        keywords: ['help', 'docs'],
        onClick: () => {
          router.push(
            'https://clickhouse.com/docs/use-cases/observability/clickstack',
          );
        },
      },
      {
        id: 'cloud',
        group: t('spotlight.groups.menu'),
        leftSection: logomark,
        label: t('spotlight.cloudLabel', { brand: brandName }),
        description: t('spotlight.cloudDescription', { brand: brandName }),
        keywords: ['account', 'profile'],
        onClick: () => {
          router.push(
            'https://clickhouse.com/docs/use-cases/observability/clickstack/getting-started#deploy-with-clickhouse-cloud',
          );
        },
      },
    );

    return logViewActions;
  }, [brandName, logomark, logViewsData, dashboardsData, router, t]);

  return { actions };
};

export const HDXSpotlightProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { actions } = useSpotlightActions();
  const { t } = useTranslation('nav');

  return (
    <div className="notranslate" translate="no">
      {children}
      <Spotlight
        shortcut="mod + K"
        searchProps={{
          leftSection: <IconSearch size={16} />,
          placeholder: t('spotlight.searchPlaceholder'),
        }}
        nothingFound={t('spotlight.nothingFound')}
        zIndex={200001} // above the autocomplete
        tagsToIgnore={[]}
        highlightQuery
        actions={actions}
        limit={7}
        scrollable
      />
    </div>
  );
};
