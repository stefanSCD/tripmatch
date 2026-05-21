import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, Search, Plus, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function TopNav() {
  const {
    user,
    notifications,
    unreadCount,
    notificationError,
    refreshNotifications,
    markNotificationRead,
    markAllRead,
    logout,
  } = useApp();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const recentNotifications = notifications.slice(0, 4);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim().toLowerCase();

    if (query.includes('offer')) {
      navigate('/app/offers');
    } else if (query.includes('request') || query.includes('market')) {
      navigate(user.role === 'agency' ? '/app/marketplace' : '/app/requests');
    } else if (query.includes('profile') || query.includes('setting')) {
      navigate('/app/profile');
    } else if (query.includes('notif')) {
      navigate('/app/notifications');
    } else if (user.role === 'agency') {
      navigate('/app/marketplace');
    } else if (user.role === 'admin') {
      navigate('/app/admin');
    } else {
      navigate('/app/trips');
    }

    setSearchQuery('');
  };

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-5 gap-4 relative z-20" style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.04)' }}>
      {/* Search */}
      <div className="flex-1 max-w-md">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Search trips, destinations, offers..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 transition-all placeholder:text-gray-400"
            style={{ fontSize: '13.5px' }}
          />
        </form>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Quick Add (traveler only) */}
        {user.role === 'traveler' && (
          <button
            onClick={() => navigate('/app/trips/create')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-600 hover:to-sky-700 transition-all shadow-sm shadow-sky-200"
            style={{ fontSize: '13px', fontWeight: 600 }}
          >
            <Plus className="w-4 h-4" />
            New Trip
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              const nextVisible = !showNotifications;
              setShowNotifications(nextVisible);
              setShowProfile(false);
              if (nextVisible) {
                void refreshNotifications();
              }
            }}
            className="relative w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-4.5 h-4.5 text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center" style={{ fontSize: '9px', fontWeight: 700, color: 'white' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Notifications</span>
                <button onClick={markAllRead} style={{ fontSize: '12px', color: '#0EA5E9', fontWeight: 500 }}>Mark all read</button>
              </div>
              {notificationError && (
                <p className="border-b border-amber-100 bg-amber-50 px-4 py-2" style={{ fontSize: '11px', color: '#B45309' }}>
                  Sync delayed. Showing last updated notifications.
                </p>
              )}
              <div className="max-h-72 overflow-y-auto">
                {recentNotifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationRead(notif.id)}
                    className={`flex gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 ${!notif.read ? 'bg-sky-50/50' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-100 to-teal-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {notif.avatar ? <img src={notif.avatar} className="w-full h-full object-cover" /> : <Bell className="w-3.5 h-3.5 text-sky-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: '12.5px', fontWeight: notif.read ? 400 : 600, color: '#111827' }}>{notif.title}</p>
                      <p style={{ fontSize: '11.5px', color: '#6B7280' }} className="truncate">{notif.message}</p>
                      <p style={{ fontSize: '11px', color: '#9CA3AF' }} className="mt-0.5">{notif.time}</p>
                    </div>
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0 mt-1" />}
                  </div>
                ))}
              </div>
              <button
                onClick={() => { navigate('/app/notifications'); setShowNotifications(false); }}
                className="w-full py-3 text-center hover:bg-gray-50 border-t border-gray-100 transition-colors"
                style={{ fontSize: '13px', fontWeight: 500, color: '#0EA5E9' }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-sky-400 to-teal-500">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>{user.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', maxWidth: '120px' }} className="truncate hidden sm:block">{user.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-11 w-48 bg-white rounded-2xl border border-gray-100 shadow-xl py-2 z-50">
              <button onClick={() => { navigate('/app/profile'); setShowProfile(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                <User className="w-4 h-4 text-gray-400" />
                <span style={{ fontSize: '13px' }}>My Profile</span>
              </button>
              <button
                onClick={() => { navigate('/app/profile'); setShowProfile(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                <span style={{ fontSize: '13px' }}>Settings</span>
              </button>
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                    setShowProfile(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-red-500"
                >
                  <LogOut className="w-4 h-4" />
                  <span style={{ fontSize: '13px' }}>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
