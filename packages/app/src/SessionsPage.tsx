import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useTranslation } from 'next-i18next/pages';
import { sub } from 'date-fns';
import {
  parseAsFloat,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs';
import { useForm, useWatch } from 'react-hook-form';
import { Trans } from 'react-i18next';
import { tcFromSource } from '@hyperdx/common-utils/dist/core/metadata';
import {
  SearchCondition,
  SearchConditionLanguage,
  SourceKind,
} from '@hyperdx/common-utils/dist/types';
import {
  ActionIcon,
  Anchor,
  Button,
  Code,
  Flex,
  Group,
  Paper,
  Stepper,
  Tooltip,
} from '@mantine/core';
import {
  IconDeviceLaptop,
  IconPlayerPlay,
  IconRefresh,
} from '@tabler/icons-react';
import { useVirtualizer } from '@tanstack/react-virtual';

import EmptyState from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { PageLayout } from '@/components/PageLayout';
import { SourceSelectControlled } from '@/components/SourceSelect';
import { TimePicker } from '@/components/TimePicker';
import { useDashboardRefresh } from '@/hooks/useDashboardRefresh';
import { useResolvedSourceParam } from '@/hooks/useResolvedSourceParam';
import { useDefaultTimeRange, useNewTimeQuery } from '@/timeQuery';

import OnboardingModal from './components/OnboardingModal';
import SearchWhereInput, {
  getStoredLanguage,
} from './components/SearchInput/SearchWhereInput';
import { useBrandDisplayName, usePageTitle } from './brand';
import { withAppNavForSurface } from './layout';
import { Session, useSessions } from './sessions';
import SessionSidePanel from './SessionSidePanel';
import { useSource, useSources } from './source';
import { FormatTime } from './useFormatTime';
import { formatDistanceToNowStrictShort } from './utils';

import styles from '@styles/SessionsPage.module.scss';

function SessionCard({
  email,
  maxTime,
  minTime,
  numErrors,
  numEvents,
  onClick,
  sessionId,
}: {
  email: string;
  maxTime: Date;
  minTime: Date;
  numErrors: number;
  numEvents: number;
  onClick: () => void;
  sessionId: string;
}) {
  const { t } = useTranslation('sessions');
  const timeAgo = formatDistanceToNowStrictShort(maxTime);
  const durationStr = new Date(maxTime.getTime() - minTime.getTime())
    .toISOString()
    .slice(11, 19);

  return (
    <div
      data-testid={`session-card-${sessionId}`}
      className={`bg-muted rounded p-3 d-flex align-items-center justify-content-between ${styles.sessionCard}`}
      onClick={onClick}
      role="button"
    >
      <div style={{ width: '50%', maxWidth: 500 }} className={styles.emailText}>
        {email || t('anonymousSession', { id: sessionId })}
      </div>
      <div>
        <div className="text-muted fs-8">
          {t('eventsCount', { count: numEvents })}
        </div>
        {numErrors > 0 && (
          <div className="text-danger fs-8">
            {t('errorsCount', { count: numErrors })}
          </div>
        )}
        <div className="text-muted fs-8">
          {t('durationValue', { duration: durationStr })}
        </div>
      </div>
      <div className="text-end">
        <div>{t('lastActive', { time: timeAgo })}</div>
        <div className="text-muted fs-8 mt-1">
          <Trans
            ns="sessions"
            i18nKey="startedOn"
            components={{ time: <FormatTime value={minTime} /> }}
          />
        </div>
      </div>
    </div>
  );
}

function SessionCardList({
  sessions,
  isSessionLoading,
  onClick,
}: {
  sessions: Session[];
  isSessionLoading?: boolean;
  onClick: (session: Session) => void;
}) {
  const { t } = useTranslation('sessions');
  const brandName = useBrandDisplayName();
  const parentRef = useRef<HTMLDivElement>(null);

  // The virtualizer
  const rowVirtualizer = useVirtualizer({
    count: sessions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 86,
    paddingEnd: 16,
  });

  return (
    <>
      {isSessionLoading === true && (
        <Group mt="md" align="center" justify="center" gap="xs">
          <IconRefresh className="spin-animate" size={14} />
          {t('searchingSessions')}
        </Group>
      )}
      {!isSessionLoading && sessions.length === 0 && (
        <div className="text-center align-items-center justify-content-center my-3">
          {t('common:states.noResults')}
          <div className="text-muted mt-3">{t('noResultsHint')}</div>
          <div className="text-muted mt-3">
            {t('addDataSourceHint', { brand: brandName })}
          </div>
          <Button
            component="a"
            variant="outline-success"
            className="fs-7 mt-3"
            target="_blank"
            href="/docs/install/browser"
          >
            {t('installBrowserIntegration', { brand: brandName })}
          </Button>
        </div>
      )}
      <div
        ref={parentRef}
        style={{
          height: `100%`,
          overflow: 'auto', // Make it scroll!
        }}
      >
        {/* The large inner element to hold all of the items */}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {/* Only the visible items in the virtualizer, manually positioned to be in view */}
          {rowVirtualizer.getVirtualItems().map(virtualItem => {
            const row = sessions[virtualItem.index];

            const {
              errorCount,
              maxTimestamp,
              minTimestamp,
              sessionCount,
              sessionId,
              userEmail,
            } = row;
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                data-index={virtualItem.index}
                ref={rowVirtualizer.measureElement}
              >
                <div className="mb-3">
                  <SessionCard
                    sessionId={sessionId}
                    email={userEmail}
                    numEvents={Number(sessionCount)}
                    numErrors={Number(errorCount)}
                    maxTime={new Date(maxTimestamp)}
                    minTime={new Date(minTimestamp)}
                    onClick={() => {
                      onClick(row);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// Clicks inside the session list keep the session side panel open (so users can
// scroll or pick a different session); clicks anywhere else dismiss it.
const SESSION_LIST_KEEP_OPEN_SELECTOR = '[data-testid="session-card-list"]';
const selectedSessionQueryStateMap = {
  sid: parseAsString,
  sfrom: parseAsFloat,
  sto: parseAsFloat,
};
const appliedConfigMap = {
  sessionSource: parseAsString,
  where: parseAsString.withDefault(''),
  whereLanguage: parseAsStringEnum<'sql' | 'lucene'>(['sql', 'lucene']),
};
const DEFAULT_INTERVAL = 'Past 1h';

function SessionsPage() {
  const { t } = useTranslation('sessions');
  const { t: tNav } = useTranslation('nav');
  const defaultTimeRange = useDefaultTimeRange(DEFAULT_INTERVAL);
  const title = usePageTitle(tNav('pages.clientSessions'));
  const [appliedConfig, setAppliedConfig] = useQueryStates(appliedConfigMap);
  // `?sessionSource=` accepts a source name as well as a source ID. The form
  // holds the resolved ID, so nothing downstream ever sees a name.
  const { source: paramSource } = useResolvedSourceParam(
    appliedConfig.sessionSource,
    { kinds: [SourceKind.Session] },
  );

  const { control, setValue, handleSubmit } = useForm({
    values: {
      where: appliedConfig.where,
      whereLanguage:
        appliedConfig.whereLanguage ?? getStoredLanguage() ?? 'lucene',
      source: paramSource?.id ?? null,
    },
  });

  const where = useWatch({ control, name: 'where' });
  const whereLanguage = useWatch({ control, name: 'whereLanguage' });
  const sourceId = useWatch({ control, name: 'source' });
  // `isLoading` rather than `isPending`: with no source selected the query is
  // disabled, and a disabled query is pending forever — which would render the
  // spinner in place of the setup instructions.
  const { data: sessionSource, isLoading: isSessionSourceLoading } = useSource({
    id: sourceId,
    kinds: [SourceKind.Session],
  });

  const { data: traceTrace } = useSource({
    id: sessionSource?.traceSourceId,
    kinds: [SourceKind.Trace],
  });

  // Get all sources and select the first session type source by default
  const { data: sources } = useSources();

  // Push the selected source into the param when it isn't there yet, and
  // canonicalize a source name URL Param to the ID it resolved to.
  const syncSourceParam = useEffectEvent((formSource: string | null) => {
    if (formSource && formSource !== appliedConfig.sessionSource) {
      setAppliedConfig({ sessionSource: formSource });
    }
  });
  useEffect(() => {
    syncSourceParam(sourceId);
  }, [sourceId]);

  // Auto-select the first session source when the page loads
  useEffect(() => {
    if (sources && sources.length > 0 && !appliedConfig.sessionSource) {
      // Find the first enabled session source
      const sessionSource = sources.find(
        source => source.kind === SourceKind.Session && !source.disabled,
      );
      if (sessionSource) {
        setValue('source', sessionSource.id);
        // This will trigger the other useEffect above to update appliedConfig
      }
    }
  }, [sources, appliedConfig.sessionSource, setValue]);

  const [displayedTimeInputValue, setDisplayedTimeInputValue] =
    useState(DEFAULT_INTERVAL);

  const { searchedTimeRange, onSearch, onTimeRangeSelect } = useNewTimeQuery({
    initialDisplayValue: DEFAULT_INTERVAL,
    initialTimeRange: defaultTimeRange,
    setDisplayedTimeInputValue,
  });

  const { refresh, manualRefreshCooloff } = useDashboardRefresh({
    searchedTimeRange,
    onTimeRangeSelect,
    isLive: false,
  });

  const onSubmit = useCallback(() => {
    onSearch(displayedTimeInputValue);
    handleSubmit(values => {
      const { source, ...rest } = values;
      setAppliedConfig({ sessionSource: source, ...rest });
    })();
  }, [handleSubmit, setAppliedConfig, onSearch, displayedTimeInputValue]);

  // Auto submit when the source changes. Compared against the *resolved* param
  // only: while `?sessionSource=` is still resolving — or when it names no
  // source at all — there is nothing for the form to have diverged from, and
  // submitting would write the empty form source over the param (losing both the
  // link and the "Source not found" warning) and reset the searched time range.
  const submitOnSourceChange = useEffectEvent(() => {
    if (sourceId !== (paramSource?.id ?? null)) {
      onSubmit();
    }
  });
  useEffect(() => {
    submitOnSourceChange();
  }, [sourceId]);

  const [selectedSessionQuery, setSelectedSessionQuery] = useQueryStates(
    selectedSessionQueryStateMap,
    {
      history: 'push',
    },
  );

  const selectedSession = useMemo(() => {
    if (selectedSessionQuery.sid == null) {
      return undefined;
    }
    return {
      id: selectedSessionQuery.sid,
      dateRange: [
        new Date(selectedSessionQuery.sfrom ?? 0),
        new Date(selectedSessionQuery.sto ?? 0),
      ] as [Date, Date],
    };
  }, [
    selectedSessionQuery.sid,
    selectedSessionQuery.sfrom,
    selectedSessionQuery.sto,
  ]);
  const setSelectedSession = useCallback(
    (session: Session | undefined) => {
      if (session == null) {
        setSelectedSessionQuery({
          sid: null,
          sfrom: null,
          sto: null,
        });
      } else {
        setSelectedSessionQuery({
          sid: session.sessionId,
          // WARNING: adding 4 hours offset to fetch the whole rrweb session
          sfrom: sub(new Date(session.minTimestamp), { hours: 4 }).getTime(),
          sto: sub(new Date(session.maxTimestamp), { hours: -4 }).getTime(),
        });
      }
    },
    [setSelectedSessionQuery],
  );

  const { data: tableData, isLoading: isSessionsLoading } = useSessions({
    dateRange: searchedTimeRange,
    sessionSource,
    traceSource: traceTrace,
    // TODO: if selectedSession is not null, we should filter by that session id
    where: appliedConfig.where as SearchCondition,
    whereLanguage: appliedConfig.whereLanguage as SearchConditionLanguage,
  });

  const sessions = tableData?.data ?? [];
  const targetSession = sessions.find(s => s.sessionId === selectedSession?.id);

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <OnboardingModal />
      {selectedSession != null &&
        traceTrace != null &&
        sessionSource != null &&
        targetSession && (
          <SessionSidePanel
            key={`session-page-session-side-panel-${selectedSession.id}`}
            traceSource={traceTrace}
            sessionSource={sessionSource}
            sessionId={selectedSession.id}
            dateRange={selectedSession.dateRange}
            session={targetSession}
            onClose={() => {
              setSelectedSession(undefined);
            }}
            keepOpenSelector={SESSION_LIST_KEEP_OPEN_SELECTOR}
            whereLanguage={whereLanguage || undefined}
            where={where || undefined}
            onLanguageChange={lang =>
              setAppliedConfig(prev => ({ ...prev, whereLanguage: lang }))
            }
          />
        )}
      <form
        className={`SessionsPage ${styles.pageForm}`}
        data-testid="sessions-search-form"
        onSubmit={e => {
          e.preventDefault();
          onSubmit();
          return false;
        }}
      >
        <PageLayout
          data-testid="sessions-page"
          header={
            <PageHeader growing>
              <Group
                justify="space-between"
                gap="xs"
                wrap="nowrap"
                w="100%"
                align="flex-start"
                className={styles.toolbar}
              >
                <SourceSelectControlled
                  control={control}
                  name="source"
                  allowedSourceKinds={[SourceKind.Session]}
                />
                <SearchWhereInput
                  tableConnection={tcFromSource(traceTrace)}
                  // The WHERE runs against the trace source
                  sourceId={traceTrace?.id}
                  dateRange={searchedTimeRange}
                  control={control}
                  name="where"
                  onSubmit={onSubmit}
                  enableHotkey
                  width="50%"
                />
                <TimePicker
                  inputValue={displayedTimeInputValue}
                  setInputValue={setDisplayedTimeInputValue}
                  onSearch={range => {
                    onSearch(range);
                  }}
                />
                <Button
                  variant="primary"
                  type="submit"
                  px="sm"
                  leftSection={<IconPlayerPlay size={16} />}
                  style={{ flexShrink: 0 }}
                >
                  {t('run')}
                </Button>
                <Tooltip
                  withArrow
                  label={t('refreshResults')}
                  fz="xs"
                  color="gray"
                >
                  <ActionIcon
                    onClick={refresh}
                    loading={manualRefreshCooloff}
                    disabled={manualRefreshCooloff}
                    variant="secondary"
                    title={t('refreshResults')}
                    size="input-sm"
                  >
                    <IconRefresh size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </PageHeader>
          }
          padded
          content={
            <>
              {isSessionsLoading || isSessionSourceLoading ? (
                <Group mt="md" align="center" justify="center" gap="xs">
                  <IconRefresh className="spin-animate" size={14} />
                  {isSessionSourceLoading
                    ? t('loading')
                    : t('searchingSessions')}
                </Group>
              ) : (
                <>
                  {!sessions.length ? (
                    <Flex
                      align="center"
                      justify="center"
                      style={{ flex: 1, minHeight: 0 }}
                    >
                      <SessionSetupInstructions />
                    </Flex>
                  ) : (
                    <div
                      style={{ minHeight: 0 }}
                      data-testid="session-card-list"
                    >
                      <SessionCardList
                        onClick={session => {
                          setSelectedSession(session);
                        }}
                        sessions={sessions}
                        isSessionLoading={isSessionsLoading}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          }
        />
      </form>
    </>
  );
}

const SessionsPageDynamic = dynamic(async () => SessionsPage, {
  ssr: false,
});

// @ts-expect-error for getLayout
SessionsPageDynamic.getLayout = withAppNavForSurface('session-replay');

export default SessionsPageDynamic;

function SessionSetupInstructions() {
  const { t } = useTranslation('sessions');
  const brandName = useBrandDisplayName();
  return (
    <EmptyState
      icon={<IconDeviceLaptop size={32} />}
      title={t('setupTitle')}
      description={
        <Trans
          ns="sessions"
          i18nKey="setupDescription"
          values={{ brand: brandName }}
        />
      }
      maw={600}
    >
      <Paper withBorder radius="md" p="xl">
        <Stepper active={-1} orientation="vertical" size="md">
          <Stepper.Step
            label={
              <Trans
                ns="sessions"
                i18nKey="step1Label"
                components={{ code: <Code /> }}
              />
            }
            description={
              <Trans
                ns="sessions"
                i18nKey="step1Description"
                components={{ code: <Code /> }}
              />
            }
          />
          <Stepper.Step
            label={
              <Trans
                ns="sessions"
                i18nKey="step2Label"
                components={{ code: <Code /> }}
              />
            }
            description={
              <Trans
                ns="sessions"
                i18nKey="step2Description"
                components={{ code: <Code /> }}
              />
            }
          />
          <Stepper.Step
            label={t('step3Label')}
            description={
              <Trans
                ns="sessions"
                i18nKey="step3Description"
                values={{ brand: brandName }}
                components={{
                  link: (
                    <Anchor
                      href="https://clickhouse.com/docs/use-cases/observability/clickstack/sdks/browser"
                      target="_blank"
                      rel="noopener noreferrer"
                      size="xs"
                    />
                  ),
                }}
              />
            }
          />
        </Stepper>
      </Paper>
    </EmptyState>
  );
}
