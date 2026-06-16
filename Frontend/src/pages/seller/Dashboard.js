import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';
import styles from './Dashboard.module.css';

const STATUS_CONFIG = {
  placed: { label: 'New', cls: 'sNew' },
  confirmed: { label: 'Confirmed', cls: 'sConf' },
  preparing: { label: 'Preparing', cls: 'sPrep' },
  ready: { label: 'Ready', cls: 'sReady' },
  picked_up: { label: 'Picked Up', cls: 'sPick' },
  delivered: { label: 'Delivered', cls: 'sDone' },
  cancelled: { label: 'Cancelled', cls: 'sCancel' },
};
const NEXT = { placed: 'confirmed', confirmed: 'preparing', preparing: 'ready' };

export default function SellerDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ ordersToday: 0, revenue: 0, products: 0, earnToday: 0 });
  const [loading, setLoading] = useState(true);
  const [newOrderIds, setNewOrderIds] = useState(new Set());

  useEffect(() => {
    if (!user?.subscription?.isActive) { navigate('/seller/subscription'); return; }
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Socket: new order arrives in real time
  useEffect(() => {
    if (!socket) return;
    const handler = ({ order }) => {
      if (!order) return;
      setOrders(prev => {
        if (prev.find(o => o._id === order._id)) return prev;
        setNewOrderIds(ids => new Set([...ids, order._id]));
        setTimeout(() => setNewOrderIds(ids => { const n = new Set(ids); n.delete(order._id); return n; }), 5000);
        return [order, ...prev];
      });
      // Refresh stats
      fetchData();
    };
    socket.on('newOrder', handler);
    return () => socket.off('newOrder', handler);
  }, [socket]);

  // Socket: order delivered — refresh earnings
  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchData();
    socket.on('orderDelivered', handler);
    return () => socket.off('orderDelivered', handler);
  }, [socket]);

  const fetchData = async () => {
    try {
      const [ordRes, prodRes] = await Promise.all([api.get('/orders'), api.get('/products/seller')]);
      const allOrders = Array.isArray(ordRes.data)
        ? ordRes.data
        : ordRes.data.orders || [];
      setOrders(allOrders);

      console.log("orders.data = ", ordRes.data);

      const today = new Date().toDateString();
      const todayOrders = allOrders.filter(o => new Date(o.placedAt).toDateString() === today);
      setStats({
        ordersToday: todayOrders.length,
        revenue: todayOrders.reduce((s, o) => s + o.total, 0),
        products: prodRes.data.length,
        earnToday: user?.earnings?.today || 0,
      });
    } catch { }
    finally { setLoading(false); }
  };

  const updateStatus = async (orderId, status) => {
    try { await api.patch(`/orders/${orderId}/status`, { status }); fetchData(); }
    catch { }
  };

  const liveOrders = Array.isArray(orders)
    ? orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
    : [];

  return (
    <div className="page">
      <Sidebar />
      <main className={`main-content ${styles.main}`}>
        {/* Header */}
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Dashboard 📊</h1>
            <p className={styles.sub}>Welcome, {user?.restaurantName || user?.name}</p>
          </div>
          <div className={styles.subBadge}>
            <span>💳</span>
            <span>{user?.subscription?.plan === 'monthly' ? 'Monthly Flat · ₹499/mo' : '10% Revenue Share'}</span>
            <span className="badge badge-green">Active</span>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          {[
            { icon: '📋', label: "Today's Orders", val: stats.ordersToday },
            { icon: '💰', label: "Today's Revenue", val: `₹ ${stats.revenue}` },
            { icon: '🏦', label: "Today's Earnings", val: `₹ ${stats.earnToday}` },
            { icon: '🍱', label: 'Products Listed', val: stats.products },
          ].map(s => (
            <div key={s.label} className={styles.statCard}>
              <span className={styles.statIcon}>{s.icon}</span>
              <div className={styles.statVal}>{s.val}</div>
              <div className={styles.statLbl}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Live orders */}
        <div className={styles.secHeader}>
          <h2>Live Orders</h2>
          <span className={styles.liveDot} />
          {liveOrders.length > 0 && <span className={styles.orderCount}>{liveOrders.length}</span>}
        </div>

        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
          : liveOrders.length === 0
            ? <div className={styles.empty}><span>🍽️</span><p>No active orders right now</p></div>
            : (
              <div className={styles.orderList}>
                {liveOrders.map(o => {
                  const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.placed;
                  const next = NEXT[o.status];
                  const isNew = newOrderIds.has(o._id);
                  return (
                    <div key={o._id} className={`${styles.orderCard} ${isNew ? styles.orderCardNew : ''}`}>
                      {isNew && <div className={styles.newBadge}>🔔 New Order!</div>}
                      <div className={styles.orderLeft}>
                        <div className={styles.orderId}>
                          #CE{o._id.slice(-4).toUpperCase()}
                          <span className={styles.orderTime}>{new Date(o.placedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={styles.orderCust}>👤 {o.customer?.name} · 📍 {o.deliveryBlock}</div>
                        <div className={styles.orderItems}>{o.items?.map(i => `${i.name}×${i.qty}`).join(', ')}</div>
                        <div className={styles.orderMeta}>
                          <span>₹ {o.total}</span>
                          <span>{o.paymentMethod === 'upi' ? '📱 UPI Paid' : '💵 COD'}</span>
                          <span style={{ color: o.paymentStatus === 'paid' ? 'var(--green)' : 'var(--orange)' }}>
                            {o.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
                          </span>
                        </div>
                      </div>
                      <div className={styles.orderRight}>
                        <span className={`${styles.status} ${styles[sc.cls]}`}>{sc.label}</span>
                        {next && (
                          <button className="btn btn-primary btn-sm" onClick={() => updateStatus(o._id, next)}>
                            Mark {STATUS_CONFIG[next]?.label} →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
      </main>
    </div>
  );
}
