import type { TFunction } from 'i18next';
import {
  ADHOC_FILTER_MAX_CONDITIONS,
  AdhocDashboardFilter,
  AdhocFilterConditionSchema,
} from '@hyperdx/common-utils/dist/types';
import { notifications } from '@mantine/notifications';

export function notifyAdhocFilterFull(
  filter: Pick<AdhocDashboardFilter, 'id' | 'name'>,
  t?: TFunction,
) {
  notifications.show({
    id: `adhoc-filter-full-${filter.id}`,
    color: 'yellow',
    title:
      t == null
        ? `${filter.name} is full`
        : t('filtersModal.adhoc.filterFullTitle', { name: filter.name }),
    message:
      t == null
        ? `A filter holds up to ${ADHOC_FILTER_MAX_CONDITIONS} conditions. Remove one to add another.`
        : t('filtersModal.adhoc.filterFullMessage', {
            max: ADHOC_FILTER_MAX_CONDITIONS,
          }),
  });
}

export function notifyAdhocConditionTooLong(
  filter: Pick<AdhocDashboardFilter, 'id'>,
  t?: TFunction,
) {
  const maxLength = AdhocFilterConditionSchema.shape.value.maxLength;
  notifications.show({
    id: `adhoc-filter-too-long-${filter.id}`,
    color: 'yellow',
    title:
      t == null
        ? 'Condition is too long'
        : t('filtersModal.adhoc.conditionTooLongTitle'),
    message:
      t == null
        ? `Keys and values can be up to ${maxLength?.toLocaleString()} characters.`
        : t('filtersModal.adhoc.conditionTooLongMessage', {
            max: maxLength?.toLocaleString(),
          }),
  });
}
