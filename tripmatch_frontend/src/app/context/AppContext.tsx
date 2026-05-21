import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  loginRequest,
  registerRequest,
  type BackendRole,
} from '../services/authApi';
import {
  getAccountProfile,
  patchAccountProfile,
  type ProfilePatchPayload,
  type ProfileResponse,
} from '../services/profileApi';
import {
  getAdminAccounts,
  blockAdminAccount,
  unblockAdminAccount,
  getPendingAgencies,
  approveAgency,
  approveAgenciesBulk,
  type AdminAccountActionResponse,
  type AdminAccountListItem,
  type PageResponse,
  type AgencyApprovalStatus,
} from '../services/adminApi';
import type { BasicAuthCredentials } from '../services/http';
import {
  markAllNotificationsRead,
  markNotificationRead as markNotificationReadRequest,
  type NotificationListItemResponse,
  type NotificationType,
} from '../services/notificationApi';
import { getAgencyOffers } from '../services/offerApi';
import { getMyRequests } from '../services/requestApi';
import { useNotificationPolling } from '../hooks/useNotificationPolling';

export type UserRole = 'traveler' | 'agency' | 'admin';

export interface AppUser {
  id: string;
  accountId?: number;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  country?: string;
  location?: string;
  bio?: string;
  website?: string;
  agencyName?: string;
  agencyDescription?: string;
  isApproved?: boolean;
}

export interface AppNotification {
  id: string;
  type: 'offer_received' | 'offer_accepted' | 'offer_rejected' | 'request_update' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  avatar?: string;
  createdAt?: string;
  backendType?: NotificationType;
}

interface AppContextType {
  user: AppUser;
  credentials: BasicAuthCredentials | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  setAccountId: (accountId: number) => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: ProfilePatchPayload) => Promise<void>;
  fetchAdminAccounts: (query?: {
    isActive?: boolean;
    q?: string;
    role?: 'USER' | 'AGENCY' | 'ADMIN';
    page?: number;
    size?: number;
    sort?: string | string[];
  }) => Promise<PageResponse<AdminAccountListItem>>;
  blockAccount: (accountId: number) => Promise<AdminAccountActionResponse>;
  unblockAccount: (accountId: number) => Promise<AdminAccountActionResponse>;
  fetchPendingAgencies: () => Promise<AgencyApprovalStatus[]>;
  approvePendingAgency: (accountId: number) => Promise<AgencyApprovalStatus>;
  approvePendingAgenciesBulk: (accountIds: number[]) => Promise<AgencyApprovalStatus[]>;
  notifications: AppNotification[];
  notificationLoading: boolean;
  notificationError: string | null;
  refreshNotifications: () => Promise<void>;
  checkUnreadAndRefreshIfChanged: () => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: number;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone: string;
  city?: string;
  country?: string;
  agencyName?: string;
  agencyDescription?: string;
}

interface StoredAuthState {
  user: AppUser;
  credentials: BasicAuthCredentials;
}

const AUTH_STORAGE_KEY = 'tripmatch.auth.state';
const ACCOUNT_ID_SESSION_KEY = 'tripmatch.accountId';

const defaultUser: AppUser = {
  id: 'guest',
  name: 'Guest User',
  email: 'guest@example.com',
  role: 'traveler',
  avatar: '',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function appRoleToBackendRole(role: UserRole): BackendRole {
  if (role === 'agency') return 'AGENCY';
  if (role === 'admin') return 'ADMIN';
  return 'USER';
}

function backendRoleToAppRole(role?: string): UserRole {
  if (role === 'AGENCY' || role === 'agency') return 'agency';
  if (role === 'ADMIN' || role === 'admin') return 'admin';
  return 'traveler';
}

function isRoleProbeAccessError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const normalized = error.message.toLowerCase();
  const isRoleGuardMessage = normalized.includes('only')
    && normalized.includes('can perform this action');
  return normalized.includes('status 401')
    || normalized.includes('status 403')
    || normalized.includes('unauthorized')
    || normalized.includes('forbidden')
    || normalized.includes('access denied')
    || isRoleGuardMessage;
}

