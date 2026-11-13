import { useTranslation } from 'next-i18next/pages';
import type { TFunction } from 'i18next';
import {
  getFilterBroadcastTarget,
  getFilterVariableName,
  isFilterGlobalRequirement,
  isFilterRequired,
  isFilterVariableEnabled,
} from '@hyperdx/common-utils/dist/filters';
import { DashboardFilter } from '@hyperdx/common-utils/dist/types';
import {
  Button,
  Center,
  Group,
  Modal,
  Stack,
  UnstyledButton,
} from '@mantine/core';
import {
  IconAsterisk,
  IconBuildingBroadcastTower,
  IconFilter,
  IconLabel,
  IconList,
  IconPencil,
  IconRefresh,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react';

import { useSources } from '@/source';

import { MODAL_SIZE } from './constants';
import {
  DashboardFilterAttribute,
  DashboardFilterListItem,
} from './DashboardFiltersListItem';

import styles from '@styles/DashboardFiltersModal.module.scss';

interface DashboardFiltersListProps {
  filters: DashboardFilter[];
  isLoading?: boolean;
  hideAppliesTo?: boolean;
  /** Whether the broadcast / variable controls are available. */
  showVariableOptions: boolean;
  onEdit: (filter: DashboardFilter) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
  onAddNew: () => void;
}

function getSourceNames(
  ids: string[],
  sources?: { id: string; name: string }[],
) {
  return ids
    .map(id => sources?.find(s => s.id === id)?.name)
    .filter((name): name is string => !!name)
    .join(', ');
}

/** Where the dropdown's values come from: the queried source, or the authored list. */
function getValuesAttribute(
  filter: DashboardFilter,
  t: TFunction,
  sources?: { id: string; name: string }[],
): DashboardFilterAttribute {
  switch (filter.type) {
    case 'QUERY_EXPRESSION':
      return {
        icon: <IconSearch size={14} />,
        tooltip: t('filtersModal.list.sourceValuesTooltip'),
        label: sources?.find(s => s.id === filter.source)?.name ?? '',
      };
    case 'PROMETHEUS_LABEL':
      return {
        icon: <IconLabel size={14} />,
        tooltip: t('filtersModal.list.promqlValuesTooltip'),
        label: [sources?.find(s => s.id === filter.source)?.name, filter.label]
          .filter(Boolean)
          .join(' · '),
      };
    case 'STATIC_LIST': {
      const count = filter.options.length;
      return {
        icon: <IconList size={14} />,
        label: t('filtersModal.list.customOptions', { count }),
      };
    }
    case 'ADHOC':
      return {
        icon: <IconFilter size={14} />,
        tooltip: t('filtersModal.list.adhocValuesTooltip'),
        label: getSourceNames(filter.sources, sources),
      };
    default:
      filter satisfies never; // exhaustive check
      return { icon: <IconSearch size={14} />, label: '' };
  }
}

function getBroadcastTargetDisplay(
  filter: DashboardFilter,
  t: TFunction,
  sources?: { id: string; name: string }[],
) {
  const broadcastTarget = getFilterBroadcastTarget(filter);
  if (!broadcastTarget) return undefined;

  if (!broadcastTarget?.appliesToSourceIds?.length) {
    return t('filtersModal.list.allSources');
  }

  return getSourceNames(broadcastTarget.appliesToSourceIds, sources);
}

export const DashboardFiltersList = ({
  filters,
  isLoading,
  hideAppliesTo,
  showVariableOptions,
  onEdit,
  onRemove,
  onClose,
  onAddNew,
}: DashboardFiltersListProps) => {
  const { t } = useTranslation('dashboards');
  const { data: sources } = useSources();

  return (
    <Modal
      opened
      onClose={onClose}
      title={
        showVariableOptions
          ? t('filtersModal.filtersAndVariables')
          : t('filtersModal.filters')
      }
      size={MODAL_SIZE}
      className={styles.modal}
    >
      <Stack
        className={styles.filtersContainer}
        gap="xs"
        data-testid="dashboard-filters-list"
      >
        {filters.map(filter => {
          const attributes = [getValuesAttribute(filter, t, sources)];

          const broadcastTarget = getBroadcastTargetDisplay(filter, t, sources);
          if (!hideAppliesTo && broadcastTarget != null) {
            attributes.push({
              icon: <IconBuildingBroadcastTower size={14} />,
              tooltip: t('filtersModal.list.broadcastTargetTooltip'),
              label: broadcastTarget,
              testId: `dashboard-filter-applies-to-${filter.name}`,
            });
          }

          if (isFilterRequired(filter)) {
            const isGlobal = isFilterGlobalRequirement(filter);
            attributes.push({
              icon: <IconAsterisk size={14} />,
              tooltip: isGlobal
                ? t('filtersModal.list.requiredGlobalTooltip')
                : t('filtersModal.list.requiredTooltip'),
              label: t('filtersModal.list.requiredLabel'),
              testId: `dashboard-filter-required-attr-${filter.name}`,
            });
          }

          const variableName =
            showVariableOptions && isFilterVariableEnabled(filter)
              ? getFilterVariableName(filter)
              : undefined;
          return (
            <DashboardFilterListItem
              key={filter.id}
              name={filter.name}
              nameSuffix={variableName ? ` ($${variableName})` : undefined}
              attributes={attributes}
              actions={
                <>
                  <UnstyledButton
                    onClick={() => onEdit(filter)}
                    className={styles.filterActionButton}
                    data-testid={`edit-filter-button-${filter.name}`}
                  >
                    <IconPencil size={16} />
                  </UnstyledButton>
                  <UnstyledButton
                    onClick={() => onRemove(filter.id)}
                    className={`${styles.filterActionButton} ${styles.deleteButton}`}
                    data-testid={`delete-filter-button-${filter.name}`}
                  >
                    <IconTrash size={16} />
                  </UnstyledButton>
                </>
              }
            />
          );
        })}
        {isLoading && (
          <Center>
            <IconRefresh className="spin-animate" />
          </Center>
        )}
      </Stack>

      <Group justify="space-between" my="sm">
        <Button
          variant="secondary"
          onClick={onClose}
          data-testid="close-filters-button"
        >
          {t('common:actions.close')}
        </Button>
        <Button
          variant="primary"
          onClick={onAddNew}
          data-testid="add-filter-button"
        >
          {t('filtersModal.addNewFilter')}
        </Button>
      </Group>
    </Modal>
  );
};
