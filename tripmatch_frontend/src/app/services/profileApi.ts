import { apiRequest, type BasicAuthCredentials } from './http';

function profilePath(accountId: number) {
  return `/api/accounts/${accountId}/profile`;
}

export interface ProfileResponse {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profilePictureUrl?: string;
  city?: string;
  country?: string;
  agencyDescription?: string;
  agencyName?: string;
  isApproved?: boolean;
}

export interface ProfilePatchPayload {
  phone?: string;
  profilePictureUrl?: string;
  city?: string;
  country?: string;
  agencyDescription?: string;
}

export function getAccountProfile(accountId: number, credentials: BasicAuthCredentials) {
  return apiRequest<ProfileResponse>(profilePath(accountId), {
    method: 'GET',
    basicAuth: credentials,
  });
}

export function patchAccountProfile(accountId: number, payload: ProfilePatchPayload, credentials: BasicAuthCredentials) {
  return apiRequest<ProfileResponse>(profilePath(accountId), {
    method: 'PATCH',
    basicAuth: credentials,
    body: payload,
  });
}
