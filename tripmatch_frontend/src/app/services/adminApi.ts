import { apiRequest, type BasicAuthCredentials } from './http';

type SortParam = string | string[];

interface AdminAccountsQueryParams {
  isActive?: boolean;
  q?: string;
  role?: 'USER' | 'AGENCY' | 'ADMIN';
  page?: number;
  size?: number;
  sort?: SortParam;
}

const PENDING_AGENCIES_PATH = '/api/admin/agencies/pending';
const APPROVE_PATH = '/api/admin/agencies/approve';
const APPROVE_BULK_PATH = '/api/admin/agencies/approve/bulk';
const ADMIN_ACCOUNTS_PATH = '/api/admin/accounts';

function encodePathSegment(value: string | number) {
  return encodeURIComponent(String(value));
}

function buildQueryString(params: AdminAccountsQueryParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.isActive !== undefined) {
    searchParams.set('isActive', String(params.isActive));
  }

  if (params.q !== undefined) {
    searchParams.set('q', params.q);
  }

  if (params.role !== undefined) {
    searchParams.set('role', params.role);
  }

  if (params.page !== undefined) {
    searchParams.set('page', String(params.page));
  }

  if (params.size !== undefined) {
    searchParams.set('size', String(params.size));
  }

  if (params.sort !== undefined) {
    const sorts = Array.isArray(params.sort) ? params.sort : [params.sort];
    sorts.filter(Boolean).forEach(sort => {
      searchParams.append('sort', sort);
    });
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AdminAccountListItem {
  id: number;
  email: string;
  role: 'USER' | 'AGENCY' | 'ADMIN';
  isActive: boolean;
  isApproved: boolean;
  firstName?: string | null;
  lastName?: string | null;
  agencyName?: string | null;
  createdAt?: string | null;
  lastLoginAt?: string | null;
}

export interface AdminAccountActionResponse {
  message: string;
}

export interface AgencyApprovalStatus {
  accountId: number;
  approved: boolean;
  message: string;
}

export function getAdminAccounts(credentials: BasicAuthCredentials, query: AdminAccountsQueryParams = {}) {
  return apiRequest<PageResponse<AdminAccountListItem>>(ADMIN_ACCOUNTS_PATH + buildQueryString(query), {
    method: 'GET',
    basicAuth: credentials,
  });
}

export function blockAdminAccount(accountId: number, credentials: BasicAuthCredentials) {
  return apiRequest<AdminAccountActionResponse>(`${ADMIN_ACCOUNTS_PATH}/${encodePathSegment(accountId)}/block`, {
    method: 'PATCH',
    basicAuth: credentials,
  });
}

export function unblockAdminAccount(accountId: number, credentials: BasicAuthCredentials) {
  return apiRequest<AdminAccountActionResponse>(`${ADMIN_ACCOUNTS_PATH}/${encodePathSegment(accountId)}/unblock`, {
    method: 'PATCH',
    basicAuth: credentials,
  });
}

export function getPendingAgencies(credentials: BasicAuthCredentials) {
  return apiRequest<AgencyApprovalStatus[]>(PENDING_AGENCIES_PATH, {
    method: 'GET',
    basicAuth: credentials,
  });
}

export function approveAgency(accountId: number, credentials: BasicAuthCredentials) {
  return apiRequest<AgencyApprovalStatus>(APPROVE_PATH, {
    method: 'PATCH',
    basicAuth: credentials,
    body: { accountId },
  });
}

export function approveAgenciesBulk(accountIds: number[], credentials: BasicAuthCredentials) {
  return apiRequest<AgencyApprovalStatus[]>(APPROVE_BULK_PATH, {
    method: 'PATCH',
    basicAuth: credentials,
    body: { accountIds },
  });
}
