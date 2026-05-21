import { useCallback, useEffect, useRef, useState } from 'react';
import type { BasicAuthCredentials } from '../services/http';
import {
  getNotifications,
  getUnreadNotificationsCount,
  type NotificationListItemResponse,
} from '../services/notificationApi';

const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 20;
const DEFAULT_POLL_INTERVAL_MS = 10000;
const DEFAULT_SORT = ['createdAt,desc'];

interface UseNotificationPollingOptions {
  credentials: BasicAuthCredentials | null;
  isAuthenticated: boolean;
  page?: number;
  size?: number;
  pollIntervalMs?: number;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return 'Could not refresh notifications right now.';
}

export function useNotificationPolling({
  credentials,
  isAuthenticated,
  page = DEFAULT_PAGE,
  size = DEFAULT_SIZE,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}: UseNotificationPollingOptions) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationListItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCountRef = useRef(0);
  const notificationsRef = useRef<NotificationListItemResponse[]>([]);
  const isPollingRef = useRef(false);

  useEffect(() => {
    unreadCountRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const fetchUnreadCount = useCallback(async () => {
    if (!credentials || !isAuthenticated) return 0;
    const response = await getUnreadNotificationsCount(credentials);
    return response.count;
  }, [credentials, isAuthenticated]);

  const fetchNotificationList = useCallback(async () => {
    if (!credentials || !isAuthenticated) return [] as NotificationListItemResponse[];
    const response = await getNotifications(credentials, {
      page,
      size,
      sort: DEFAULT_SORT,
    });
    return response.content;
  }, [credentials, isAuthenticated, page, size]);

  const refreshAll = useCallback(async () => {
    if (!credentials || !isAuthenticated) {
      setUnreadCount(0);
      setNotifications([]);
      setError(null);
      return;
    }

    const [count, items] = await Promise.all([
      fetchUnreadCount(),
      fetchNotificationList(),
    ]);

    setUnreadCount(count);
    setNotifications(items);
    setError(null);
  }, [credentials, isAuthenticated, fetchNotificationList, fetchUnreadCount]);

  const checkUnreadAndRefreshIfChanged = useCallback(async () => {
    if (!credentials || !isAuthenticated) return;
    if (document.hidden) return;
    if (isPollingRef.current) return;

    isPollingRef.current = true;

    try {
      const count = await fetchUnreadCount();

      if (count !== unreadCountRef.current) {
        const items = await fetchNotificationList();
        setNotifications(items);
      }

      setUnreadCount(count);
      setError(null);
    } catch (pollError) {
      setError(getErrorMessage(pollError));
      console.warn('Notification polling failed.', pollError);
    } finally {
      isPollingRef.current = false;
    }
  }, [credentials, isAuthenticated, fetchNotificationList, fetchUnreadCount]);

  const markNotificationReadLocally = useCallback((notificationId: number) => {
    const target = notificationsRef.current.find(item => item.id === notificationId);
    if (!target || target.isRead) return;

    setNotifications(prev => prev.map(item => (
      item.id === notificationId
        ? {
          ...item,
          isRead: true,
        }
        : item
    )));
    setUnreadCount(prevUnread => Math.max(0, prevUnread - 1));
  }, []);

  const markAllReadLocally = useCallback(() => {
    setNotifications(prev => prev.map(item => (
      item.isRead
        ? item
        : {
          ...item,
          isRead: true,
        }
    )));
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!credentials || !isAuthenticated) {
      setUnreadCount(0);
      setNotifications([]);
      setError(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);

    void refreshAll().catch(initialError => {
      if (cancelled) return;
      setError(getErrorMessage(initialError));
      console.warn('Initial notifications load failed.', initialError);
    }).finally(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [credentials, isAuthenticated, refreshAll]);

  useEffect(() => {
    if (!credentials || !isAuthenticated) return;

    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      void checkUnreadAndRefreshIfChanged();
    }, pollIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [credentials, isAuthenticated, pollIntervalMs, checkUnreadAndRefreshIfChanged]);

  useEffect(() => {
    if (!credentials || !isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.hidden) return;
      void checkUnreadAndRefreshIfChanged();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [credentials, isAuthenticated, checkUnreadAndRefreshIfChanged]);

  return {
    unreadCount,
    notifications,
    loading,
    error,
    refreshAll,
    checkUnreadAndRefreshIfChanged,
    markNotificationReadLocally,
    markAllReadLocally,
  };
}
