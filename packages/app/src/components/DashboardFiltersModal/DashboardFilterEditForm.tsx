import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'next-i18next/pages';
import type { TFunction } from 'i18next';
import { useForm, useWatch } from 'react-hook-form';
import {
  deriveVariableName,
  getFilterVariableName,
} from '@hyperdx/common-utils/dist/filters';
import {
  ChartVariable,
  DashboardFilter,
  DashboardFilterType,
  TSource,
} from '@hyperdx/common-utils/dist/types';
import {
  Alert,
  Box,
  Button,
  Divider,
  Group,
  Modal,
  Stack,
  TextInput,
} from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

import { ErrorBoundary } from '@/components/Error/ErrorBoundary';
import { CheckBoxControlled } from '@/components/InputControlled';
import SelectControlled from '@/components/SelectControlled';
import { SqlVariablesProvider } from '@/components/SQLEditor/variableCompletions';
import { IS_ADHOC_FILTERS_ENABLED, IS_PROMQL_ENABLED } from '@/config';
import { useConfirm } from '@/useConfirm';
import { useZIndex } from '@/zIndex';

import { AdhocFilterEditForm } from './AdhocFilterEditForm';
import { MODAL_SIZE } from './constants';
import { CustomInputWrapper } from './CustomInputWrapper';
import {
  FilterFormValues,
  toFormValues,
  toSavedFilter,
} from './filterFormState';
import { PromqlLabelFilterEditForm } from './PromqlLabelFilterEditForm';
import { QueryExpressionFilterEditForm } from './QueryExpressionFilterEditForm';
import { StaticListFilterEditForm } from './StaticListFilterEditForm';

const getFilterTypeOptions = (t: TFunction) => [
  {
    value: DashboardFilterType.enum.QUERY_EXPRESSION,
    label: t('filtersModal.filterTypes.queriedValues'),
  },
  {
    value: DashboardFilterType.enum.STATIC_LIST,
    label: t('filtersModal.filterTypes.staticValues'),
  },
  ...(IS_PROMQL_ENABLED
    ? [
        {
          value: DashboardFilterType.enum.PROMETHEUS_LABEL,
          label: t('filtersModal.filterTypes.promqlLabelValues'),
        },
      ]
    : []),
  ...(IS_ADHOC_FILTERS_ENABLED
    ? [
        {
          value: DashboardFilterType.enum.ADHOC,
          label: t('filtersModal.filterTypes.adhocKeysValues'),
        },
      ]
    : []),
];

interface DashboardFilterEditFormProps {
  /** The stored filter this session started from; unset for one that does not exist yet. */
  filter?: DashboardFilter;
  /** Filters that already exist on the dashboard */
  filters: DashboardFilter[];
  /** The source to pre-fill for a new filter, if any */
  source?: TSource;
  /** Whether the broadcast / variable controls are available. */
  showVariableOptions: boolean;
  /** Whether to show the options for marking a filter as required. */
  showRequiredFilterOptions: boolean;
  /** The dashboard's current variable state, if any */
  variables?: ChartVariable[];
  onSave: (filter: DashboardFilter) => void;
  onClose: () => void;
  onCancel: () => void;
}

/**
 * The editor for a single filter, of any type. One form covers them all, so
 * switching type keeps the fields they share. Which of the fields are actually
 * stored is settled by `toSavedFilter`, not by which editor happens to be
 * mounted.
 */
