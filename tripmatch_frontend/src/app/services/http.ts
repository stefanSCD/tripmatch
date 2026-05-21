export interface BasicAuthCredentials {
  email: string;
  password: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  basicAuth?: BasicAuthCredentials;
  headers?: Record<string, string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractErrorMessage(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (Array.isArray(payload) && payload.every(item => typeof item === 'string')) {
    return payload.join('\n');
  }

  if (!isRecord(payload)) return null;

  const directFields = ['message', 'error', 'detail'];
  for (const field of directFields) {
    const value = payload[field];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  const flattened = Object.values(payload).filter(value => typeof value === 'string');
  if (flattened.length > 0) {
    return flattened.join('\n');
  }

  return null;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return {};
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const text = await response.text();
    if (!text.trim()) return {};
    return JSON.parse(text);
  }

  const text = await response.text();
  if (!text.trim()) return {};
  return text;
}

function buildAuthHeader(credentials: BasicAuthCredentials) {
  return `Basic ${btoa(`${credentials.email}:${credentials.password}`)}`;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.basicAuth) {
    headers.Authorization = buildAuthHeader(options.basicAuth);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload) ?? `Request failed with status ${response.status}.`);
  }

  return payload as T;
}
