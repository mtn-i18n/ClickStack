import { useCallback, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';
import { parseAsJson, parseAsString, useQueryState } from 'nuqs';
import { useForm } from 'react-hook-form';
import { useHotkeys } from 'react-hotkeys-hook';
import { Trans } from 'react-i18next';
import { Badge, Separator } from '@clickhouse/click-ui';
import { SavedChartConfig, SourceKind } from '@hyperdx/common-utils/dist/types';
import {
  Alert,
  Anchor,
  Box,
  Button,
  Collapse,
  Divider,
  Group,
  Loader,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconChevronDown,
  IconChevronUp,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';

import api from '@/api';
import { useBrandDisplayName, usePageTitle } from '@/brand';
import { DEFAULT_CHART_CONFIG } from '@/ChartUtils';
import EditTimeChartForm from '@/components/DBEditTimeChartForm';
import { InputControlled } from '@/components/InputControlled';
import { SourceSelectControlled } from '@/components/SourceSelect';
import { IS_ALERT_DETAILS_ENABLED } from '@/config';
import { useChartAssistant } from '@/hooks/ai';
import { useAlertSeededChartConfig } from '@/hooks/useAlertSeededChartConfig';
import { useResolvedSourceParam } from '@/hooks/useResolvedSourceParam';
import { withAppNavForSurface } from '@/layout';
import { useSources } from '@/source';
import { useDefaultTimeRange, useNewTimeQuery } from '@/timeQuery';
import { useLocalStorage } from '@/utils';
import { buildInlineAlertPayload } from '@/utils/alerts';
import { getApiErrorMessage } from '@/utils/apiErrors';

import OnboardingModal from './components/OnboardingModal';

// Autocomplete can focus on column/map keys

// Sampled field discovery and full field discovery

function AIAssistant({
  setConfig,
  onTimeRangeSelect,
  submitRef,
  aiAssistantEnabled,
}: {
  setConfig: (config: SavedChartConfig) => void;
  onTimeRangeSelect: (start: Date, end: Date) => void;
  submitRef: React.RefObject<(() => void) | undefined>;
  aiAssistantEnabled: boolean;
}) {
  const brandName = useBrandDisplayName();
  const { t } = useTranslation('dashboards');
  const { t: tSearch } = useTranslation('search');
  const [opened, setOpened] = useState(false);
  const [alertDismissed, setAlertDismissed] = useLocalStorage(
    'ai-assistant-alert-dismissed',
    false,
  );
  const { control, handleSubmit } = useForm<{
    text: string;
    source: string;
  }>({
    defaultValues: {
      text: '',
      source: '',
    },
  });

  const chartAssistant = useChartAssistant();

  const onSubmit = (data: { text: string; source: string }) => {
    chartAssistant.mutate(
      {
        sourceId: data.source,
        text: data.text,
      },
      {
        onSuccess(data) {
          setConfig({ ...data, where: '' });
          onTimeRangeSelect(
            new Date(data.dateRange[0]),
            new Date(data.dateRange[1]),
          );

          // FIXME: This is a hack to submit after the form has been updated
          setTimeout(() => {
            if (submitRef.current) {
              submitRef.current();
            }
          }, 100);

          notifications.show({
            color: 'green',
            message: tSearch('aiAssistant.chartGenerated'),
            autoClose: 2000,
          });
        },
        onError(err) {
          notifications.show({
            color: 'red',
            title: tSearch('aiAssistant.errorGeneratingChart'),
            message: err.message,
            autoClose: 2000,
          });
        },
      },
    );
  };

  useHotkeys(
    'a',
    () => {
      setOpened(v => !v);
    },
    {
      preventDefault: true,
    },
  );

  if (!aiAssistantEnabled && !alertDismissed) {
    return (
      <Box mb="sm">
        <Alert
          color="dark"
          icon={<IconInfoCircle size={16} />}
          variant="outline"
          withCloseButton
          onClose={() => setAlertDismissed(true)}
          p="xxs"
        >
          <Text size="xs" pt="2px">
            <Trans
              ns="dashboards"
              i18nKey="aiAssistant.notice"
              values={{ brand: brandName }}
              components={{ code: <code /> }}
            />
          </Text>
        </Alert>
        <Divider mt="sm" />
      </Box>
    );
  } else if (!aiAssistantEnabled) {
    return null;
  }

  return (
    <Box mb="sm">
      <Group gap="md" align="center" mb="sm">
        <Button onClick={() => setOpened(o => !o)} size="xs" variant="subtle">
          <Group gap="xs">
            {opened ? (
              <IconChevronUp size={14} />
            ) : (
              <IconChevronDown size={14} />
            )}
            <Text size="xxs">{t('aiAssistant.title')}</Text>
          </Group>
        </Button>
        <Badge size="sm" text={t('aiAssistant.experimental')} state="info" />
      </Group>
      <Collapse expanded={opened}>
        {opened && (
          // eslint-disable-next-line react-hooks/refs
          <form onSubmit={handleSubmit(onSubmit)}>
            <Group mb="md">
              <SourceSelectControlled
                autoFocus
                size="xs"
                control={control}
                name="source"
                data-testid="source-selector"
                allowedSourceKinds={[SourceKind.Log, SourceKind.Trace]}
              />
              <Box style={{ flexGrow: 1, minWidth: 100 }}>
                <InputControlled
                  placeholder={tSearch('saveSearchModal.namePlaceholder')}
                  data-testid="save-search-name-input"
                  control={control}
                  name="text"
                  rules={{ required: true }}
                  size="xs"
                />
              </Box>
              {chartAssistant.isPending ? (
                <Loader size="xs" type="dots" />
              ) : (
                <Button type="submit" size="xs" variant="primary">
                  {t('aiAssistant.generate')}
                </Button>
              )}
            </Group>
          </form>
        )}
      </Collapse>
      <Separator size="xs" />
    </Box>
  );
}

const DEFAULT_INTERVAL = 'Past 1h';

function DBChartExplorerPage() {
  const { t } = useTranslation('nav');
  const { t: tAlerts } = useTranslation('alerts');
  const defaultTimeRange = useDefaultTimeRange(DEFAULT_INTERVAL);
  const title = usePageTitle(t('pages.chartExplorer'));
  const {
    searchedTimeRange,
    displayedTimeInputValue,
    setDisplayedTimeInputValue,
    onSearch,
    onTimeRangeSelect,
  } = useNewTimeQuery({
    initialDisplayValue: DEFAULT_INTERVAL,
    initialTimeRange: defaultTimeRange,
    // showRelativeInterval: isLive,
  });

  const submitRef = useRef<(() => void) | undefined>(undefined);
  const { data: sources } = useSources();
  const { data: me } = api.useMe();
  const queryClient = useQueryClient();
  const createAlert = api.useCreateAlert();

  const [rawChartConfig, setChartConfig] = useQueryState(
    'config',
    parseAsJson<SavedChartConfig>().withDefault({
      ...DEFAULT_CHART_CONFIG,
      source: sources?.[0]?.id ?? '',
      connection: sources?.[0]?.connection,
    }),
  );

  // Opens the explorer on an inline alert's persisted query. `history:
  // 'replace'` so the transient param doesn't leave a back-button step that
  // would re-seed over the user's edits.
  const [alertId, setAlertId] = useQueryState(
    'alertId',
    parseAsString.withOptions({ history: 'replace' }),
  );
  const clearAlertId = useCallback(() => {
    setAlertId(null);
  }, [setAlertId]);
  const isSeedingFromAlert = useAlertSeededChartConfig({
    alertId,
    setChartConfig,
    clearAlertId,
  });

  // `config.source` accepts a source name as well as a source ID. Resolve to a source object here.
  const { source: paramSource } = useResolvedSourceParam(rawChartConfig.source);

  const chartConfig = useMemo(() => {
    if (!rawChartConfig.source) return rawChartConfig;
    return { ...rawChartConfig, source: paramSource?.id ?? '' };
  }, [rawChartConfig, paramSource?.id]);

  // Creates an alert that carries this chart's config (an inline alert), with
  // no saved search or dashboard tile behind it. The alert is dropped from the
  // explorer's config afterwards: it now lives on the alert document, and
  // leaving it in the URL would offer to create a second copy.
  const onSaveAlert = useCallback(
    async (config: SavedChartConfig) => {
      const payload = buildInlineAlertPayload(config);
      if (payload == null) return;

      try {
        const { data: created } = await createAlert.mutateAsync(payload);
        queryClient.invalidateQueries({ queryKey: api.getAlertsQueryKey() });
        setChartConfig({ ...config, alert: undefined });
        notifications.show({
          color: 'green',
          message: (
            <Trans
              ns="alerts"
              i18nKey="inlineAlert.created"
              components={{
                link: (
                  <Anchor
                    component={Link}
                    href={
                      IS_ALERT_DETAILS_ENABLED && created?.id
                        ? `/alerts/${created.id}`
                        : '/alerts'
                    }
                    inherit
                    underline="always"
                  />
                ),
              }}
            />
          ),
          autoClose: 5000,
        });
      } catch (error) {
        console.error('Failed to create alert:', error);
        notifications.show({
          color: 'red',
          title: tAlerts('inlineAlert.errorTitle'),
          // The API validates more than the editor can (raw SQL templates,
          // source/connection ownership, formula references), so its reason is
          // usually the only thing that says what to fix.
          message: await getApiErrorMessage(
            error,
            tAlerts('inlineAlert.errorMessage'),
          ),
          autoClose: 5000,
        });
      }
    },
    [createAlert, queryClient, setChartConfig, tAlerts],
  );

  return (
    <Box data-testid="chart-explorer-page" p="sm">
      <Head>
        <title>{title}</title>
      </Head>
      <OnboardingModal />
      <AIAssistant
        setConfig={setChartConfig}
        onTimeRangeSelect={onTimeRangeSelect}
        submitRef={submitRef}
        aiAssistantEnabled={me?.aiAssistantEnabled ?? false}
      />
      {/* Held back until an `alertId` seed resolves: the form auto-runs once
          on mount, and mounting it early would run the default config and
          then swap the query out from under the result. */}
      {isSeedingFromAlert ? (
        <Stack gap="md" data-testid="chart-explorer-loading">
          <Skeleton h={32} w="40%" />
          <Skeleton h={320} w="100%" />
        </Stack>
      ) : (
        <EditTimeChartForm
          data-testid="chart-explorer-form"
          chartConfig={chartConfig}
          setChartConfig={config => {
            setChartConfig(config);
          }}
          dateRange={searchedTimeRange}
          setDisplayedTimeInputValue={setDisplayedTimeInputValue}
          displayedTimeInputValue={displayedTimeInputValue}
          onTimeRangeSearch={onSearch}
          onTimeRangeSelect={onTimeRangeSelect}
          submitRef={submitRef}
          autoRun
          enableAlerts
          onSaveAlert={onSaveAlert}
          saveAlertLabel={tAlerts('createAlert')}
          isSavingAlert={createAlert.isPending}
        />
      )}
    </Box>
  );
}

const DBChartExplorerPageDynamic = dynamic(async () => DBChartExplorerPage, {
  ssr: false,
});

// @ts-expect-error next/dynamic component type does not include the getLayout static
DBChartExplorerPageDynamic.getLayout = withAppNavForSurface('chart-explorer');

export default DBChartExplorerPageDynamic;