export const DashboardFilterEditForm = ({
  filter,
  source: presetSource,
  filters,
  showVariableOptions,
  showRequiredFilterOptions,
  variables,
  onSave,
  onClose,
  onCancel,
}: DashboardFilterEditFormProps) => {
  const { t } = useTranslation('dashboards');
  const {
    handleSubmit,
    register,
    formState,
    control,
    setValue,
    setError,
    trigger,
  } = useForm<FilterFormValues>({
    defaultValues: toFormValues(filter, presetSource?.id),
  });

  const confirm = useConfirm();
  // Read during render so react-hook-form subscribes this component to it.
  const isDirty = formState.isDirty;

  // Keep this modal below the root confirm dialog (Mantine's default 200) so
  // the "discard unsaved changes?" prompt stacks on top of it — mirrors the
  // tile editor's z-index handling.
  const modalZIndex = useZIndex() + 10;

  // Guards against re-entrancy while the confirm dialog is open: Mantine's
  // focus management can re-fire the modal's onClose after the confirm modal
  // closes, which would otherwise stack a second dialog.
  const isConfirmingRef = useRef(false);

  const handleClose = useCallback(() => {
    if (isConfirmingRef.current) return;
    if (!isDirty) {
      onClose();
      return;
    }
    isConfirmingRef.current = true;
    confirm(t('filtersModal.discardConfirm'), t('filtersModal.discard')).then(
      ok => {
        isConfirmingRef.current = false;
        if (ok) {
          onClose();
        }
      },
    );
  }, [confirm, isDirty, onClose, t]);

  // Gates the auto-fill of Variable Name from Name below. The auto-fill itself
  // uses `setValue` without `shouldDirty`, so the field is dirty only once the
  // user has typed in it. Also gated for a filter that already has a stored
  // name, because renaming an existing filter must not silently break the tiles
  // referencing its old token.
  const hasEditedVariableName =
    !!filter?.variableName || !!formState.dirtyFields.variableName;

  const [formFilterType, formFilterName, isRequired] = useWatch({
    control,
    name: ['type', 'name', 'isRequired'],
  });
  const derivedVariableName = deriveVariableName(formFilterName ?? '');

  // Keep the variable name in sync with the display
  // name, unless the user has already edited it
  useEffect(() => {
    if (!showVariableOptions || hasEditedVariableName) return;
    setValue('variableName', derivedVariableName);
  }, [
    derivedVariableName,
    hasEditedVariableName,
    showVariableOptions,
    setValue,
  ]);

  const otherFilters = useMemo(
    () => filters.filter(f => f.id !== filter?.id),
    [filters, filter?.id],
  );

  // A filter referencing its own variable would narrow its dropdown to the
  // values already selected in it, so don't offer that reference at all.
  const otherVariables = useMemo(() => {
    const ownName = filter && getFilterVariableName(filter);
    if (!ownName) return variables;
    return variables?.filter(variable => variable.name !== ownName);
  }, [variables, filter]);

  const isNew = !filter;
  const showTypeInput = !!showVariableOptions;

  return (
    <Modal
      title={isNew ? t('filtersModal.addFilter') : t('filtersModal.editFilter')}
      opened
      onClose={handleClose}
      size={MODAL_SIZE}
      zIndex={modalZIndex}
    >
      <form
        onSubmit={handleSubmit(values => {
          try {
            const validated = toSavedFilter(values);
            onSave(validated);
          } catch {
            // The field rules should make this unreachable
            setError('root', {
              message: t('filtersModal.incompleteError'),
            });
          }
        })}
      >
        <Stack>
          {showTypeInput && (
            <CustomInputWrapper label={t('filtersModal.type')}>
              <SelectControlled
                control={control}
                name="type"
                data={getFilterTypeOptions(t)}
                data-testid="filter-type-picker"
                allowDeselect={false}
                comboboxProps={{ withinPortal: true }}
              />
            </CustomInputWrapper>
          )}
          <CustomInputWrapper
            label={t('filtersModal.displayName')}
            error={formState.errors.name}
          >
            <TextInput
              placeholder={t('filtersModal.namePlaceholder')}
              data-testid="filter-name-input"
              {...register('name', { required: true, minLength: 1 })}
            />
          </CustomInputWrapper>
          <ErrorBoundary
            key={formFilterType}
            message={t('filtersModal.failedToLoad')}
            showErrorMessage
          >
            {formFilterType === 'STATIC_LIST' ? (
              <StaticListFilterEditForm
                control={control}
                otherFilters={otherFilters}
              />
            ) : formFilterType === 'ADHOC' ? (
              <SqlVariablesProvider variables={otherVariables}>
                <AdhocFilterEditForm
                  control={control}
                  setValue={setValue}
                  otherFilters={otherFilters}
                />
              </SqlVariablesProvider>
            ) : formFilterType === 'PROMETHEUS_LABEL' ? (
              <SqlVariablesProvider variables={otherVariables}>
                <PromqlLabelFilterEditForm
                  control={control}
                  otherFilters={otherFilters}
                />
              </SqlVariablesProvider>
            ) : (
              <SqlVariablesProvider variables={otherVariables}>
                <QueryExpressionFilterEditForm
                  control={control}
                  trigger={trigger}
                  pinnedSource={presetSource}
                  otherFilters={otherFilters}
                  showVariableOptions={showVariableOptions}
                />
              </SqlVariablesProvider>
            )}
          </ErrorBoundary>

          {showRequiredFilterOptions && formFilterType !== 'ADHOC' && (
            <Stack gap="xs">
              <Divider my="xs" />
              <CheckBoxControlled
                control={control}
                name="isSingleSelect"
                size="xs"
                label={t('filtersModal.singleSelect')}
                description={t('filtersModal.singleSelectDescription')}
                data-testid="filter-single-select-checkbox"
              />
              <CheckBoxControlled
                control={control}
                name="isRequired"
                size="xs"
                label={t('filtersModal.required')}
                description={t('filtersModal.requiredDescription')}
                data-testid="filter-required-checkbox"
              />
              {!!isRequired && (
                <Box ml={27}>
                  <CheckBoxControlled
                    control={control}
                    name="isGlobalRequirement"
                    size="xs"
                    label={t('filtersModal.blockEveryTile')}
                    description={t('filtersModal.blockEveryTileDescription')}
                    data-testid="filter-global-requirement-checkbox"
                  />
                </Box>
              )}
            </Stack>
          )}

          {formState.errors.root && (
            <Alert
              variant="danger"
              icon={<IconAlertTriangle size={16} />}
              data-testid="filter-save-error"
            >
              {formState.errors.root.message}
            </Alert>
          )}

          <Group justify="space-between" my="xs">
            <Button variant="secondary" onClick={onCancel}>
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              data-testid="save-filter-button"
            >
              {t('filtersModal.saveFilter')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
