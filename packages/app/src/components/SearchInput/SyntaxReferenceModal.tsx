import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'next-i18next/pages';
import type { TFunction } from 'i18next';
import {
  Box,
  Code,
  Divider,
  Group,
  Modal,
  ScrollArea,
  SegmentedControl,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconExternalLink, IconSearch } from '@tabler/icons-react';

import { useBrandDisplayName } from '@/brand';

type Language = 'sql' | 'lucene';

type Row = { expr: string; descKey: string };
type Section = { titleKey: string; rows: Row[] };

const SQL_SECTIONS: Section[] = [
  {
    titleKey: 'syntax.stringMatching',
    rows: [
      { expr: "ServiceName = 'api'", descKey: 'syntax.desc.exactMatch' },
      {
        expr: "Body = 'connection refused'",
        descKey: 'syntax.desc.exactPhraseMatch',
      },
      {
        expr: "Body ILIKE '%timeout%'",
        descKey: 'syntax.desc.substringSearch',
      },
      {
        expr: "Body LIKE '%timeout%'",
        descKey: 'syntax.desc.substringMatch',
      },
      {
        expr: "hasAllTokens(Body, 'connection timeout')",
        descKey: 'syntax.desc.fullTextSearch',
      },
      {
        expr: "ServiceName LIKE 'auth-%'",
        descKey: 'syntax.desc.prefixWildcard',
      },
      {
        expr: "match(SpanName, '^/api/(checkout|payment)/.*')",
        descKey: 'syntax.desc.regularExpression',
      },
    ],
  },
  {
    titleKey: 'syntax.booleanOperators',
    rows: [
      {
        expr: "ServiceName = 'api' AND SpanName = 'checkout'",
        descKey: 'syntax.desc.bothMustMatch',
      },
      {
        expr: "ServiceName = 'api' OR ServiceName = 'worker'",
        descKey: 'syntax.desc.eitherMatches',
      },
      {
        expr: "ServiceName IN ('api', 'worker')",
        descKey: 'syntax.desc.matchOneOfMultiple',
      },
      {
        expr: "ServiceName != 'healthcheck'",
        descKey: 'syntax.desc.excludeValue',
      },
      {
        expr: "(StatusCode = 500 OR StatusCode = 503) AND ServiceName = 'api'",
        descKey: 'syntax.desc.nestedBooleanLogic',
      },
      {
        expr: 'Duration > 1000000',
        descKey: 'syntax.desc.numericComparison',
      },
      {
        expr: 'Duration BETWEEN 100 AND 1000',
        descKey: 'syntax.desc.rangeInclusive',
      },
      {
        expr: 'Duration / 1e6 > 100',
        descKey: 'syntax.desc.mathExpression',
      },
    ],
  },
  {
    titleKey: 'syntax.existenceAbsence',
    rows: [
      {
        expr: 'notEmpty(StatusCode)',
        descKey: 'syntax.desc.fieldExists',
      },
      { expr: 'empty(Body)', descKey: 'syntax.desc.fieldAbsent' },
    ],
  },
  {
    titleKey: 'syntax.map',
    rows: [
      {
        expr: "LogAttributes['http.method'] = 'POST'",
        descKey: 'syntax.desc.mapAttributeAccess',
      },
      {
        expr: "LogAttributes.http.method = 'POST'",
        descKey: 'syntax.desc.jsonAttributeAccess',
      },
    ],
  },
  {
    titleKey: 'syntax.arrays',
    rows: [
      {
        expr: "has(Events.Name, 'exception')",
        descKey: 'syntax.desc.arrayContains',
      },
    ],
  },
];

const LUCENE_SECTIONS: Section[] = [
  {
    titleKey: 'syntax.stringMatching',
    rows: [
      {
        expr: 'ServiceName:"api"',
        descKey: 'syntax.desc.fieldExactMatch',
      },
      {
        expr: 'ServiceName:api',
        descKey: 'syntax.desc.fieldSubstringMatch',
      },
      {
        expr: '"connection refused"',
        descKey: 'syntax.desc.phraseMatchImplicit',
      },
      {
        expr: 'timeout',
        descKey: 'syntax.desc.tokenMatchImplicit',
      },
      {
        expr: 'auth-*',
        descKey: 'syntax.desc.prefixMatchImplicit',
      },
      {
        expr: '*-auth',
        descKey: 'syntax.desc.suffixMatchImplicit',
      },
      {
        expr: '*checkout*',
        descKey: 'syntax.desc.substringMatchImplicit',
      },
      {
        expr: 'Duration:[100 TO 500]',
        descKey: 'syntax.desc.numericRangeInclusive',
      },
      {
        expr: 'Duration:{100 TO 500}',
        descKey: 'syntax.desc.numericRangeExclusive',
      },
      {
        expr: 'Duration:[100 TO *]',
        descKey: 'syntax.desc.openEndedRangeGte',
      },
      {
        expr: 'Duration:[* TO 500]',
        descKey: 'syntax.desc.openEndedRangeLte',
      },
      {
        expr: 'Timestamp:[2024-01-01 TO 2024-06-01]',
        descKey: 'syntax.desc.dateStringRangeInclusive',
      },
      {
        expr: 'Duration:>1000000',
        descKey: 'syntax.desc.greaterThanComparison',
      },
    ],
  },
  {
    titleKey: 'syntax.booleanOperators',
    rows: [
      {
        expr: 'ServiceName:api AND SpanName:checkout',
        descKey: 'syntax.desc.bothConditionsMatch',
      },
      {
        expr: 'ServiceName:api OR ServiceName:worker',
        descKey: 'syntax.desc.eitherConditionMatches',
      },
      {
        expr: 'ServiceName:(api OR worker)',
        descKey: 'syntax.desc.matchMultipleValuesOneField',
      },
      {
        expr: 'NOT ServiceName:healthcheck',
        descKey: 'syntax.desc.excludeMatches',
      },
      {
        expr: '-ServiceName:healthcheck',
        descKey: 'syntax.desc.shorthandForNot',
      },
      {
        expr: '(ServiceName:api OR ServiceName:worker) AND StatusCode:500',
        descKey: 'syntax.desc.nestedBooleanLogic',
      },
    ],
  },
  {
    titleKey: 'syntax.existenceAbsence',
    rows: [
      {
        expr: 'StatusCode:*',
        descKey: 'syntax.desc.fieldExistsNotNullEmpty',
      },
      {
        expr: '-Body:*',
        descKey: 'syntax.desc.fieldAbsentNullEmpty',
      },
    ],
  },
  {
    titleKey: 'syntax.map',
    rows: [
      {
        expr: 'LogAttributes.http.method:POST',
        descKey: 'syntax.desc.accessMapAttributeKey',
      },
      {
        expr: 'ResourceAttributes.service.env:prod',
        descKey: 'syntax.desc.mapJsonAttributeFilter',
      },
    ],
  },
  {
    titleKey: 'syntax.arrays',
    rows: [
      {
        expr: 'Events.Name:"exception"',
        descKey: 'syntax.desc.arrayContains',
      },
    ],
  },
];