async function probeRoleAccess(request: () => Promise<unknown>) {
  try {
    await request();
    return true;
  } catch (error) {
    if (isRoleProbeAccessError(error)) {
      return false;
    }
    throw error;
  }
}

async function resolveRoleFromPermissions(credentials: BasicAuthCredentials): Promise<UserRole> {
  if (await probeRoleAccess(() => getAdminAccounts(credentials, { page: 0, size: 1 }))) {
    return 'admin';
  }

  if (await probeRoleAccess(() => getAgencyOffers(credentials, { page: 0, size: 1 }))) {
    return 'agency';
  }

  if (await probeRoleAccess(() => getMyRequests(credentials, { page: 0, size: 1 }))) {
    return 'traveler';
  }

  throw new Error('Could not determine your account role automatically.');
}

function deriveNameFromEmail(email: string) {
  const username = email.split('@')[0] ?? 'Traveler';
  return username
    .split(/[._-]/g)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function composeName(firstName?: string, lastName?: string) {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

function buildUser(params: {
  email: string;
  role: UserRole;
  accountId?: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  country?: string;
  agencyName?: string;
  agencyDescription?: string;
  avatar?: string;
  isApproved?: boolean;
}): AppUser {
  const fullName = composeName(params.firstName, params.lastName);
  const fallbackName = params.role === 'agency'
    ? (params.agencyName || 'Travel Agency')
    : (fullName || deriveNameFromEmail(params.email));
  return {
    id: params.accountId ? String(params.accountId) : crypto.randomUUID(),
    accountId: params.accountId,
    name: fallbackName,
    email: params.email,
    role: params.role,
    avatar: params.avatar || '',
    firstName: params.firstName,
    lastName: params.lastName,
    phone: params.phone,
    city: params.city,
    country: params.country,
    location: [params.city, params.country].filter(Boolean).join(', '),
    agencyName: params.agencyName,
    agencyDescription: params.agencyDescription,
    bio: params.agencyDescription,
    isApproved: params.isApproved,
  };
}

function readStoredState(): StoredAuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAuthState> | null;
    if (!parsed || !parsed.user || !parsed.credentials) return null;
    const credentials = parsed.credentials;
    if (!credentials.email || !credentials.password) return null;
    const role = backendRoleToAppRole(parsed.user.role);
    const sessionAccountId = readSessionAccountId();
    const resolvedAccountId = typeof parsed.user.accountId === 'number'
      ? parsed.user.accountId
      : (sessionAccountId ?? undefined);
    return {
      credentials: {
        email: credentials.email,
        password: credentials.password,
      },
      user: {
        ...parsed.user,
        role,
        accountId: resolvedAccountId,
        id: resolvedAccountId ? String(resolvedAccountId) : parsed.user.id,
      } as AppUser,
    };
  } catch {
    return null;
  }
}

function parseStoredAccountId(value: string | null | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function readSessionAccountId() {
  try {
    return parseStoredAccountId(sessionStorage.getItem(ACCOUNT_ID_SESSION_KEY));
  } catch {
    return null;
  }
}

function writeSessionAccountId(accountId: number) {
  try {
    sessionStorage.setItem(ACCOUNT_ID_SESSION_KEY, String(accountId));
  } catch {
    // Ignore storage errors (private mode / disabled storage).
  }
}

function clearSessionAccountId() {
  try {
    sessionStorage.removeItem(ACCOUNT_ID_SESSION_KEY);
  } catch {
    // Ignore storage errors.
  }
}

function mergeProfile(user: AppUser, profile: ProfileResponse): AppUser {
  const nextFirstName = profile.firstName ?? user.firstName;
  const nextLastName = profile.lastName ?? user.lastName;
  const nextAgencyName = profile.agencyName ?? user.agencyName;
  const nextName = user.role === 'agency'
    ? (nextAgencyName || user.name)
    : (composeName(nextFirstName, nextLastName) || user.name);
  const nextCity = profile.city ?? user.city;
  const nextCountry = profile.country ?? user.country;

  return {
    ...user,
    name: nextName,
    firstName: nextFirstName,
    lastName: nextLastName,
    phone: profile.phone ?? user.phone,
    avatar: profile.profilePictureUrl ?? user.avatar,
    city: nextCity,
    country: nextCountry,
    location: [nextCity, nextCountry].filter(Boolean).join(', '),
    agencyName: nextAgencyName,
    agencyDescription: profile.agencyDescription ?? user.agencyDescription,
    bio: profile.agencyDescription ?? user.bio,
    isApproved: profile.isApproved ?? user.isApproved,
  };
}

function mapNotificationType(type: NotificationType): AppNotification['type'] {
  if (type === 'OFFER_ACCEPTED') return 'offer_accepted';
  if (type === 'OFFER_REJECTED') return 'offer_rejected';
  if (type === 'OFFER_SENT') return 'offer_received';
  return 'system';
}

function formatRelativeTime(dateTime: string) {
  const parsed = new Date(dateTime);
  if (Number.isNaN(parsed.getTime())) return dateTime;

  const diffMs = Date.now() - parsed.getTime();
  if (diffMs < 0) return 'just now';

  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes <= 0) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;

  return parsed.toLocaleDateString();
}

