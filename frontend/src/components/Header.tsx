import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import type { INotification } from '../types';

const Header = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (user) loadNotifications();
    const interval = setInterval(() => {
      if (user) loadNotifications();
    }, 20000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/shop/products?search=${encodeURIComponent(search)}`);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await api.put('/notifications/read-all');
    } catch {
      loadNotifications();
    }
  };

  const handleMarkOneRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await api.put(`/notifications/${id}/read`);
    } catch {
      loadNotifications();
    }
  };

  const handleLogout = () => {
    // Navigate to the public landing page *first*, then clear the session.
    // Doing it in the other order leaves the app on a protected route for a
    // moment with no user, which makes ProtectedRoute redirect to /login
    // instead of the intended landing page.
    navigate('/', { replace: true });
    logout();
  };

  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur border-b border-tan/30">
      <div className="container-nappa flex items-center gap-3 py-3">
        <Link to="/shop" className="flex items-center gap-2 shrink-0">
          <img src="/images/logo.png" alt="Nappa logo" className="w-10 h-10 object-contain" />
          <span className="hidden md:block font-display text-base leading-tight text-bark">
            Nappa Food & Crafts<br /><span className="text-xs font-body font-normal text-bark/60">Pasalubong Center</span>
          </span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-auto hidden sm:block">
          <div className="input-icon-wrap">
            <i className="fas fa-magnifying-glass" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, categories..."
              className="input-field"
            />
          </div>
        </form>

        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          <button
            onClick={() => navigate('/shop/products')}
            className="sm:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream text-base text-bark"
            aria-label="Search"
          >
            <i className="fas fa-magnifying-glass" />
          </button>

          <div className="relative">
            <button
              onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream text-base text-bark"
              aria-label="Notifications"
            >
              <i className="fas fa-bell" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-oliveDark text-paper text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] card-surface shadow-card z-50 animate-pop-in max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-tan/30">
                    <span className="font-semibold text-sm text-ink">Notifications</span>
                    <button onClick={handleMarkAllRead} className="text-xs text-oliveDark font-semibold hover:underline">
                      Mark all as read
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-sm text-bark/50 text-center py-8">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n._id}
                        onClick={() => !n.isRead && handleMarkOneRead(n._id)}
                        className={`w-full text-left flex items-start gap-2.5 px-4 py-3 border-b border-tan/15 text-sm transition-colors ${!n.isRead ? 'bg-cream/40 hover:bg-cream/60' : 'hover:bg-cream/20'}`}
                      >
                        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!n.isRead ? 'bg-oliveDark' : 'bg-transparent'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-ink">{n.title}</p>
                          <p className="text-bark/70 text-xs mt-0.5">{n.message}</p>
                        </div>
                        {!n.isRead && <span className="text-[10px] font-semibold text-oliveDark shrink-0 mt-0.5">Mark read</span>}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => navigate('/shop/cart')}
            className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream text-base text-bark"
            aria-label="Cart"
          >
            <i className="fas fa-bag-shopping" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-oliveDark text-paper text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate('/shop/orders')}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream text-base text-bark"
            aria-label="Order tracking"
          >
            <i className="fas fa-truck-fast" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-olive text-paper font-bold text-sm"
              aria-label="Profile menu"
            >
              {user?.firstName?.[0]?.toUpperCase() || 'U'}
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 card-surface shadow-card z-50 animate-pop-in overflow-hidden">
                  <div className="px-4 py-3 border-b border-tan/30">
                    <p className="text-sm font-semibold text-ink truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-bark/50 truncate">{user?.email}</p>
                  </div>
                  <Link to="/shop/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-cream/50"><i className="fas fa-user w-4 text-bark/50" /> Edit Profile</Link>
                  <Link to="/shop/addresses" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-cream/50"><i className="fas fa-location-dot w-4 text-bark/50" /> My Addresses</Link>
                  <Link to="/shop/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-cream/50"><i className="fas fa-gear w-4 text-bark/50" /> Settings</Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"><i className="fas fa-right-from-bracket w-4" /> Logout</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
