import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';
import { Trans } from 'react-i18next';
import {
  ClickHouseQueryError,
  isMissingColumnError,
} from '@hyperdx/common-utils/dist/clickhouse';
import { tcFromSource } from '@hyperdx/common-utils/dist/core/metadata';
import {
  isLogSource,
  isTraceSource,
  TSource,
} from '@hyperdx/common-utils/dist/types';
import { Alert, Anchor, Button, Code, Modal, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconAlertTriangle } from '@tabler/icons-react';

import { useBrandDisplayName } from '@/brand';
import { IS_LOCAL_MODE } from '@/config';
import {
  useMaterializedAliasColumnsOption,
  useSelectAllColumnsQuerySettings,
} from '@/hooks/useMaterializedAliasColumnsOption';
import { useTableMetadata } from '@/hooks/useMetadata';

import { TableSourceForm } from './Sources/SourceForm';
import { SQLPreview } from './ChartSQLPreview';

const SelectStar = () => (
  <Text span ff="monospace">
    SELECT *
  </Text>
);

/** A hint to the user that setting the Known Columns List may resolve SELECT * failures on Distributed or Merge tables */
function KnownColumnsListHint({
  onEditClick,
  source,
}: {
  onEditClick?: () => void;
  source: TSource;
}) {
  const { t } = useTranslation('errors');
  const brand = useBrandDisplayName();
  const hasKnownColumnsList =
    (isLogSource(source) || isTraceSource(source)) &&
    !!source.knownColumnsListExpression;

  const message = hasKnownColumnsList ? (
    <Trans
      ns="errors"
      i18nKey="knownColumnsWithList"
      values={{ brand }}
      components={{ b: <b />, code: <SelectStar /> }}
    />
  ) : (
    <Trans
      ns="errors"
      i18nKey="knownColumnsWithoutList"
      values={{ brand }}
      components={{ b: <b />, code: <SelectStar /> }}
    />
  );

  return (
    <Alert
      color="yellow"
      icon={<IconAlertTriangle size={16} />}
      title={t('knownColumnsTitle')}
      data-testid="known-columns-list-hint"
    >
      <Stack gap="xs" align="start">
        <Text size="sm">{message}</Text>
        {IS_LOCAL_MODE ? (
          <Button size="xs" variant="subtle" onClick={onEditClick}>
            {t('editSourceSettings')}
          </Button>
        ) : (
          <Anchor component={Link} href={`/team#source-${source.id}`} size="sm">
            {t('editSourceSettings')}
          </Anchor>
        )}
      </Stack>
    </Alert>
  );
}

// The option lives in the Column Values menu, which a failed row does not show.
function MaterializedAliasColumnsHint({ onHide }: { onHide: () => void }) {
  const { t } = useTranslation('errors');

  return (
    <Alert
      variant="warning"
      icon={<IconAlertTriangle size={16} />}
      title={t('materializedColumnsTitle')}
      data-testid="materialized-alias-columns-hint"
    >
      <Stack gap="xs" align="start">
        <Text size="sm">{t('materializedColumnsBody')}</Text>
        <Button size="xs" variant="subtle" onClick={onHide}>
          {t('hideMaterializedColumns')}
        </Button>
      </Stack>
    </Alert>
  );
}

export function DBRowSidePanelErrorState({
  error,
  source,
}: {
  error: Error | ClickHouseQueryError;
  source: TSource;
}) {
  const { t } = useTranslation('errors');
  const [editOpened, editModal] = useDisclosure(false);
  const { data: tableMetadata } = useTableMetadata(tcFromSource(source));

  const showHint =
    isMissingColumnError(error) && !!tableMetadata?.isPointerTable;
  const selectAllColumnsSettings = useSelectAllColumnsQuerySettings(source);
  const [, setShowMaterializedAliasColumns] =
    useMaterializedAliasColumnsOption();

  return (
    <Stack gap="sm" data-testid="row-error-state">
      <Text>{t('rowLoadError')}</Text>

      {showHint && (
        <KnownColumnsListHint onEditClick={editModal.open} source={source} />
      )}

      {selectAllColumnsSettings != null && (
        <MaterializedAliasColumnsHint
          onHide={() => setShowMaterializedAliasColumns(false)}
        />
      )}

      <Stack align="start">
        <Text size="sm" mt={10}>
          {t('errorMessage')}
        </Text>
        <Code
          flex={1}
          block
          style={{
            whiteSpace: 'pre-wrap',
            maxWidth: '100%',
          }}
        >
          {error.message}
        </Code>
        {error instanceof ClickHouseQueryError && (
          <>
            <Text size="sm" ta="center">
              {t('sentQuery')}
            </Text>
            <SQLPreview data={error?.query} enableLineWrapping enableCopy />
          </>
        )}
      </Stack>
      {IS_LOCAL_MODE && (
        <Modal
          opened={editOpened}
          onClose={editModal.close}
          title={t('editSource')}
          size="xl"
        >
          <TableSourceForm sourceId={source.id} onSave={editModal.close} />
        </Modal>
      )}
    </Stack>
  );
}
