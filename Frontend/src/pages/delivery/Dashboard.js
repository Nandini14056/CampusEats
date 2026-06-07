import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import styles from './Dashboard.module.css';

export default function DeliveryDashboard() {
  const { user, updateUser } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ today:0, total:0, deliveriesToday:0, totalDeliveries:0 });
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [declined, setDeclined] = useState(new Set());
  const [newRequestIds, setNewRequestIds] = useState(new Set()); // for highlight animation
  const pollRef = useRef(null);

  // Fetch real earnings from DB on mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Socket: new order available notification
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      setRequests(prev => {
        if (prev.find(r => r._id === data.orderId)) return prev;
        const newReq = { _id: data.orderId, seller: { restaurantName: data.sellerName }, deliveryAddress: data.deliveryAddress, deliveryBlock: data.deliveryBlock, total: data.total, riderEarning: data.riderEarning, items: new Array(data.items).fill({}) };
        setNewRequestIds(ids => new Set([...ids, data.orderId]));
        setTimeout(() => setNewRequestIds(ids => { const n = new Set(ids); n.delete(data.orderId); return n; }), 3000);
        return [newReq, ...prev];
      });
    };
    socket.on('newOrderAvailable', handler);
    return () => socket.off('newOrderAvailable', handler);
  }, [socket]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/delivery/stats');
      setStats({
        today:           data.earnings?.today           || 0,
        total:           data.earnings?.total           || 0,
        deliveriesToday: data.earnings?.deliveriesToday || 0,
        totalDeliveries: data.earnings?.totalDeliveries || 0,
      });
      setIsOnline(data.isOnline || false);
    } catch {}
  };

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/orders/available');
      setRequests(data.filter(r => !declined.has(r._id)));
    } catch {}
  };

  const toggleOnline = async () => {
    try {
      const { data } = await api.patch('/delivery/toggle-online');
      const online = data.isOnline;
      setIsOnline(online);
      updateUser({ isOnline: online });

      if (online) {
        toast.success('You are now online! 🟢');
        if (socket) socket.emit('riderOnline', user._id);
        fetchRequests();
        pollRef.current = setInterval(fetchRequests, 20000);
      } else {
        toast('You are offline 😴', { icon:'😴' });
        clearInterval(pollRef.current);
        setRequests([]);
      }
    } catch { toast.error('Failed to update status'); }
  };

  // Auto-start polling if was already online
  useEffect(() => {
    if (isOnline) {
      if (socket) socket.emit('riderOnline', user._id);
      fetchRequests();
      pollRef.current = setInterval(fetchRequests, 20000);
    }
    return () => clearInterval(pollRef.current);
  }, []);

  const acceptOrder = async (req) => {
    try {
      await api.patch(`/orders/${req._id}/accept`);
      toast.success('Order accepted! Opening navigation...');
      setTimeout(() => navigate(`/delivery/navigate/${req._id}`, { state: { dest: req.deliveryAddress } }), 500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Already taken by another rider');
      setRequests(r => r.filter(x => x._id !== req._id));
    }
  };

  const declineOrder = (id) => {
    setDeclined(d => new Set([...d, id]));
    setRequests(r => r.filter(x => x._id !== id));
    toast('Request declined', { icon:'❌' });
  };

  return (
    <div className="page">
      <Sidebar />
      <main className={`main-content ${styles.main}`}>
        {/* Header */}
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>My Dashboard 🛵</h1>
            <p className={styles.sub}>Welcome, {user?.name}</p>
          </div>
          <div className={styles.onlineRow} onClick={toggleOnline}>
            <div className={`${styles.toggle} ${isOnline ? styles.toggleOn : ''}`}>
              <div className={styles.thumb} />
            </div>
            <span className={`${styles.onlineLabel} ${isOnline ? styles.onlineLabelOn : ''}`}>
              {isOnline ? '🟢 Online' : '😴 Offline'}
            </span>
          </div>
        </div>

        {/* Stats — all from DB, 0 for new users */}
        <div className={styles.statsGrid}>
          {[
            { icon:'🛵', label:"Deliveries Today",  val: stats.deliveriesToday },
            { icon:'💰', label:"Today's Earnings",   val: `₹ ${stats.today}` },
            { icon:'📦', label:'Total Deliveries',   val: stats.totalDeliveries },
            { icon:'💵', label:'Total Earned',        val: `₹ ${stats.total}` },
          ].map(s => (
            <div key={s.label} className={styles.statCard}>
              <span className={styles.statIcon}>{s.icon}</span>
              <div className={styles.statVal}>{s.val}</div>
              <div className={styles.statLbl}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Incoming requests */}
        <div className={styles.secHeader}>
          <h2>Incoming Requests</h2>
          {isOnline && <span className={styles.liveDot} />}
          {requests.length > 0 && <span className={styles.reqCount}>{requests.length}</span>}
        </div>

        {!isOnline ? (
          <div className={styles.offlineBox}>
            <span>😴</span>
            <p>You're offline. Go online to receive delivery requests.</p>
            <button className="btn btn-primary" onClick={toggleOnline}>Go Online</button>
          </div>
        ) : requests.length === 0 ? (
          <div className={styles.offlineBox}>
            <span>🔍</span>
            <p>No requests right now. Stay online — orders are auto-pushed to you.</p>
          </div>
        ) : (
          <div className={styles.reqList}>
            {requests.map(req => (
              <div key={req._id} className={`${styles.reqCard} ${newRequestIds.has(req._id) ? styles.reqCardNew : ''}`}>
                {newRequestIds.has(req._id) && <div className={styles.newBadge}>New!</div>}
                <div className={styles.reqLeft}>
                  <div className={styles.reqId}>#CE{req._id.slice(-4).toUpperCase()}</div>
                  <div className={styles.reqFrom}>🏪 {req.seller?.restaurantName || req.seller?.name || 'Restaurant'}</div>
                  <div className={styles.reqDest}>📍 {req.deliveryAddress} — {req.deliveryBlock}</div>
                  <div className={styles.reqMeta}>
                    <span>💵 ₹{req.total} order</span>
                    <span className={styles.earning}>💰 Earn ₹{req.riderEarning}</span>
                  </div>
                </div>
                <div className={styles.reqActions}>
                  <button className="btn btn-primary" style={{padding:'10px 18px'}} onClick={() => acceptOrder(req)}>
                    ✓ Accept
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => declineOrder(req._id)}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
