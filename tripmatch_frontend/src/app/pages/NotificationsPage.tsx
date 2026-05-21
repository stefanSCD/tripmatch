import { useEffect, useMemo } from 'react';
import { Bell, Check, CheckCircle2, Globe, Settings, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; bg: string; color: string; border: string }> = {
  offer_received: { icon: Bell, bg: 'bg-sky-50', color: 'text-sky-500', border: 'border-sky-200' },
  offer_accepted: { icon: CheckCircle2, bg: 'bg-green-50', color: 'text-green-500', border: 'border-green-200' },
  offer_rejected: { icon: XCircle, bg: 'bg-red-50', color: 'text-red-400', border: 'border-red-100' },
  request_update: { icon: Globe, bg: 'bg-orange-50', color: 'text-orange-500', border: 'border-orange-200' },
  system: { icon: Settings, bg: 'bg-gray-100', color: 'text-gray-400', border: 'border-gray-200' },
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    notificationError,
    markNotificationRead,
    markAllRead,
    refreshNotifications,
  } = useApp();

  useEffect(() => {
    void refreshNotifications().catch(() => {
      // The page still renders existing state on failure.
    });
  }, [refreshNotifications]);

  const grouped = useMemo(() => {
    const result: Record<string, typeof notifications> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = todayStart - 86400000;

    notifications.forEach(notification => {
      if (!notification.createdAt) {
        result.Earlier.push(notification);
        return;
      }

      const createdAt = new Date(notification.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        result.Earlier.push(notification);
        return;
      }

      const createdStart = startOfDay(createdAt);
      if (createdStart >= todayStart) {
        result.Today.push(notification);
      } else if (createdStart >= yesterdayStart) {
        result.Yesterday.push(notification);
      } else {
        result.Earlier.push(notification);
      }
    });

    return result;
  }, [notifications]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>Notifications</h1>
          {unreadCount > 0 && (
            <p style={{ fontSize: '14px', color: '#6B7280' }} className="mt-0.5">
              <span style={{ color: '#F97316', fontWeight: 700 }}>{unreadCount} unread</span> notifications
            </p>
          )}
          {notificationError && (
            <p className="mt-1" style={{ fontSize: '12px', color: '#B45309' }}>
              Live sync delayed. Showing last updated notifications.
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 transition-all hover:border-sky-300 hover:bg-sky-50"
            style={{ fontSize: '13px', fontWeight: 600, color: '#0EA5E9' }}
          >
            <Check className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {Object.entries(grouped).map(([group, items]) => {
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }} className="mb-3 px-1">
              {group}
            </p>
            <div className="space-y-2">
              {items.map(notification => {
                const style = typeConfig[notification.type] ?? typeConfig.system;
                const Icon = style.icon;
                return (
                  <div
                    key={notification.id}
                    onClick={() => markNotificationRead(notification.id)}
                    className={`group relative flex cursor-pointer gap-4 rounded-2xl border p-4 transition-all hover:shadow-sm ${
                      !notification.read
                        ? 'border-sky-200 bg-sky-50/60 hover:border-sky-300'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    {!notification.read && (
                      <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-sky-500" />
                    )}

                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border ${style.bg} ${style.border}`}>
                      {notification.avatar ? (
                        <img src={notification.avatar} alt="" className="h-full w-full rounded-2xl object-cover" />
                      ) : (
                        <Icon className={`h-4.5 w-4.5 ${style.color}`} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p style={{ fontSize: '14px', fontWeight: notification.read ? 500 : 700, color: '#0F172A', lineHeight: 1.4 }}>
                        {notification.title}
                      </p>
                      <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.55, marginTop: '2px' }}>
                        {notification.message}
                      </p>
                      <p style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '5px' }}>{notification.time}</p>
                    </div>

                    {!notification.read && (
                      <button
                        onClick={event => {
                          event.stopPropagation();
                          markNotificationRead(notification.id);
                        }}
                        className="self-center rounded-lg hover:bg-sky-50 opacity-0 transition-all group-hover:opacity-100 w-7 h-7 flex items-center justify-center"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5 text-gray-400 hover:text-sky-500" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <Bell className="h-8 w-8 text-gray-400" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#374151' }}>All caught up</h3>
          <p style={{ fontSize: '14px', color: '#9CA3AF' }} className="mt-1">No new notifications right now.</p>
        </div>
      )}
    </div>
  );
}
