import { useTranslation } from 'next-i18next/pages';
import type { ReactNode } from 'react';

import { Table } from '@/components/Table';
import {
  CollapsibleSection,
  getHeaderColumns,
  NetworkBody,
  SectionWrapper,
} from '@/LogSidePanelElements';
import {
  HTTP_REQUEST_HEADER_PREFIX,
  HTTP_RESPONSE_HEADER_PREFIX,
  HttpHeader,
  parseHttpHeaders,
  toHeaderDisplayCase,
} from '@/utils/httpHeaders';
import { getHttpBody, getHttpBodyTruncation } from '@/utils/httpSpanAttributes';
import type { Attributes } from '@/utils/spanAttributeReaders';

const JSON_TREE_THEME = {
  base00: '#00000000',
  base01: '#383830',
  base02: '#49483e',
  base03: '#75715e',
  base04: '#a59f85',
  base05: '#f8f8f2',
  base06: '#f5f4f1',
  base07: '#f9f8f5',
  base08: '#f92672',
  base09: '#fd971f',
  base0A: '#f4bf75',
  base0B: '#a6e22e',
  base0C: '#a1efe4',
  base0D: '#8378FF',
  base0E: '#ae81ff',
  base0F: '#cc6633',
};

/** A collapsed table of headers or RPC metadata; hidden when empty. */
export function HeaderSection({
  title,
  headers,
}: {
  title: string;
  headers: HttpHeader[];
}) {
  const { t } = useTranslation('search');

  if (headers.length === 0) {
    return null;
  }
  return (
    <CollapsibleSection
      title={t('http.headersTitleWithCount', {
        title,
        count: headers.length,
      })}
      initiallyCollapsed
    >
      <SectionWrapper>
        <Table
          borderless
          hideHeader
          density="compact"
          columns={getHeaderColumns(t)}
          data={headers}
        />
      </SectionWrapper>
    </CollapsibleSection>
  );
}

function BodySection({
  attributes,
  direction,
}: {
  attributes: Attributes;
  direction: 'request' | 'response';
}) {
  const { t } = useTranslation('search');
  const body = getHttpBody(attributes, direction);
  if (body == null) {
    return null;
  }
  const title =
    direction === 'request' ? t('http.requestBody') : t('http.responseBody');
  const truncation = getHttpBodyTruncation(attributes, direction);
  return (
    <CollapsibleSection
      title={
        truncation ? t('http.bodyTruncated', { title, truncation }) : title
      }
    >
      <SectionWrapper>
        <NetworkBody
          body={body}
          theme={JSON_TREE_THEME}
          emptyMessage={
            direction === 'request'
              ? t('http.emptyRequest')
              : t('http.emptyResponse')
          }
          notCollectedMessage={
            direction === 'request'
              ? t('http.noRequestBody')
              : t('http.noResponseBody')
          }
        />
      </SectionWrapper>
    </CollapsibleSection>
  );
}

/**
 * HTTP headers and bodies, each in a collapsible section, after any
 * `children` sections (e.g. RPC metadata).
 */
export function HttpMessageSections({
  attributes,
  children,
}: {
  attributes: Attributes;
  children?: ReactNode;
}) {
  const { t } = useTranslation('search');

  return (
    // A block wrapper so the sections' margins collapse inside a flex Stack.
    <div>
      {children}
      <HeaderSection
        title={t('http.requestHeaders')}
        headers={parseHttpHeaders(attributes, HTTP_REQUEST_HEADER_PREFIX).map(
          toHeaderDisplayCase,
        )}
      />
      <BodySection attributes={attributes} direction="request" />
      <HeaderSection
        title={t('http.responseHeaders')}
        headers={parseHttpHeaders(attributes, HTTP_RESPONSE_HEADER_PREFIX).map(
          toHeaderDisplayCase,
        )}
      />
      <BodySection attributes={attributes} direction="response" />
    </div>
  );
}
