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

export type NotificationType = 'OFFER_SENT' | 'OFFER_ACCEPTED' | 'OFFER_REJECTED';

export interface NotificationListItemResponse {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

export interface NotificationResponse {
  notificationId?: number | null;
  message: string;
}

export interface UnreadNotificationsCountResponse {
  count: number;
}

interface MarkNotificationsReadPayload {
  notificationIds: number[];
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

export function getNotifications(credentials: BasicAuthCredentials, query: ListQueryParams = {}) {
  return apiRequest<PageResponse<NotificationListItemResponse>>(`/api/notifications${buildQueryString(query)}`, {
    method: 'GET',
    basicAuth: credentials,
  });
}

export function getUnreadNotificationsCount(credentials: BasicAuthCredentials) {
  return apiRequest<UnreadNotificationsCountResponse>('/api/notifications/unread-count', {
    method: 'GET',
    basicAuth: credentials,
  });
}

export function markNotificationRead(notificationId: string | number, credentials: BasicAuthCredentials) {
  return apiRequest<NotificationResponse>(`/api/notifications/${encodePathSegment(notificationId)}/read`, {
    method: 'PATCH',
    basicAuth: credentials,
  });
}

export function markNotificationsRead(notificationIds: number[], credentials: BasicAuthCredentials) {
  const payload: MarkNotificationsReadPayload = { notificationIds };
  return apiRequest<NotificationResponse>('/api/notifications/read', {
    method: 'PATCH',
    basicAuth: credentials,
    body: payload,
  });
}

export function markAllNotificationsRead(credentials: BasicAuthCredentials) {
  return apiRequest<NotificationResponse>('/api/notifications/read-all', {
    method: 'PATCH',
    basicAuth: credentials,
  });
}
