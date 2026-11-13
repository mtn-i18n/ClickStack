import { useMemo } from 'react';
import { Trans, useTranslation } from 'next-i18next/pages';
import { Badge } from '@clickhouse/click-ui';
import { MVOptimizationExplanation } from '@hyperdx/common-utils/dist/core/materializedViews';
import { MaterializedViewConfiguration } from '@hyperdx/common-utils/dist/types';
import { Accordion, Alert, Group, Modal, Text, Tooltip } from '@mantine/core';

import MVConfigSummary from './MVConfigSummary';

function mvConfigToKey(config: MaterializedViewConfiguration) {
  return `mv-${config.databaseName}-${config.tableName}`;
}

export default function MVOptimizationModal({
  mvConfigs,
  explanations,
  opened,
  onClose,
}: {
  mvConfigs: MaterializedViewConfiguration[];
  explanations: MVOptimizationExplanation[];
  opened: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation('settings');
  const hasMultipleMVs = mvConfigs.length > 1;

  const explanationsByKey = useMemo(
    () => new Map(explanations.map(e => [mvConfigToKey(e.mvConfig), e])),
    [explanations],
  );

  const firstUsedMv = explanations.find(e => e.success)?.mvConfig;

  return (
    <Modal
      title={
        hasMultipleMVs
          ? t('materializedViews.modalTitlePlural')
          : t('materializedViews.modalTitle')
      }
      opened={opened}
      onClose={onClose}
      size="lg"
    >
      <div data-testid="mv-optimization-modal">
        <Text size="sm" mb="sm">
          <Trans
            i18nKey="materializedViews.modalDescription"
            count={hasMultipleMVs ? 2 : 1}
          />
        </Text>

        <Accordion defaultValue={firstUsedMv && mvConfigToKey(firstUsedMv)}>
          {mvConfigs.map(config => {
            const key = mvConfigToKey(config);
            const explanation = explanationsByKey.get(key);
            const hasErrors = !!explanation?.errors.length;
            const isBeingUsedByOptimizedConfig = explanation?.success;
            const rowEstimate =
              explanation?.rowEstimate?.toLocaleString() ?? 'N/A';

            return (
              <Accordion.Item value={key} key={key}>
                <Accordion.Control
                  px="xs"
                  data-testid="mv-optimization-modal-item"
                  data-mv-table={config.tableName}
                >
                  <Group justify="space-between">
                    <Text>{config.tableName}</Text>
                    {isBeingUsedByOptimizedConfig ? (
                      <Tooltip
                        label={t('materializedViews.estimatedRows', {
                          rowEstimate,
                        })}
                      >
                        <Badge
                          text={t('materializedViews.statusActive')}
                          state="success"
                          style={{
                            marginInlineEnd: 'var(--mantine-spacing-md)',
                          }}
                          data-testid="mv-optimization-modal-status"
                          data-mv-status="active"
                        />
                      </Tooltip>
                    ) : hasErrors ? (
                      <Tooltip
                        label={t('materializedViews.incompatibleTooltip')}
                      >
                        <Badge
                          text={t('materializedViews.statusIncompatible')}
                          state="warning"
                          style={{
                            marginInlineEnd: 'var(--mantine-spacing-md)',
                          }}
                          data-testid="mv-optimization-modal-status"
                          data-mv-status="incompatible"
                        />
                      </Tooltip>
                    ) : explanation ? (
                      <Tooltip
                        label={t('materializedViews.estimatedRows', {
                          rowEstimate,
                        })}
                      >
                        <Badge
                          text={t('materializedViews.statusSkipped')}
                          state="neutral"
                          style={{
                            marginInlineEnd: 'var(--mantine-spacing-md)',
                          }}
                          data-testid="mv-optimization-modal-status"
                          data-mv-status="skipped"
                        />
                      </Tooltip>
                    ) : null}
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <>
                    <MVConfigSummary config={config} />
                    {hasErrors && (
                      <Alert color="red" mt="xs">
                        <Text size="sm" fw={500} mb="xs">
                          {t('materializedViews.queryCannotAccelerate')}
                        </Text>
                        {explanation.errors.map((error, idx) => (
                          <Text size="sm" key={idx} mt="xs">
                            {error}
                          </Text>
                        ))}
                      </Alert>
                    )}
                  </>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      </div>
    </Modal>
  );
}
