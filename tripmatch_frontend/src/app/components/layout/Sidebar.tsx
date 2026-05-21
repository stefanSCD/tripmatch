import { NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard, Map, FileText, Inbox, Bell, User, ShieldCheck,
  ChevronLeft, ChevronRight, Compass, Globe, Sparkles, Building2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  roles: Array<'traveler' | 'agency' | 'admin'>;
  badge?: number;
}

export function Sidebar() {
  const { user, sidebarCollapsed, toggleSidebar, unreadCount } = useApp();

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard', roles: ['traveler', 'agency', 'admin'] },
    { label: 'My Trips', icon: Map, path: '/app/trips', roles: ['traveler'] },
    { label: 'Requests', icon: FileText, path: '/app/requests', roles: ['traveler'] },
    { label: 'Marketplace', icon: Globe, path: '/app/marketplace', roles: ['agency'] },
    { label: 'Offers', icon: Inbox, path: '/app/offers', roles: ['traveler', 'agency'] },
    { label: 'Notifications', icon: Bell, path: '/app/notifications', roles: ['traveler', 'agency', 'admin'], badge: unreadCount },
    { label: 'Profile', icon: User, path: '/app/profile', roles: ['traveler', 'agency', 'admin'] },
    { label: 'Admin Panel', icon: ShieldCheck, path: '/app/admin', roles: ['admin'] },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <aside
      className={`relative flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-16' : 'w-60'
      }`}
      style={{ boxShadow: '1px 0 20px rgba(0,0,0,0.04)' }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-100 ${sidebarCollapsed ? 'justify-center' : ''}`}>
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 flex items-center justify-center shadow-sm">
          <Compass className="w-4 h-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <span className="text-gray-900" style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.3px' }}>
              TravelMatch
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <Sparkles className="w-2.5 h-2.5 text-orange-400" />
              <span style={{ fontSize: '10px', fontWeight: 500, color: '#F97316' }}>AI-Powered</span>
            </div>
          </div>
        )}
      </div>

      {/* Role indicator */}
      {!sidebarCollapsed && (
        <div className="px-3 pt-4 pb-2">
          <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-sky-50 to-teal-50 border border-sky-100">
            <div className="flex items-center gap-2">
              {user.role === 'traveler' && <Map className="w-3.5 h-3.5 text-sky-600" />}
              {user.role === 'agency' && <Building2 className="w-3.5 h-3.5 text-teal-600" />}
              {user.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />}
              <span style={{ fontSize: '11px', fontWeight: 600, color: user.role === 'agency' ? '#0D9488' : user.role === 'admin' ? '#F97316' : '#0EA5E9' }}>
                {user.role === 'traveler' ? 'Traveler' : user.role === 'agency' ? 'Travel Agency' : 'Administrator'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative ${
                sidebarCollapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-200'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`flex-shrink-0 w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {!sidebarCollapsed && (
                  <span style={{ fontSize: '13.5px', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>
                )}
                {!sidebarCollapsed && item.badge && item.badge > 0 ? (
                  <span className="ml-auto flex-shrink-0 px-1.5 py-0.5 rounded-full text-white" style={{ fontSize: '10px', fontWeight: 700, background: isActive ? 'rgba(255,255,255,0.3)' : '#F97316', minWidth: '18px', textAlign: 'center' }}>
                    {item.badge}
                  </span>
                ) : null}
                {sidebarCollapsed && item.badge && item.badge > 0 ? (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500" />
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom user card */}
      {!sidebarCollapsed && (
        <div className="p-3 border-t border-gray-100">
          <NavLink to="/app/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-sky-400 to-teal-500 flex items-center justify-center flex-shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>{user.name.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: '12.5px', fontWeight: 600, color: '#111827' }} className="truncate">{user.name}</p>
              <p style={{ fontSize: '11px', color: '#9CA3AF' }} className="truncate">{user.email}</p>
            </div>
          </NavLink>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:shadow-md transition-all z-10 hover:border-sky-300"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-400" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-gray-400" />
        )}
      </button>
    </aside>
  );
}
