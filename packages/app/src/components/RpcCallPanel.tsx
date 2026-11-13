import { useTranslation } from 'next-i18next/pages';
import type { TFunction } from 'i18next';
import { Stack } from '@mantine/core';

import {
  getHttpMethod,
  getHttpProtocol,
  getHttpRoute,
  getHttpStatusCode,
  getHttpStatusText,
  getUserAgent,
} from '@/utils/httpSpanAttributes';
import { getHttpUrl } from '@/utils/httpUrl';
import {
  getRpcMetadata,
  getRpcMethod,
  getRpcServerAddress,
  getRpcStatus,
  getRpcSystemLabel,
  RpcStatus,
} from '@/utils/rpcSpanAttributes';
import {
  Attributes,
  firstSetString,
  getNetworkPeerAddress,
} from '@/utils/spanAttributeReaders';

import { HeaderSection, HttpMessageSections } from './HttpMessageSections';
import { RequestDetailRow, RequestDetailsTable } from './RequestDetailsTable';
import {
  formatHttpStatus,
  getRpcStatusBadge,
  RequestLine,
} from './RequestLine';

/** HTTP facts of gRPC over HTTP, e.g. `POST http://cart/x.Cart/Get · 200 OK`. */
function getHttpSummary(
  attributes: Attributes,
  noResponseLabel: string,
): string | undefined {
  const statusCode = getHttpStatusCode(attributes);
  const request = [getHttpMethod(attributes), getHttpUrl(attributes)]
    .filter(part => part != null)
    .join(' ');
  const status =
    statusCode != null
      ? formatHttpStatus(
          statusCode,
          getHttpStatusText(attributes, statusCode),
          noResponseLabel,
        )
      : '';
  return [request, status].filter(Boolean).join(' · ') || undefined;
}

function getDetailRows(
  attributes: Attributes,
  spanKind: string | undefined,
  method: string | undefined,
  status: RpcStatus | undefined,
  t: TFunction,
): RequestDetailRow[] {
  const errorType = firstSetString(attributes, ['error.type']);
  const route = getHttpRoute(attributes);
  return [
    [
      t('http.details.errorMessage'),
      firstSetString(attributes, ['grpc.error_message']),
    ],
    // Instrumentations set error.type to the status, which the badge shows.
    [
      t('http.details.errorType'),
      errorType === status?.name || errorType === status?.code?.toString()
        ? undefined
        : errorType,
    ],
    [t('http.details.server'), getRpcServerAddress(attributes, spanKind)],
    [t('http.details.remoteAddress'), getNetworkPeerAddress(attributes)],
    [t('http.details.protocol'), getHttpProtocol(attributes)],
    [
      t('http.details.http'),
      getHttpSummary(attributes, t('requestStatus.noResponse')),
    ],
    // ASP.NET Core sets the route of a gRPC call to the method path.
    [t('http.details.route'), route === `/${method}` ? undefined : route],
    [t('http.details.userAgent'), getUserAgent(attributes)],
  ];
}

/** No copy-as-cURL: curl can't replay a gRPC call. */
export function RpcCallSubpanel({
  attributes,
  spanKind,
}: {
  attributes: Attributes;
  spanKind?: string;
}) {
  const { t } = useTranslation('search');
  const method = getRpcMethod(attributes);
  const status = getRpcStatus(attributes);
  const hasError =
    firstSetString(attributes, ['grpc.error_message', 'error.type']) != null;

  return (
    <Stack gap="sm">
      <RequestLine
        label={getRpcSystemLabel(attributes)}
        target={method}
        status={getRpcStatusBadge(status, hasError, t('requestStatus.error'))}
      />
      <RequestDetailsTable
        rows={getDetailRows(attributes, spanKind, method, status, t)}
      />
      <HttpMessageSections attributes={attributes}>
        <HeaderSection
          title={t('http.requestMetadata')}
          headers={getRpcMetadata(attributes, 'request')}
        />
        <HeaderSection
          title={t('http.responseMetadata')}
          headers={getRpcMetadata(attributes, 'response')}
        />
      </HttpMessageSections>
    </Stack>
  );
}
