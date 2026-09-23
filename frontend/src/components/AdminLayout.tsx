import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getImageUrl } from '../services/api';

const links = [
  { to: '/admin', label: 'Dashboard', icon: 'fa-chart-pie', end: true },
  { to: '/admin/products', label: 'Products', icon: 'fa-boxes-stacked' },
  { to: '/admin/orders', label: 'Orders', icon: 'fa-truck-fast' },
  { to: '/admin/customers', label: 'Customers', icon: 'fa-users' },
  { to: '/admin/feedback', label: 'Feedback', icon: 'fa-comments' },
];

const timeAgo = (date: string) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// Bell in the admin header. Backed by the same real, per-admin Notification
// records as the client's bell (new order placed, order cancelled, etc.),
// so notifications can be marked as read individually or all at once.
const OrderNotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = () => {
    api.get('/notifications').then(({ data }) => {
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    }).catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markOneRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await api.put(`/notifications/${id}/read`);
    } catch {
      load();
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await api.put('/notifications/read-all');
    } catch {
      load();
    }
  };

  return (
    <div className="relative ml-auto" ref={boxRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-bark hover:bg-tan/20 transition-colors"
        aria-label="Notifications"
      >
        <i className="fas fa-bell" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-paper text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] card-surface p-0 overflow-hidden shadow-xl z-30">
          <div className="px-4 py-3 border-b border-tan/20 flex items-center justify-between">
            <p className="font-semibold text-sm text-ink">Notifications</p>
            <button onClick={markAllRead} className="text-xs text-oliveDark font-semibold hover:underline">
              Mark all as read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-bark/50 px-4 py-6 text-center">No notifications yet.</p>
            ) : (
              notifications.map((n: any) => (
                <div
                  key={n._id}
                  className={`flex items-start gap-3 px-4 py-2.5 hover:bg-cream/60 transition-colors border-b border-tan/10 last:border-0 ${!n.isRead ? 'bg-cream/40' : ''}`}
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!n.isRead ? 'bg-oliveDark' : 'bg-transparent'}`} />
                  <Link
                    to={n.type === 'admin_low_stock' ? '/admin/products' : '/admin/orders'}
                    onClick={() => { markOneRead(n._id); setOpen(false); }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-xs font-semibold text-ink truncate">{n.title}</p>
                    <p className="text-[11px] text-bark/60 truncate">{n.message}</p>
                    <p className="text-[11px] text-bark/40">{timeAgo(n.createdAt)}</p>
                  </Link>
                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={() => markOneRead(n._id)}
                      className="shrink-0 text-[10px] font-semibold text-oliveDark hover:underline whitespace-nowrap mt-1"
                      title="Mark as read"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    // Navigate to the public landing page *first*, then clear the session,
    // so the admin route guard never gets a chance to bounce to /login.
    navigate('/', { replace: true });
    logout();
  };

  return (
    <div className="min-h-screen flex bg-paper">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-ink/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Fixed to the viewport at every breakpoint (h-screen, position:
          fixed) so the sidebar never stretches to match the height of a
          long, scrollable page — it always stays exactly one screen tall. */}
      <aside
        className={`fixed z-40 top-0 left-0 h-screen w-64 shrink-0 bg-bark text-paper flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2 px-5 py-5 border-b border-paper/10 shrink-0">
          <img src="/images/logo.png" alt="Nappa logo" className="w-9 h-9 object-contain bg-paper rounded-full" />
          <div>
            <p className="font-display text-sm leading-tight">Nappa Admin</p>
            <p className="text-[11px] text-paper/60">Pasalubong Center</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  isActive ? 'bg-olive text-paper' : 'text-paper/75 hover:bg-paper/10'
                }`
              }
            >
              <i className={`fas ${l.icon} w-4 text-center`} /> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-paper/10 shrink-0">
          <p className="px-3 text-xs text-paper/50 mb-2 truncate">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium text-paper/80 hover:bg-paper/10"
          >
            <i className="fas fa-right-from-bracket w-4 text-center" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        <header className="flex items-center gap-3 px-4 md:px-6 py-4 border-b border-tan/30 bg-paper sticky top-0 z-20">
          <button className="md:hidden text-xl text-bark" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <i className="fas fa-bars" />
          </button>
          <h1 className="font-display text-lg text-bark">Admin Dashboard</h1>
          <OrderNotificationBell />
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
