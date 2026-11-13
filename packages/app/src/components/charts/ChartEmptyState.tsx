import { useTranslation } from 'next-i18next/pages';
import { Loader } from '@mantine/core';

export default function ChartEmptyState({
  isLoading = false,
}: {
  isLoading?: boolean;
}) {
  const { t } = useTranslation('charts');

  return (
    <div className="d-flex h-100 w-100 align-items-center justify-content-center text-muted">
      {isLoading && <Loader size="xs" mr="xs" />}
      {isLoading ? t('emptyLoading') : t('emptyNoData')}
    </div>
  );
}
