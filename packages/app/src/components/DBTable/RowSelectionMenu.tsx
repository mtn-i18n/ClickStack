import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { Button, Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconChevronDown,
  IconCopy,
  IconDownload,
  IconX,
} from '@tabler/icons-react';

import { CsvColumn, useCsvExport } from '@/hooks/useCsvExport';
import {
  CLIPBOARD_ERROR_MESSAGE,
  copyTextToClipboard,
} from '@/utils/clipboard';
import { csvExportFilename, downloadCsv, toCsvString } from '@/utils/csv';

import { toExportableRow } from './rowExport';

const RowSelectionMenuItems = ({
  getSelectedRows,
  columns,
  onClear,
}: {
  getSelectedRows: () => Record<string, unknown>[];
  columns: CsvColumn[];
  onClear: () => void;
}) => {
  const { t } = useTranslation('common');
  const selectedRows = useMemo(() => getSelectedRows(), [getSelectedRows]);
  const { csvData, maxRows, isLimited } = useCsvExport(selectedRows, columns);
  const exportRows = useMemo(
    () => selectedRows.slice(0, maxRows),
    [selectedRows, maxRows],
  );

  const copy = useCallback(
    async (format: 'csv' | 'json') => {
      const columnKeys = columns.map(({ dataKey }) => dataKey);
      const text =
        format === 'csv'
          ? toCsvString(csvData)
          : JSON.stringify(
              exportRows.map(row => toExportableRow(row, columnKeys)),
              null,
              2,
            );
      const copied = await copyTextToClipboard(text);
      notifications.show(
        copied
          ? {
              color: 'green',
              message: t('table.copiedRows', {
                count: exportRows.length,
                format: format.toUpperCase(),
              }),
            }
          : { color: 'red', message: CLIPBOARD_ERROR_MESSAGE },
      );
    },
    [columns, csvData, exportRows, t],
  );

  return (
    <>
      {isLimited && (
        <Menu.Label>
          {t('table.rowsLimit', { count: maxRows.toLocaleString() })}
        </Menu.Label>
      )}
      <Menu.Item
        leftSection={<IconDownload size={14} />}
        onClick={() =>
          downloadCsv(csvData, csvExportFilename('hyperdx_selected_rows'))
        }
        data-testid="row-selection-download-csv"
      >
        {t('table.downloadCsv')}
      </Menu.Item>
      <Menu.Item
        leftSection={<IconCopy size={14} />}
        onClick={() => copy('csv')}
        data-testid="row-selection-copy-csv"
      >
        {t('table.copyAsCsv')}
      </Menu.Item>
      <Menu.Item
        leftSection={<IconCopy size={14} />}
        onClick={() => copy('json')}
        data-testid="row-selection-copy-json"
      >
        {t('table.copyAsJson')}
      </Menu.Item>
      <Menu.Item
        leftSection={<IconX size={14} />}
        onClick={onClear}
        data-testid="row-selection-clear"
      >
        {t('table.clearSelection')}
      </Menu.Item>
    </>
  );
};

/** Renders nothing until rows are selected; lives in the table header. */
export const RowSelectionMenu = ({
  selectedCount,
  getSelectedRows,
  columns,
  onClear,
}: {
  selectedCount: number;
  getSelectedRows: () => Record<string, unknown>[];
  columns: CsvColumn[];
  onClear: () => void;
}) => {
  const { t } = useTranslation('common');

  if (selectedCount === 0) {
    return null;
  }

  return (
    <Menu position="bottom-end" width={200}>
      <Menu.Target>
        <Button
          size="compact-xs"
          variant="secondary"
          rightSection={<IconChevronDown size={14} />}
          data-testid="row-selection-count"
        >
          {t('table.selected', { count: selectedCount })}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <RowSelectionMenuItems
          getSelectedRows={getSelectedRows}
          columns={columns}
          onClear={onClear}
        />
      </Menu.Dropdown>
    </Menu>
  );
};
