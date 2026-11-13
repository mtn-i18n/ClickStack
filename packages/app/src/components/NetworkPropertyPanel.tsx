import { ReactNode } from 'react';
import { useTranslation } from 'next-i18next/pages';
import type { TFunction } from 'i18next';
import { Badge } from '@clickhouse/click-ui';
import { Group, Stack } from '@mantine/core';

import { CurlGenerator } from '@/utils/curlGenerator';
import {
  getReplayableHeaders,
  HTTP_REQUEST_HEADER_PREFIX,
  parseHttpHeaders,
  toHeaderDisplayCase,
} from '@/utils/httpHeaders';
import {
  getHttpBody,
  getHttpMessageSize,
  getHttpMethod,
  getHttpProtocol,
  getHttpResendCount,
  getHttpRoute,
  getHttpStatusCode,
  getHttpStatusText,
  getUserAgent,
} from '@/utils/httpSpanAttributes';
import { getHttpUrl, isAbsoluteHttpUrl } from '@/utils/httpUrl';
import { isRpcSpan } from '@/utils/rpcSpanAttributes';
import {
  Attributes,
  firstSetString,
  getClientAddress,
  getLocalAddress,
  getNetworkPeerAddress,
} from '@/utils/spanAttributeReaders';

import { HttpMessageSections } from './HttpMessageSections';
import { RequestDetailRow, RequestDetailsTable } from './RequestDetailsTable';
import { getHttpStatusBadge, RequestLine } from './RequestLine';
import { RpcCallSubpanel } from './RpcCallPanel';

function buildCurl(attributes: Attributes, url: string, method?: string) {
  const body = getHttpBody(attributes, 'request');
  return CurlGenerator({
    method,
    headers: getReplayableHeaders(
      parseHttpHeaders(attributes, HTTP_REQUEST_HEADER_PREFIX),
    )
      .map(toHeaderDisplayCase)
      .map(h => [h.name, h.value]),
    url,
    body:
      typeof body === 'string' || (typeof body === 'object' && body !== null)
        ? body
        : undefined,
  });
}

function userAgentValue(attributes: Attributes): ReactNode {
  const userAgent = getUserAgent(attributes);
  const syntheticType = firstSetString(attributes, [
    'user_agent.synthetic.type',
  ]);
  if (userAgent == null || syntheticType == null) {
    return userAgent;
  }
  return (
    <Group gap={6} wrap="nowrap" align="flex-start">
      <span>{userAgent}</span>
      <Badge text={syntheticType} size="sm" state="neutral" />
    </Group>
  );
}

function getDetailRows(
  attributes: Attributes,
  statusCode: number | undefined,
  t: TFunction,
): RequestDetailRow[] {
  const errorType = firstSetString(attributes, ['error.type']);
  const resends = getHttpResendCount(attributes);
  return [
    [t('http.details.route'), getHttpRoute(attributes)],
    // Instrumentations set error.type to the status code, which the badge
    // already shows.
    [
      t('http.details.errorType'),
      errorType !== String(statusCode) ? errorType : undefined,
    ],
    [t('http.details.protocol'), getHttpProtocol(attributes)],
    [t('http.details.remoteAddress'), getNetworkPeerAddress(attributes)],
    [t('http.details.clientAddress'), getClientAddress(attributes)],
    [t('http.details.localAddress'), getLocalAddress(attributes)],
    [t('http.details.userAgent'), userAgentValue(attributes)],
    [t('http.details.requestSize'), getHttpMessageSize(attributes, 'request')],
    [
      t('http.details.responseSize'),
      getHttpMessageSize(attributes, 'response'),
    ],
    [
      t('http.details.resends'),
      resends != null && resends > 0 ? resends : undefined,
    ],
  ];
}

function HttpRequestSubpanel({ attributes }: { attributes: Attributes }) {
  const { t } = useTranslation('search');
  const url = getHttpUrl(attributes);
  const statusCode = getHttpStatusCode(attributes);
  const method = getHttpMethod(attributes);

  return (
    <Stack gap="sm">
      <RequestLine
        label={method}
        target={url}
        status={
          statusCode != null
            ? getHttpStatusBadge(
                statusCode,
                getHttpStatusText(attributes, statusCode),
                t('requestStatus.noResponse'),
              )
            : undefined
        }
        getCurl={
          url != null && isAbsoluteHttpUrl(url)
            ? () => buildCurl(attributes, url, method)
            : undefined
        }
      />
      <RequestDetailsTable rows={getDetailRows(attributes, statusCode, t)} />
      <HttpMessageSections attributes={attributes} />
    </Stack>
  );
}

/**
 * Spans with both RPC and HTTP attributes (gRPC over HTTP/2, e.g. ASP.NET
 * Core) get the RPC panel: their HTTP status is almost always 200 and the
 * call's result is the RPC status.
 */
export function NetworkPropertySubpanel({
  eventAttributes,
  spanKind,
}: {
  eventAttributes: Attributes;
  spanKind?: string;
}) {
  return isRpcSpan(eventAttributes) ? (
    <RpcCallSubpanel attributes={eventAttributes} spanKind={spanKind} />
  ) : (
    <HttpRequestSubpanel attributes={eventAttributes} />
  );
}