function mapBackendNotification(item: NotificationListItemResponse): AppNotification {
  return {
    id: String(item.id),
    type: mapNotificationType(item.type),
    title: item.title,
    message: item.message,
    time: formatRelativeTime(item.createdAt),
    read: item.isRead,
    createdAt: item.createdAt,
    backendType: item.type,
  };
}

function parsePositiveInteger(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const storedState = readStoredState();
  const [user, setUser] = useState<AppUser>(storedState?.user ?? defaultUser);
  const [credentials, setCredentials] = useState<BasicAuthCredentials | null>(storedState?.credentials ?? null);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(storedState));
  const {
    unreadCount,
    notifications: backendNotifications,
    loading: notificationLoading,
    error: notificationError,
    refreshAll: refreshNotifications,
    checkUnreadAndRefreshIfChanged,
    markNotificationReadLocally,
    markAllReadLocally,
  } = useNotificationPolling({
    credentials,
    isAuthenticated,
    size: 20,
    pollIntervalMs: 10000,
  });
  const notifications = useMemo(() => (
    backendNotifications.map(mapBackendNotification)
  ), [backendNotifications]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const persistAuth = (nextUser: AppUser, nextCredentials: BasicAuthCredentials) => {
    setUser(nextUser);
    setCredentials(nextCredentials);
    setIsAuthenticated(true);
    if (nextUser.accountId) {
      writeSessionAccountId(nextUser.accountId);
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: nextUser, credentials: nextCredentials }));
  };

  const requireCredentials = () => {
    if (!credentials) {
      throw new Error('You need to log in first.');
    }
    return credentials;
  };

  const requireAccountId = () => {
    if (user.accountId) {
      writeSessionAccountId(user.accountId);
      return user.accountId;
    }

    const sessionAccountId = readSessionAccountId();
    if (sessionAccountId) {
      setUser(prev => {
        const nextUser = { ...prev, id: String(sessionAccountId), accountId: sessionAccountId };
        if (credentials && isAuthenticated) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: nextUser, credentials }));
        }
        return nextUser;
      });
      return sessionAccountId;
    }

    throw new Error('Account ID is required for profile operations.');
  };

  const login = async ({ email, password }: LoginInput) => {
    const response = await loginRequest({ email, password });
    const nextCredentials = { email, password };
    const accountId = typeof response.accountId === 'number' ? response.accountId : undefined;
    if (accountId === undefined) {
      throw new Error('Login response missing accountId.');
    }
    const role = response.role
      ? backendRoleToAppRole(response.role)
      : await resolveRoleFromPermissions(nextCredentials);
    const nextUser = buildUser({
      email,
      role,
      accountId,
    });
    persistAuth(nextUser, nextCredentials);
  };

  const register = async (input: RegisterInput) => {
    const trimmedPhone = input.phone.trim();
    if (trimmedPhone.length < 5 || trimmedPhone.length > 30) {
      throw new Error('Phone must be between 5 and 30 characters.');
    }

    await registerRequest({
      email: input.email,
      password: input.password,
      role: appRoleToBackendRole(input.role),
      phone: trimmedPhone,
      city: input.city,
      country: input.country,
      firstName: input.firstName,
      lastName: input.lastName,
      agencyName: input.agencyName,
      agencyDescription: input.agencyDescription,
    });

  };

  const fetchAdminAccounts = async (query = {}) => {
    const currentCredentials = requireCredentials();
    return getAdminAccounts(currentCredentials, query);
  };

  const blockAccount = async (accountId: number) => {
    const currentCredentials = requireCredentials();
    return blockAdminAccount(accountId, currentCredentials);
  };

  const unblockAccount = async (accountId: number) => {
    const currentCredentials = requireCredentials();
    return unblockAdminAccount(accountId, currentCredentials);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCredentials(null);
    setUser(defaultUser);
    clearSessionAccountId();
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const setRole = (role: UserRole) => {
    setUser(prev => {
      const nextUser = { ...prev, role };
      if (credentials && isAuthenticated) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: nextUser, credentials }));
      }
      return nextUser;
    });
  };

  const setAccountId = (accountId: number) => {
    writeSessionAccountId(accountId);
    setUser(prev => {
      const nextUser = { ...prev, id: String(accountId), accountId };
      if (credentials && isAuthenticated) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: nextUser, credentials }));
      }
      return nextUser;
    });
  };

  const refreshProfile = async () => {
    const currentCredentials = requireCredentials();
    const accountId = requireAccountId();
    const profile = await getAccountProfile(accountId, currentCredentials);
    setUser(prev => {
      const nextUser = mergeProfile({ ...prev, id: String(accountId), accountId }, profile);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: nextUser, credentials: currentCredentials }));
      return nextUser;
    });
  };

  const updateProfile = async (payload: ProfilePatchPayload) => {
    if (Object.keys(payload).length === 0) {
      throw new Error('Please update at least one field.');
    }
    const hasNonEmptyField = Object.values(payload).some(value => (
      typeof value === 'string' && value.trim().length > 0
    ));
    if (!hasNonEmptyField) {
      throw new Error('Please update at least one non-empty field.');
    }
    const currentCredentials = requireCredentials();
    const accountId = requireAccountId();
    const profile = await patchAccountProfile(accountId, payload, currentCredentials);
    setUser(prev => {
      const nextUser = mergeProfile({ ...prev, id: String(accountId), accountId }, profile);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: nextUser, credentials: currentCredentials }));
      return nextUser;
    });
  };

  const fetchPendingAgencies = async () => {
    const currentCredentials = requireCredentials();
    return getPendingAgencies(currentCredentials);
  };

  const approvePendingAgency = async (accountId: number) => {
    const currentCredentials = requireCredentials();
    return approveAgency(accountId, currentCredentials);
  };

  const approvePendingAgenciesBulk = async (accountIds: number[]) => {
    const currentCredentials = requireCredentials();
    return approveAgenciesBulk(accountIds, currentCredentials);
  };

  const markNotificationRead = (id: string) => {
    if (!credentials || !isAuthenticated) return;
    const notificationId = parsePositiveInteger(id);
    if (!notificationId) return;

    markNotificationReadLocally(notificationId);

    void markNotificationReadRequest(notificationId, credentials).catch(() => {
      // Keep local state updated even if the backend call fails.
    }).finally(() => {
      void refreshNotifications().catch(() => {
        // Keep optimistic state when refetch fails.
      });
    });
  };

  const markAllRead = () => {
    if (!credentials || !isAuthenticated) return;
    markAllReadLocally();

    void markAllNotificationsRead(credentials).catch(() => {
      // Keep local state updated even if the backend call fails.
    }).finally(() => {
      void refreshNotifications().catch(() => {
        // Keep optimistic state when refetch fails.
      });
    });
  };

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  return (
    <AppContext.Provider
      value={{
        user,
        credentials,
        isAuthenticated,
        login,
        register,
        logout,
        setRole,
        setAccountId,
        refreshProfile,
        updateProfile,
        fetchAdminAccounts,
        blockAccount,
        unblockAccount,
        fetchPendingAgencies,
        approvePendingAgency,
        approvePendingAgenciesBulk,
        notifications,
        notificationLoading,
        notificationError,
        refreshNotifications,
        checkUnreadAndRefreshIfChanged,
        markNotificationRead,
        markAllRead,
        unreadCount,
        sidebarCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
