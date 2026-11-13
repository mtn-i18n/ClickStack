import { useTranslation } from 'next-i18next/pages';
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Select,
  Tabs,
  TextInput,
} from '@mantine/core';
import {
  IconLayoutGrid,
  IconList,
  IconSearch,
  IconTags,
} from '@tabler/icons-react';

import {
  DASHBOARD_SORT_OPTIONS,
  DASHBOARD_TABS,
  type DashboardSort,
  type DashboardTab,
  DEFAULT_DASHBOARD_SORT,
  isDashboardSort,
  isDashboardTab,
} from '@/components/Dashboards/dashboardsListUtils';
import { Tags } from '@/components/Tags';

export function DashboardsListToolbar({
  tab,
  onTabChange,
  canFilterByCreator,
  search,
  onSearchChange,
  hasTags,
  tagFilter,
  onTagFilterChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
}: {
  tab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  canFilterByCreator: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  hasTags: boolean;
  tagFilter: string[];
  onTagFilterChange: (tags: string[]) => void;
  sort: DashboardSort;
  onSortChange: (sort: DashboardSort) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (viewMode: 'grid' | 'list') => void;
}) {
  const { t } = useTranslation('dashboards');
  const tabs = DASHBOARD_TABS.filter(
    tab => tab.value !== 'mine' || canFilterByCreator,
  );

  return (
    <>
      <Tabs
        value={tab}
        onChange={value => onTabChange(isDashboardTab(value) ? value : 'all')}
        mb="md"
      >
        <Tabs.List>
          {tabs.map(tab => (
            <Tabs.Tab
              key={tab.value}
              value={tab.value}
              data-testid={`dashboards-tab-${tab.value}`}
            >
              {t(tab.labelKey)}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <Group gap="xs" mb="lg">
        <TextInput
          placeholder={t('toolbar.searchByName')}
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={e => onSearchChange(e.currentTarget.value)}
          style={{ flex: 1 }}
          miw={100}
        />
        {/* Stays mounted while a filter is set, even when no loaded dashboard
            carries a tag, so a stale ?tag= link can still be cleared. */}
        {(hasTags || tagFilter.length > 0) && (
          <Tags
            values={tagFilter}
            onChange={onTagFilterChange}
            resourceType="dashboard"
          >
            <Button
              variant="secondary"
              aria-label={t('toolbar.filterByTag')}
              leftSection={<IconTags size={16} />}
              rightSection={
                tagFilter.length > 0 ? (
                  <Badge size="sm" circle>
                    {tagFilter.length}
                  </Badge>
                ) : null
              }
              // Fixed so the toolbar doesn't shift as the count appears.
              w={120}
              style={{ flexShrink: 0 }}
              data-testid="dashboards-tag-filter"
            >
              {t('toolbar.tags')}
            </Button>
          </Tags>
        )}
        <Select
          aria-label={t('sort.label')}
          data={DASHBOARD_SORT_OPTIONS.map(o => ({
            value: o.value,
            label: t(o.labelKey),
          }))}
          value={sort}
          onChange={value =>
            onSortChange(
              isDashboardSort(value) ? value : DEFAULT_DASHBOARD_SORT,
            )
          }
          allowDeselect={false}
          w={180}
          data-testid="dashboards-sort-select"
        />
        <ActionIcon.Group>
          <ActionIcon
            variant={viewMode === 'grid' ? 'primary' : 'secondary'}
            size="input-sm"
            onClick={() => onViewModeChange('grid')}
            aria-label={t('toolbar.gridView')}
          >
            <IconLayoutGrid size={16} />
          </ActionIcon>
          <ActionIcon
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            size="input-sm"
            onClick={() => onViewModeChange('list')}
            aria-label={t('toolbar.listView')}
          >
            <IconList size={16} />
          </ActionIcon>
        </ActionIcon.Group>
      </Group>
    </>
  );
}
