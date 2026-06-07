import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import styles from './Sidebar.module.css';

const customerNav = [
  { to:'/home',   icon:'🏠', label:'Home',     end:true },
  { to:'/orders', icon:'📦', label:'My Orders' },
  { to:'/cart',   icon:'🛒', label:'Cart',     showCount:true },
];
const sellerNav = [
  { to:'/seller',              icon:'📊', label:'Dashboard',   end:true },
  { to:'/seller/orders',       icon:'📋', label:'Orders' },
  { to:'/seller/products',     icon:'🍱', label:'My Products' },
  { to:'/seller/products/add', icon:'➕', label:'Add Product' },
  { to:'/seller/subscription', icon:'💳', label:'Subscription' },
];
const deliveryNav = [
  { to:'/delivery', icon:'🏠', label:'Dashboard', end:true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { notifications, unreadCount, clearNotifications } = useSocket();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);

  const nav = user?.role === 'seller' ? sellerNav : user?.role === 'delivery' ? deliveryNav : customerNav;
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <span className={styles.brandIcon}>🍽️</span>
        <div>
          <div className={styles.brandName}>Campus <span>Canteen</span></div>
          <div className={styles.brandRole}>{user?.role}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {nav.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
            {item.showCount && cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className={styles.bottom}>
        {/* Notifications */}
        <div className={styles.notifWrap}>
          <button className={styles.notifBtn} onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) clearNotifications(); }}>
            <span>🔔</span>
            <span>Notifications</span>
            {unreadCount > 0 && <span className={styles.notifCount}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          {showNotifs && (
            <div className={styles.notifDropdown}>
              <div className={styles.notifHeader}>
                <span>Notifications</span>
                <button onClick={() => { clearNotifications(); setShowNotifs(false); }}>Clear all</button>
              </div>
              {notifications.length === 0
                ? <div className={styles.notifEmpty}>No notifications</div>
                : notifications.slice(0, 8).map((n, i) => (
                  <div key={i} className={styles.notifItem}>
                    <span className={styles.notifMsg}>{n.message}</span>
                    <span className={styles.notifTime}>{formatTime(n.ts)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Help */}
        <div className={styles.helpCard}>
          <div>🎧</div>
          <div>
            <div className={styles.helpTitle}>Need Help?</div>
            <button className={styles.helpBtn}>Call Support</button>
            <div className={styles.helpPhone}>+91 98765 43210</div>
          </div>
        </div>

        {/* User row */}
        <div className={styles.userRow}>
          <div className="avatar" style={{ width:36, height:36, fontSize:13 }}>{initials}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.name}</div>
            <div className={styles.userRole} style={{ textTransform:'capitalize' }}>{user?.role}</div>
          </div>
          <button className={styles.logoutBtn} title="Logout"
            onClick={() => { logout(); navigate('/'); }}>⏻</button>
        </div>
      </div>
    </aside>
  );
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
}
