import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import {
  LayoutDashboard, Users, Calendar, Sun, Pyramid, History, Download, Settings, LogOut, Bell, Menu
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/team', label: 'Équipe', icon: Users },
  { path: '/calendar', label: 'Calendrier', icon: Calendar },
  { path: '/holidays', label: 'Jours Fériés', icon: Sun },
  { path: '/egypt-duty', label: 'Astreinte Égypte', icon: Pyramid },
  { path: '/history', label: 'Historique', icon: History },
  { path: '/exports', label: 'Exports', icon: Download },
  { path: '/settings', label: 'Paramètres', icon: Settings },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        notificationsAPI.unreadCount(),
        notificationsAPI.list(),
      ]);
      setUnreadCount(countRes.data.count);
      setNotifications(listRes.data);
    } catch {}
  };

  const markAllRead = async () => {
    await notificationsAPI.markAllRead();
    loadNotifications();
  };

  const markRead = async (id: number) => {
    await notificationsAPI.markRead(id);
    loadNotifications();
  };

  return (
    <div className="flex h-screen bg-[#121212] text-white overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 flex flex-col
        bg-[#000000] border-r border-[#282828] transition-all duration-300
        ${sidebarOpen ? 'w-64' : 'w-20'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 px-4 h-16 border-b border-[#282828]">
          <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center font-bold text-sm flex-shrink-0">
            TM
          </div>
          {sidebarOpen && <span className="text-lg font-bold text-white whitespace-nowrap">Team Manager</span>}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-[#1DB954] text-white shadow-lg shadow-[#1DB954]/20'
                    : 'text-[#b3b3b3] hover:text-white hover:bg-[#282828]'
                  }
                `}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#282828]">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 w-full text-[#b3b3b3] hover:text-red-400 rounded-lg hover:bg-[#282828] transition-all"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-[#181818] border-b border-[#282828] flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-[#b3b3b3] hover:text-white">
              <Menu size={24} />
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block text-[#b3b3b3] hover:text-white">
              <Menu size={20} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative text-[#b3b3b3] hover:text-white transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#1DB954] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[#282828] rounded-lg shadow-xl border border-[#383838] z-50 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between p-3 border-b border-[#383838]">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <button onClick={markAllRead} className="text-xs text-[#1DB954] hover:underline">
                      Tout marquer lu
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-[#b3b3b3] text-center">Aucune notification</p>
                  ) : (
                    notifications.slice(0, 15).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`p-3 border-b border-[#383838] cursor-pointer hover:bg-[#333] transition-colors ${!n.is_read ? 'bg-[#1DB954]/10' : ''}`}
                      >
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-[#b3b3b3] mt-1">{n.message}</p>
                        <p className="text-xs text-[#666] mt-1">{new Date(n.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* User info */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-[#b3b3b3]">{user?.role === 'admin' ? 'Administrateur' : 'Lecteur'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
