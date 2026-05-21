import { apiRequest, type BasicAuthCredentials } from './http';

type SortParam = string | string[];

interface ListQueryParams {
  page?: number;
  size?: number;
  sort?: SortParam;
}

export interface MarketplaceRequestsQueryParams extends ListQueryParams {
  destination?: string;
  minBudget?: number;
  maxBudget?: number;
  startFrom?: string;
  endTo?: string;
  flexibleDate?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export type TravelRequestStatus = 'PUBLISHED' | 'CLOSED';

export interface PublishTravelRequestPayload {
  sharedPreferences: string;
  budgetMin: number;
  budgetMax: number;
  destinationSummary: string;
  startDate: string;
  endDate: string;
  isFlexibleDate: boolean;
}

export interface TravelRequestResponse {
  requestId: number;
  tripId: number;
  status: TravelRequestStatus;
  publishedAt?: string | null;
  message: string;
}

export interface TravelRequestListItemResponse {
  id: number;
  tripId: number;
  destinationSummary: string;
  budgetMin: number;
  budgetMax: number;
  startDate: string;
  endDate: string;
  isFlexibleDate: boolean;
  status: TravelRequestStatus;
  publishedAt?: string;
}

export interface TravelRequestDetailResponse {
  id: number;
  tripId: number;
  userAccountId: number;
  sharedPreferences: string;
  budgetMin: number;
  budgetMax: number;
  destinationSummary: string;
  startDate: string;
  endDate: string;
  isFlexibleDate: boolean;
  status: TravelRequestStatus;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

function encodePathSegment(value: string | number) {
  return encodeURIComponent(String(value));
}

function appendSortParams(searchParams: URLSearchParams, sort: SortParam | undefined) {
  if (sort === undefined) return;
  const sorts = Array.isArray(sort) ? sort : [sort];
  sorts.filter(Boolean).forEach(sortValue => {
    searchParams.append('sort', sortValue);
  });
}

function buildListQueryString(params: ListQueryParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.set('page', String(params.page));
  }

  if (params.size !== undefined) {
    searchParams.set('size', String(params.size));
  }

  appendSortParams(searchParams, params.sort);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function buildMarketplaceQueryString(params: MarketplaceRequestsQueryParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.destination !== undefined) {
    searchParams.set('destination', params.destination);
  }

  if (params.minBudget !== undefined) {
    searchParams.set('minBudget', String(params.minBudget));
  }

  if (params.maxBudget !== undefined) {
    searchParams.set('maxBudget', String(params.maxBudget));
  }

  if (params.startFrom !== undefined) {
    searchParams.set('startFrom', params.startFrom);
  }

  if (params.endTo !== undefined) {
    searchParams.set('endTo', params.endTo);
  }

  if (params.flexibleDate !== undefined) {
    searchParams.set('flexibleDate', String(params.flexibleDate));
  }

  if (params.page !== undefined) {
    searchParams.set('page', String(params.page));
  }

  if (params.size !== undefined) {
    searchParams.set('size', String(params.size));
  }

  appendSortParams(searchParams, params.sort);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function publishTravelRequest(
  tripId: string | number,
  payload: PublishTravelRequestPayload,
  credentials: BasicAuthCredentials,
) {
  return apiRequest<TravelRequestResponse>(`/api/trips/${encodePathSegment(tripId)}/requests/publish`, {
    method: 'POST',
    basicAuth: credentials,
    body: payload,
  });
}

export function unpublishTravelRequest(requestId: string | number, credentials: BasicAuthCredentials) {
  return apiRequest<TravelRequestResponse>(`/api/requests/${encodePathSegment(requestId)}/unpublish`, {
    method: 'PATCH',
    basicAuth: credentials,
  });
}

export function getMarketplaceRequests(credentials: BasicAuthCredentials, query: MarketplaceRequestsQueryParams = {}) {
  return apiRequest<PageResponse<TravelRequestListItemResponse>>(`/api/requests${buildMarketplaceQueryString(query)}`, {
    method: 'GET',
    basicAuth: credentials,
  });
}

export function getRequestDetail(requestId: string | number, credentials: BasicAuthCredentials) {
  return apiRequest<TravelRequestDetailResponse>(`/api/requests/${encodePathSegment(requestId)}`, {
    method: 'GET',
    basicAuth: credentials,
  });
}

export function getMyRequests(credentials: BasicAuthCredentials, query: ListQueryParams = {}) {
  return apiRequest<PageResponse<TravelRequestListItemResponse>>(`/api/my/requests${buildListQueryString(query)}`, {
    method: 'GET',
    basicAuth: credentials,
  });
}

export function getMyRequestDetail(requestId: string | number, credentials: BasicAuthCredentials) {
  return apiRequest<TravelRequestDetailResponse>(`/api/my/requests/${encodePathSegment(requestId)}`, {
    method: 'GET',
    basicAuth: credentials,
  });
}
