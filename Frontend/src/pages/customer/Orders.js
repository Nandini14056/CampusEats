import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';
import styles from './Orders.module.css';

const STATUS_CONFIG = {
  placed: { label: 'Order Placed', color: '#6B7280', bg: '#F3F4F6' },
  confirmed: { label: 'Confirmed', color: '#1D4ED8', bg: '#DBEAFE' },
  preparing: { label: 'Preparing', color: '#92400E', bg: '#FEF3C7' },
  ready: { label: 'Ready', color: '#065F46', bg: '#D1FAE5' },
  picked_up: { label: 'On the way', color: '#4A8C7F', bg: '#EAF4F2' },
  delivered: { label: 'Delivered', color: '#15803D', bg: '#DCFCE7' },
  cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEE2E2' },
};

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/orders').then(r => { setOrders(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <Sidebar />
      <main className={`main-content ${styles.main}`}>
        <h1 className={styles.title}>My Orders 📦</h1>
        {loading ? <div style={{display:'flex',justifyContent:'center',padding:60}}><div className="spinner" /></div>
          : orders.length === 0 ? (
            <div className={styles.empty}><span>📦</span><p>No orders yet. Go order something delicious!</p>
              <button className="btn btn-primary" onClick={() => navigate('/home')}>Browse Food</button></div>
          ) : (
            <div className={styles.list}>
              {orders.map(o => {
                const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.placed;
                const active = !['delivered','cancelled'].includes(o.status);
                return (
                  <div key={o._id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <div><span className={styles.orderId}>#CE{o._id.slice(-4).toUpperCase()}</span>
                        <span className={styles.orderDate}>{new Date(o.placedAt).toLocaleDateString('en-IN', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
                      </div>
                      <span className={styles.status} style={{ color: sc.color, background: sc.bg }}>{sc.label}</span>
                    </div>
                    <div className={styles.orderItems}>{o.items.map(i => `${i.name} ×${i.qty}`).join(', ')}</div>
                    <div className={styles.orderFooter}>
                      <span className={styles.orderTotal}>₹ {o.total}</span>
                      <span className={styles.payBadge}>{o.paymentMethod === 'upi' ? '📱 UPI' : '💵 COD'}</span>
                      {active && <button className="btn btn-outline btn-sm" onClick={() => navigate(`/track/${o._id}`)}>📍 Track</button>}
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
