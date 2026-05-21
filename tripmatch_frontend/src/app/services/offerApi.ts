import { apiRequest, type BasicAuthCredentials } from './http';

type SortParam = string | string[];

interface ListQueryParams {
  page?: number;
  size?: number;
  sort?: SortParam;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export type OfferStatus = 'DRAFT' | 'READY' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface CreateOfferPayload {
  price: number;
  currency: string;
  accommodationDetails: string;
  transportDetails: string;
  itinerarySummary?: string | null;
  conditions?: string | null;
  attachmentUrl?: string | null;
}

export interface UpdateOfferPayload {
  price?: number;
  currency?: string;
  accommodationDetails?: string;
  transportDetails?: string;
  itinerarySummary?: string;
  conditions?: string;
  attachmentUrl?: string;
  status?: OfferStatus;
}

export interface RejectOfferPayload {
  feedbackMessage: string;
}

export interface OfferResponse {
  offerId: number;
  status: OfferStatus;
  message: string;
}

export interface OfferListItemResponse {
  id: number;
  requestId: number;
  price: number;
  currency: string;
  status: OfferStatus;
  sentAt?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OfferDetailResponse {
  id: number;
  requestId: number;
  agencyAccountId: number;
  price: number;
  currency: string;
  accommodationDetails: string;
  transportDetails: string;
  itinerarySummary?: string | null;
  conditions?: string | null;
  attachmentUrl?: string | null;
  feedbackMessage?: string | null;
  status: OfferStatus;
  sentAt?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

function encodePathSegment(value: string | number) {
  return encodeURIComponent(String(value));
}

function buildQueryString(params: ListQueryParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.set('page', String(params.page));
  }

  if (params.size !== undefined) {
    searchParams.set('size', String(params.size));
  }

  if (params.sort !== undefined) {
    const sorts = Array.isArray(params.sort) ? params.sort : [params.sort];
    sorts.filter(Boolean).forEach(sortValue => {
      searchParams.append('sort', sortValue);
    });
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function createOffer(requestId: string | number, payload: CreateOfferPayload, credentials: BasicAuthCredentials) {
  return apiRequest<OfferResponse>(`/api/requests/${encodePathSegment(requestId)}/offers`, {
    method: 'POST',
    basicAuth: credentials,
    body: payload,
  });
}

export function getOfferDetail(offerId: string | number, credentials: BasicAuthCredentials) {
  return apiRequest<OfferDetailResponse>(`/api/offers/${encodePathSegment(offerId)}`, {
    method: 'GET',
    basicAuth: credentials,
  });
}

export function updateOffer(
  offerId: string | number,
  payload: UpdateOfferPayload,
  credentials: BasicAuthCredentials,
) {
  return apiRequest<OfferResponse>(`/api/offers/${encodePathSegment(offerId)}`, {
    method: 'PATCH',
    basicAuth: credentials,
    body: payload,
  });
}

export function deleteOffer(offerId: string | number, credentials: BasicAuthCredentials) {
  return apiRequest<OfferResponse>(`/api/offers/${encodePathSegment(offerId)}`, {
    method: 'DELETE',
    basicAuth: credentials,
  });
}

export function sendOffer(offerId: string | number, credentials: BasicAuthCredentials) {
  return apiRequest<OfferResponse>(`/api/offers/${encodePathSegment(offerId)}/send`, {
    method: 'POST',
    basicAuth: credentials,
  });
}

export function acceptOffer(offerId: string | number, credentials: BasicAuthCredentials) {
  return apiRequest<OfferResponse>(`/api/offers/${encodePathSegment(offerId)}/accept`, {
    method: 'POST',
    basicAuth: credentials,
  });
}

export function rejectOffer(
  offerId: string | number,
  payload: RejectOfferPayload,
  credentials: BasicAuthCredentials,
) {
  return apiRequest<OfferResponse>(`/api/offers/${encodePathSegment(offerId)}/reject`, {
    method: 'POST',
    basicAuth: credentials,
    body: payload,
  });
}

export function getAgencyOffers(credentials: BasicAuthCredentials, query: ListQueryParams = {}) {
  return apiRequest<PageResponse<OfferListItemResponse>>(`/api/offers/agency${buildQueryString(query)}`, {
    method: 'GET',
    basicAuth: credentials,
  });
}

export function getUserOffers(credentials: BasicAuthCredentials, query: ListQueryParams = {}) {
  return apiRequest<PageResponse<OfferListItemResponse>>(`/api/offers/user${buildQueryString(query)}`, {
    method: 'GET',
    basicAuth: credentials,
  });
}
