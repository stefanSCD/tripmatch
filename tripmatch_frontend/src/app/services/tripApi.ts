import { apiRequest, type BasicAuthCredentials } from './http';

type SortParam = string | string[];

interface ListQueryParams {
  page?: number;
  size?: number;
  sort?: SortParam;
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
    sorts.filter(Boolean).forEach(sort => {
      searchParams.append('sort', sort);
    });
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export type TripStatus = 'DRAFT' | 'PUBLISHED' | 'ACCEPTED';
export type BudgetCategory = 'TRANSPORT' | 'ACCOMMODATION' | 'FOOD' | 'ACTIVITIES';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface TripListResponse {
  id: string | number;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status: TripStatus;
}

export interface TripDetailResponse {
  id: string | number;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  createdWithAi: boolean;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TripCreatePayload {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  createdWithAi: boolean;
}

export interface TripUpdatePayload {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface TripResponse {
  tripId: string | number;
  message: string;
}

export interface DestinationListResponse {
  id: string | number;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  notes?: string | null;
}

export interface DestinationDetailResponse extends DestinationListResponse {
  createdAt: string;
  updatedAt: string;
}

export interface DestinationCreatePayload {
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface DestinationUpdatePayload {
  city?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface DestinationResponse {
  destinationId: string | number;
  message: string;
}

export interface ActivityListResponse {
  id: string | number;
  title: string;
  location: string;
  activityDate: string;
  startTime: string;
  durationMinutes: number;
  displayOrder: number;
  category?: BudgetCategory;
  estimatedCost: number;
  notes?: string | null;
}

export interface ActivityDetailResponse extends ActivityListResponse {
  createdAt: string;
  updatedAt: string;
}

export interface ActivityCreatePayload {
  title: string;
  location: string;
  activityDate: string;
  startTime: string;
  durationMinutes: number;
  estimatedCost: number;
  notes?: string;
  category?: BudgetCategory;
  allowOverlap?: boolean | null;
}

export interface ActivityUpdatePayload {
  title?: string;
  location?: string;
  activityDate?: string;
  startTime?: string;
  durationMinutes?: number;
  estimatedCost?: number;
  notes?: string;
  category?: BudgetCategory;
  allowOverlap?: boolean | null;
}

export interface DuplicateActivityPayload {
  activityDate?: string;
  startTime?: string;
  allowOverlap?: boolean;
}

export interface ActivityResponse {
  id: string | number | null;
  message: string;
}

export interface ReorderActivitiesPayload {
  orderedActivityIds: Array<string | number>;
}

export interface TripBudgetCategoryResponse {
  category: BudgetCategory;
  allocatedAmount: number;
  estimatedTotal: number;
  spentTotal: number;
  remainingByEstimated: number;
  remainingBySpent: number;
  estimatedProgressPct: number;
  spentProgressPct: number;
}

export interface TripBudgetResponse {
  id: number;
  tripId: number;
  totalBudget: number;
  currency: string;
  estimatedTotal: number;
  spentTotal: number;
  remainingByEstimated: number;
  remainingBySpent: number;
  estimatedProgressPct: number;
  spentProgressPct: number;
  categories: TripBudgetCategoryResponse[];
}

export interface UpsertTripBudgetCategoryPayload {
  category: BudgetCategory;
  allocatedAmount: number;
  spentTotal?: number | null;
}

export interface UpsertTripBudgetPayload {
  totalBudget: number;
  currency: string;
  spentTotal?: number | null;
  categories?: UpsertTripBudgetCategoryPayload[] | null;
}

export interface GenerateAiDraftPayload {
  destinationHint?: string;
  tripType?: string;
  startDate: string;
  endDate: string;
  budgetTotal: number;
  currency: string;
  interests?: string[];
  pace: string;
  notes?: string;
}

export interface AiDraftActivity {
  title: string;
  location: string;
  activityDate: string;
  startTime: string;
  durationMinutes: number;
  estimatedCost: number;
  notes?: string;
}

export interface AiDraftDay {
  dayNumber: number;
  date: string;
  summary?: string;
  estimatedCostTotal?: number | null;
  activities: AiDraftActivity[];
}

export interface AiDraftContent {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  primaryDestination: string;
  estimatedTotal: number;
  currency: string;
  days: AiDraftDay[];
}

export interface AiDraftListItemResponse {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  currency: string;
  estimatedTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface AiDraftDetailResponse {
  id: number;
  title: string;
  promptData: GenerateAiDraftPayload;
  content: AiDraftContent;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAiDraftPayload {
  title?: string;
  content?: AiDraftContent;
}

export interface SaveDraftAsTripPayload {
  tripTitleOverride?: string | null;
}

export interface RegenerateDraftDayPayload {
  dayNumber: number;
  instruction?: string;
}

function tripPath(tripId?: string | number) {
  return tripId === undefined ? '/api/trips' : `/api/trips/${encodePathSegment(tripId)}`;
}

function destinationPath(tripId: string | number, destinationId?: string | number) {
  const base = `${tripPath(tripId)}/destinations`;
  return destinationId === undefined ? base : `${base}/${encodePathSegment(destinationId)}`;
}

function activityPath(tripId: string | number, destinationId: string | number, activityId?: string | number) {
  const base = `${destinationPath(tripId, destinationId)}/activities`;
  return activityId === undefined ? base : `${base}/${encodePathSegment(activityId)}`;
}

function budgetPath(tripId: string | number) {
  return `${tripPath(tripId)}/budget`;
}

function activityReorderPath(tripId: string | number, destinationId: string | number) {
  return `${activityPath(tripId, destinationId)}/reorder`;
}

function duplicateActivityPath(tripId: string | number, destinationId: string | number, activityId: string | number) {
  return `${activityPath(tripId, destinationId, activityId)}/duplicate`;
}

function aiDraftPath(id?: string | number) {
  const base = '/api/trips/ai/drafts';
  return id === undefined ? base : `${base}/${encodePathSegment(id)}`;
}

export function getTripList(credentials: BasicAuthCredentials, query: ListQueryParams = {}) {
  return apiRequest<PageResponse<TripListResponse>>(tripPath() + buildQueryString(query), {
    method: 'GET',
    basicAuth: credentials,
  });
}

export function getTripDetail(tripId: string | number, credentials: BasicAuthCredentials) {
  return apiRequest<TripDetailResponse>(tripPath(tripId), {
    method: 'GET',
    basicAuth: credentials,
  });
}

export function createTrip(payload: TripCreatePayload, credentials: BasicAuthCredentials) {
  return apiRequest<TripResponse>(tripPath(), {
    method: 'POST',
    basicAuth: credentials,
    body: payload,
  });
}

export function updateTrip(tripId: string | number, payload: TripUpdatePayload, credentials: BasicAuthCredentials) {
  return apiRequest<TripResponse>(tripPath(tripId), {
    method: 'PATCH',
    basicAuth: credentials,
    body: payload,
  });
}

export function deleteTrip(tripId: string | number, credentials: BasicAuthCredentials) {
  return apiRequest<void>(tripPath(tripId), {
    method: 'DELETE',
    basicAuth: credentials,
  });
}

export function getTripBudget(tripId: string | number, credentials: BasicAuthCredentials) {
  return apiRequest<TripBudgetResponse>(budgetPath(tripId), {
    method: 'GET',
    basicAuth: credentials,
  });
}

export function upsertTripBudget(
  tripId: string | number,
  payload: UpsertTripBudgetPayload,
  credentials: BasicAuthCredentials,
) {
  return apiRequest<TripBudgetResponse>(budgetPath(tripId), {
    method: 'PUT',
    basicAuth: credentials,
    body: payload,
  });
}

export function getDestinationList(
  tripId: string | number,
  credentials: BasicAuthCredentials,
  query: ListQueryParams = {},
) {
  return apiRequest<PageResponse<DestinationListResponse>>(destinationPath(tripId) + buildQueryString(query), {
    method: 'GET',
    basicAuth: credentials,
  });
}

export function getDestinationDetail(
  tripId: string | number,
  destinationId: string | number,
  credentials: BasicAuthCredentials,
) {
  return apiRequest<DestinationDetailResponse>(destinationPath(tripId, destinationId), {
    method: 'GET',
    basicAuth: credentials,
  });
}

export function createDestination(
  tripId: string | number,
  payload: DestinationCreatePayload,
  credentials: BasicAuthCredentials,
) {
  return apiRequest<DestinationResponse>(destinationPath(tripId), {
    method: 'POST',
    basicAuth: credentials,
    body: payload,
  });
}

export function updateDestination(
  tripId: string | number,
  destinationId: string | number,
  payload: DestinationUpdatePayload,
  credentials: BasicAuthCredentials,
) {
  return apiRequest<DestinationResponse>(destinationPath(tripId, destinationId), {
    method: 'PATCH',
    basicAuth: credentials,
    body: payload,
  });
}

export function deleteDestination(
  tripId: string | number,
  destinationId: string | number,
  credentials: BasicAuthCredentials,
) {
  return apiRequest<void>(destinationPath(tripId, destinationId), {
    method: 'DELETE',
    basicAuth: credentials,
  });
}

export function getActivityList(
  tripId: string | number,
  destinationId: string | number,
  credentials: BasicAuthCredentials,
  query: ListQueryParams = {},
) {
  return apiRequest<PageResponse<ActivityListResponse>>(activityPath(tripId, destinationId) + buildQueryString(query), {
    method: 'GET',
    basicAuth: credentials,
  });
}

export function getActivityDetail(
  tripId: string | number,
  destinationId: string | number,
  activityId: string | number,
  credentials: BasicAuthCredentials,
) {
  return apiRequest<ActivityDetailResponse>(activityPath(tripId, destinationId, activityId), {
    method: 'GET',
    basicAuth: credentials,
  });
}

export function createActivity(
  tripId: string | number,
  destinationId: string | number,
  payload: ActivityCreatePayload,
  credentials: BasicAuthCredentials,
) {
  return apiRequest<ActivityResponse>(activityPath(tripId, destinationId), {
    method: 'POST',
    basicAuth: credentials,
    body: payload,
  });
}

export function updateActivity(
  tripId: string | number,
  destinationId: string | number,
  activityId: string | number,
  payload: ActivityUpdatePayload,
  credentials: BasicAuthCredentials,
) {
  return apiRequest<ActivityResponse>(activityPath(tripId, destinationId, activityId), {
    method: 'PATCH',
    basicAuth: credentials,
    body: payload,
  });
}

export function deleteActivity(
  tripId: string | number,
  destinationId: string | number,
  activityId: string | number,
  credentials: BasicAuthCredentials,
) {
  return apiRequest<void>(activityPath(tripId, destinationId, activityId), {
    method: 'DELETE',
    basicAuth: credentials,
  });
}

export function reorderActivities(
  tripId: string | number,
  destinationId: string | number,
  payload: ReorderActivitiesPayload,
  credentials: BasicAuthCredentials,
) {
  return apiRequest<ActivityResponse>(activityReorderPath(tripId, destinationId), {
    method: 'PUT',
    basicAuth: credentials,
    body: payload,
  });
}

export function duplicateActivity(
  tripId: string | number,
  destinationId: string | number,
  activityId: string | number,
  payload: DuplicateActivityPayload | undefined,
  credentials: BasicAuthCredentials,
) {
  return apiRequest<ActivityResponse>(duplicateActivityPath(tripId, destinationId, activityId), {
    method: 'POST',
    basicAuth: credentials,
    body: payload,
  });
}

export function generateAiDraft(payload: GenerateAiDraftPayload, credentials: BasicAuthCredentials) {
  return apiRequest<AiDraftDetailResponse>('/api/trips/ai/generate', {
    method: 'POST',
    basicAuth: credentials,
    body: payload,
  });
}

export function getAiDraftList(credentials: BasicAuthCredentials, query: ListQueryParams = {}) {
  return apiRequest<PageResponse<AiDraftListItemResponse>>(aiDraftPath() + buildQueryString(query), {
    method: 'GET',
    basicAuth: credentials,
  });
}

export function getAiDraftDetail(id: string | number, credentials: BasicAuthCredentials) {
  return apiRequest<AiDraftDetailResponse>(aiDraftPath(id), {
    method: 'GET',
    basicAuth: credentials,
  });
}

export function updateAiDraft(
  id: string | number,
  payload: UpdateAiDraftPayload,
  credentials: BasicAuthCredentials,
) {
  return apiRequest<AiDraftDetailResponse>(aiDraftPath(id), {
    method: 'PATCH',
    basicAuth: credentials,
    body: payload,
  });
}

export function saveAiDraftAsTrip(
  id: string | number,
  payload: SaveDraftAsTripPayload | undefined,
  credentials: BasicAuthCredentials,
) {
  return apiRequest<TripResponse>(`${aiDraftPath(id)}/save-as-trip`, {
    method: 'POST',
    basicAuth: credentials,
    body: payload,
  });
}

export function regenerateAiDraftDay(
  id: string | number,
  payload: RegenerateDraftDayPayload,
  credentials: BasicAuthCredentials,
) {
  return apiRequest<AiDraftDetailResponse>(`${aiDraftPath(id)}/regenerate-day`, {
    method: 'POST',
    basicAuth: credentials,
    body: payload,
  });
}
