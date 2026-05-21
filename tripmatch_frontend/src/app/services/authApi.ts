import { apiRequest } from './http';

const LOGIN_PATH = import.meta.env.VITE_LOGIN_PATH ?? '/api/auth/login';
const REGISTER_PATH = import.meta.env.VITE_REGISTER_PATH ?? '/api/auth/register';

export type BackendRole = 'USER' | 'AGENCY' | 'ADMIN';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  role: BackendRole;
  phone?: string;
  city?: string;
  country?: string;
  firstName?: string;
  lastName?: string;
  agencyName?: string;
  agencyDescription?: string;
}

export interface AuthSuccessResponse {
  accountId: number;
  message: string;
  role?: BackendRole;
}

export function loginRequest(payload: LoginPayload) {
  return apiRequest<AuthSuccessResponse>(LOGIN_PATH, {
    method: 'POST',
    body: payload,
  });
}

export function registerRequest(payload: RegisterPayload) {
  return apiRequest<AuthSuccessResponse>(REGISTER_PATH, {
    method: 'POST',
    body: payload,
  });
}
