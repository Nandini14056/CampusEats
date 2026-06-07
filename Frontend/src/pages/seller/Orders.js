import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';
import styles from './SellerOrders.module.css';

const STATUS_LABELS = { placed:'New', confirmed:'Confirmed', preparing:'Preparing', ready:'Ready', picked_up:'Picked Up', delivered:'Delivered', cancelled:'Cancelled' };
const STATUS_CLASSES = { placed:'sNew', confirmed:'sConf', preparing:'sPrep', ready:'sReady', picked_up:'sPickup', delivered:'sDone', cancelled:'sCancel' };
const NEXT = { placed:'confirmed', confirmed:'preparing', preparing:'ready' };

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('live');

  useEffect(() => { fetchOrders(); const t = setInterval(fetchOrders, 20000); return () => clearInterval(t); }, []);

  const fetchOrders = () => api.get('/orders').then(r => { setOrders(r.data); setLoading(false); }).catch(() => setLoading(false));

  const updateStatus = async (id, status) => {
    try { await api.patch(`/orders/${id}/status`, { status }); fetchOrders(); } catch {}
  };

  const live = orders.filter(o => !['delivered','cancelled'].includes(o.status));
  const history = orders.filter(o => ['delivered','cancelled'].includes(o.status));
  const shown = tab === 'live' ? live : history;

  return (
    <div className="page">
      <Sidebar />
      <main className={`main-content ${styles.main}`}>
        <h1 className={styles.title}>Orders 📋</h1>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab==='live'?styles.tabActive:''}`} onClick={() => setTab('live')}>
            Live Orders {live.length > 0 && <span className={styles.livePill}>{live.length}</span>}
          </button>
          <button className={`${styles.tab} ${tab==='history'?styles.tabActive:''}`} onClick={() => setTab('history')}>
            History
          </button>
        </div>
        {loading ? <div style={{display:'flex',justifyContent:'center',padding:60}}><div className="spinner"/></div>
          : shown.length === 0 ? (
            <div className={styles.empty}><span>📋</span><p>{tab==='live' ? 'No active orders right now' : 'No order history yet'}</p></div>
          ) : (
            <div className={styles.list}>
              {shown.map(o => {
                const next = NEXT[o.status];
                return (
                  <div key={o._id} className={styles.orderCard}>
                    <div className={styles.orderTop}>
                      <div className={styles.orderId}>#CE{o._id.slice(-4).toUpperCase()}</div>
                      <span className={`${styles.status} ${styles[STATUS_CLASSES[o.status]]}`}>{STATUS_LABELS[o.status]}</span>
                      <div className={styles.orderTime}>{new Date(o.placedAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                    <div className={styles.orderCustomer}>👤 {o.customer?.name} · 📍 {o.deliveryBlock}</div>
                    <div className={styles.orderItems}>{o.items.map(i=>`${i.name} ×${i.qty}`).join(' · ')}</div>
                    <div className={styles.orderBottom}>
                      <div className={styles.orderTotal}>₹ {o.total} · {o.paymentMethod==='upi'?'📱 UPI':'💵 COD'}</div>
                      {next && (
                        <button className="btn btn-primary btn-sm" onClick={() => updateStatus(o._id, next)}>
                          Mark as {STATUS_LABELS[next]} →
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