function filterSections(
  sections: Section[],
  query: string,
  t: TFunction,
): Section[] {
  if (!query.trim()) return sections;
  const q = query.toLowerCase();
  return sections
    .map(section => ({
      ...section,
      rows: section.rows.filter(
        row =>
          row.expr.toLowerCase().includes(q) ||
          t(row.descKey).toLowerCase().includes(q),
      ),
    }))
    .filter(section => section.rows.length > 0);
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark
        style={{
          background: 'var(--mantine-color-yellow-4)',
          color: 'inherit',
          borderRadius: 2,
          padding: '0 1px',
        }}
      >
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function SyntaxTable({
  sections,
  query,
}: {
  sections: Section[];
  query: string;
}) {
  const { t } = useTranslation('search');
  const filtered = useMemo(
    () => filterSections(sections, query, t),
    [sections, query, t],
  );

  if (filtered.length === 0) {
    return (
      <Text size="sm" style={{ color: 'var(--color-text-muted)' }} mt="sm">
        {t('syntax.noResults', { query })}
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      {filtered.map((section, si) => (
        <Box key={section.titleKey}>
          {si > 0 && <Divider mb={4} />}
          <Title
            order={6}
            mt="sm"
            mb={4}
            style={{ color: 'var(--color-text)' }}
          >
            {t(section.titleKey)}
          </Title>
          <Table withColumnBorders={false} withRowBorders={false} fz="sm">
            <Table.Tbody>
              {section.rows.map(row => (
                <Table.Tr key={row.expr}>
                  <Table.Td style={{ width: '55%' }}>
                    <Code
                      style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
                    >
                      <Highlight text={row.expr} query={query} />
                    </Code>
                  </Table.Td>
                  <Table.Td>
                    <Text
                      size="sm"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <Highlight text={t(row.descKey)} query={query} />
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      ))}
    </Stack>
  );
}

export default function SyntaxReferenceModal({
  opened,
  onClose,
  language: initialLanguage,
}: {
  opened: boolean;
  onClose: () => void;
  language: Language;
}) {
  const brandName = useBrandDisplayName();
  const { t } = useTranslation('search');
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [query, setQuery] = useState('');

  // Sync tab when the modal opens or caller switches language externally
  useEffect(() => {
    if (opened) setLanguage(initialLanguage);
  }, [opened, initialLanguage]);

  const sections = language === 'sql' ? SQL_SECTIONS : LUCENE_SECTIONS;

  return (
    <Modal
      opened={opened}
      onClose={() => {
        setQuery('');
        onClose();
      }}
      title={<Text fw={600}>{t('syntax.title')}</Text>}
      size="xl"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="sm" pb="md">
        <Group align="center">
          <SegmentedControl
            size="xs"
            value={language}
            onChange={val => {
              setLanguage(val as Language);
              setQuery('');
            }}
            data={[
              { value: 'lucene', label: 'Lucene' },
              { value: 'sql', label: 'SQL' },
            ]}
          />
          <TextInput
            placeholder={t('syntax.filterPlaceholder')}
            leftSection={<IconSearch size={14} />}
            value={query}
            onChange={e => setQuery(e.currentTarget.value)}
            autoFocus
            size="xs"
            style={{ flex: 1 }}
          />
          <Tooltip
            label={t('syntax.docsTooltip', { brand: brandName })}
            withArrow
          >
            <Text
              size="xs"
              c="dimmed"
              component="a"
              href="https://clickhouse.com/docs/use-cases/observability/clickstack/search"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', lineHeight: 1 }}
            >
              <IconExternalLink size={14} />
            </Text>
          </Tooltip>
        </Group>
        <SyntaxTable sections={sections} query={query} />
      </Stack>
    </Modal>
  );
}
