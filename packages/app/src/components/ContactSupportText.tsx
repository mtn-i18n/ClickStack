import { Trans, useTranslation } from 'next-i18next/pages';
import { Link } from '@clickhouse/click-ui';

import { IS_OSS } from '@/config';

import styles from './ContactSupportText.module.scss';

const GH_LINK = 'https://github.com/ClickHouse/ClickStack/issues';

export const ContactSupportText = () => {
  const { t } = useTranslation('common');
  if (IS_OSS) {
    return (
      <span>
        <Trans
          i18nKey="contactSupport.github"
          components={{
            link: (
              <Link
                className={styles.inlineLink}
                href={GH_LINK}
                target="_blank"
                rel="noopener noreferrer"
              />
            ),
          }}
        />
      </span>
    );
  }

  return <span>{t('contactSupport.default')}</span>;
};
