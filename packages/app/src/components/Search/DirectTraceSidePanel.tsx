import { ReactNode, useEffect, useMemo } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { useForm, useWatch } from 'react-hook-form';
import { SourceKind } from '@hyperdx/common-utils/dist/types';
import { Box, Drawer, Flex, Group, Text } from '@mantine/core';
import { IconConnection } from '@tabler/icons-react';

import DBTracePanel from '@/components/DBTracePanel';
import EmptyState from '@/components/EmptyState';
import { SourceSelectControlled } from '@/components/SourceSelect';
import { useCloseOnClickOutside } from '@/hooks/useCloseOnClickOutside';
import { useSource } from '@/source';

interface DirectTraceSidePanelProps {
  opened: boolean;
  traceId: string;
  traceSourceId?: string | null;
  dateRange: [Date, Date];
  focusDate: Date;
  onClose: () => void;
  onSourceChange: (sourceId: string | null) => void;
  closeOnClickOutside?: boolean;
  keepOpenSelector?: string;
}

export default function DirectTraceSidePanel({
  opened,
  traceId,
  traceSourceId,
  dateRange,
  focusDate,
  onClose,
  onSourceChange,
  closeOnClickOutside = true,
  keepOpenSelector,
}: DirectTraceSidePanelProps) {
  const { t } = useTranslation('search');
  useCloseOnClickOutside({
    enabled: closeOnClickOutside && opened,
    keepOpenSelector,
    onClose,
  });

  const { control, setValue } = useForm<{ source: string | null }>({
    defaultValues: {
      source: traceSourceId ?? null,
    },
  });

  useEffect(() => {
    setValue('source', traceSourceId ?? null);
  }, [setValue, traceSourceId]);

  const selectedSourceId = useWatch({ control, name: 'source' });

  useEffect(() => {
    if ((selectedSourceId ?? null) !== (traceSourceId ?? null)) {
      onSourceChange(selectedSourceId ?? null);
    }
  }, [onSourceChange, selectedSourceId, traceSourceId]);

  const {
    data: traceSource,
    error: traceSourceError,
    isLoading: isTraceSourceLoading,
  } = useSource({
    id: selectedSourceId,
    kinds: [SourceKind.Trace],
  });

  const emptyState = useMemo<ReactNode>(() => {
    let title = t('directTrace.selectTitle');
    let description = t('directTrace.selectDescription');

    if (traceSourceError) {
      title = t('directTrace.unableTitle');
      description = t('directTrace.unableDescription');
    } else if (selectedSourceId && isTraceSourceLoading) {
      title = t('directTrace.loadingTitle');
      description = t('directTrace.loadingDescription');
    } else if (selectedSourceId && !traceSource) {
      title = t('directTrace.notFoundTitle');
      description = t('directTrace.notFoundDescription');
    }

    return (
      <EmptyState
        icon={<IconConnection size={24} />}
        title={title}
        description={description}
        variant="card"
        fullWidth
        mt="md"
      />
    );
  }, [
    isTraceSourceLoading,
    selectedSourceId,
    traceSource,
    traceSourceError,
    t,
  ]);

  const shouldRenderTracePanel =
    opened && traceId.length > 0 && traceSource?.kind === SourceKind.Trace;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="75vw"
      lockScroll={false}
      withOverlay={false}
      trapFocus={false}
      title={
        <Group gap="xs">
          <IconConnection size={16} />
          <Text fw={600}>{t('common:trace')}</Text>
        </Group>
      }
      styles={{
        body: {
          height: '100%',
          overflowY: 'auto',
        },
      }}
    >
      <Flex justify="flex-end" mb="sm">
        <Group gap="sm" align="center">
          <Text size="sm">{t('directTrace.traceSource')}</Text>
          <SourceSelectControlled
            control={control}
            name="source"
            size="xs"
            allowedSourceKinds={[SourceKind.Trace]}
          />
        </Group>
      </Flex>
      <Box h="100%">
        {opened ? (
          shouldRenderTracePanel ? (
            <DBTracePanel
              traceId={traceId}
              parentSourceId={traceSource.id}
              childSourceId={traceSource.logSourceId}
              dateRange={dateRange}
              focusDate={focusDate}
              emptyState={
                <EmptyState
                  icon={<IconConnection size={24} />}
                  title={t('directTrace.traceNotFoundTitle')}
                  description={t('directTrace.traceNotFoundDescription')}
                  variant="card"
                  fullWidth
                  mt="md"
                />
              }
            />
          ) : (
            emptyState
          )
        ) : null}
      </Box>
    </Drawer>
  );
}
