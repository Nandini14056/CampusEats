import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';
import styles from './Tracking.module.css';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

const STATUS_ORDER = ['placed','confirmed','preparing','ready','picked_up','delivered'];
const STEPS = [
  { key:'placed',    label:'Order Confirmed', desc:'Restaurant received your order',  icon:'📋' },
  { key:'preparing', label:'Preparing',        desc:'Your food is being cooked',       icon:'👨‍🍳' },
  { key:'picked_up', label:'Out for Delivery', desc:'Rider picked up your order',      icon:'🛵' },
  { key:'delivered', label:'Delivered',        desc:'Enjoy your meal!',                icon:'✅' },
];

// Load Leaflet lazily
const loadLeaflet = () => new Promise((resolve) => {
  if (window.L) { resolve(window.L); return; }
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = LEAFLET_CSS;
  document.head.appendChild(link);
  const script = document.createElement('script');
  script.src = LEAFLET_JS;
  script.onload = () => resolve(window.L);
  document.body.appendChild(script);
});

export default function CustomerTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { trackOrder, riderLocation } = useSocket();
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const [order, setOrder] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [useRealGps, setUseRealGps] = useState(false);

  // Fetch order details
  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setOrder(data);
    } catch {}
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    // Poll status every 15s
    const poll = setInterval(fetchOrder, 15000);
    return () => clearInterval(poll);
  }, [fetchOrder]);

  // Join socket order room for live location
  useEffect(() => {
    if (orderId) trackOrder(orderId);
  }, [orderId, trackOrder]);

  // Init Leaflet map
  useEffect(() => {
    let map;
    loadLeaflet().then((L) => {
      if (!mapRef.current || leafletMapRef.current) return;

      // Default to a campus-like location (will update with real GPS)
      const defaultCenter = [28.6139, 77.2090]; // New Delhi (placeholder)

      map = L.map(mapRef.current, { zoomControl: true, attributionControl: false });
      leafletMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      map.setView(defaultCenter, 15);

      // Custom rider icon
      const riderIcon = L.divIcon({
        html: `<div style="background:#4A8C7F;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🛵</div>`,
        iconSize: [36, 36], iconAnchor: [18, 18], className: ''
      });
      const destIcon = L.divIcon({
        html: `<div style="background:#EF4444;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">📍</div>`,
        iconSize: [32, 32], iconAnchor: [16, 16], className: ''
      });

      riderMarkerRef.current = L.marker(defaultCenter, { icon: riderIcon })
        .addTo(map).bindPopup('🛵 Your rider is here');
      destMarkerRef.current = L.marker(defaultCenter, { icon: destIcon })
        .addTo(map).bindPopup('📍 Delivery location');

      // Route polyline (teal)
      routeLineRef.current = L.polyline([], { color:'#4A8C7F', weight:4, opacity:0.8, dashArray:'8 4' }).addTo(map);

      setMapReady(true);
    });

    return () => {
      if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; }
    };
  }, []);

  // Update map when real GPS location arrives via socket
  useEffect(() => {
    if (!mapReady || !riderLocation || !leafletMapRef.current) return;
    const { lat, lng } = riderLocation;
    if (!lat || !lng) return;

    setUseRealGps(true);
    const L = window.L;
    const pos = [lat, lng];

    // Smoothly move rider marker
    if (riderMarkerRef.current) riderMarkerRef.current.setLatLng(pos);

    // Extend polyline trail
    if (routeLineRef.current) {
      const latlngs = routeLineRef.current.getLatLngs();
      latlngs.push(L.latLng(lat, lng));
      // Keep last 60 points to avoid huge trails
      if (latlngs.length > 60) latlngs.shift();
      routeLineRef.current.setLatLngs(latlngs);
    }

    // Pan map to rider
    leafletMapRef.current.panTo(pos, { animate: true, duration: 1.5 });
  }, [riderLocation, mapReady]);

  // Use customer's GPS as destination marker
  useEffect(() => {
    if (!mapReady || !destMarkerRef.current) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          destMarkerRef.current.setLatLng([lat, lng]);
          if (!useRealGps && leafletMapRef.current) leafletMapRef.current.setView([lat, lng], 15);
        },
        () => {} // silently fail if denied
      );
    }
  }, [mapReady, useRealGps]);

  const stepStatus = (key) => {
    if (!order) return 'pending';
    const si = STATUS_ORDER.indexOf(order.status);
    if (key === 'placed') return 'done';
    if (key === 'preparing') return si >= 2 ? (si > 3 ? 'done' : 'active') : 'pending';
    if (key === 'picked_up') return si >= 4 ? (si > 4 ? 'done' : 'active') : 'pending';
    if (key === 'delivered') return order.status === 'delivered' ? 'done' : 'pending';
    return 'pending';
  };

  return (
    <div className="page">
      <Sidebar />
      <main className={`main-content ${styles.main}`}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/orders')}>←</button>
          <h1>Live Tracking 📍</h1>
          {useRealGps && <span className={styles.gpsLive}>🟢 Live GPS</span>}
        </div>

        <div className={styles.layout}>
          {/* Leaflet Map */}
          <div className={styles.mapBox}>
            <div ref={mapRef} style={{ width:'100%', height:'100%', borderRadius:16 }} />
            {!useRealGps && (
              <div className={styles.mapOverlay}>
                <div className={styles.mapWaiting}>
                  <div className="spinner" />
                  <span>Waiting for rider's live location...</span>
                </div>
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className={styles.panel}>
            {order && <div className={styles.oid}>Order #CE{order._id.slice(-4).toUpperCase()}</div>}
            <div className={styles.panelTitle}>
              {order ? getStatusLabel(order.status) : 'Loading...'}
            </div>

            <div className={styles.steps}>
              {STEPS.map((step, idx) => {
                const st = stepStatus(step.key);
                return (
                  <div key={step.key} className={`${styles.step} ${styles[st]}`}>
                    <div className={styles.stepDot}>{st === 'done' ? '✓' : step.icon}</div>
                    {idx < STEPS.length - 1 && <div className={styles.stepLine} />}
                    <div className={styles.stepInfo}>
                      <div className={styles.stepLabel}>{step.label}</div>
                      <div className={styles.stepDesc}>{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {order?.deliveryPartner && (
              <div className={styles.riderCard}>
                <div className="avatar" style={{ width:44, height:44, fontSize:16 }}>
                  {order.deliveryPartner.name?.[0] || 'R'}
                </div>
                <div className={styles.riderInfo}>
                  <div className={styles.riderName}>{order.deliveryPartner.name}</div>
                  <div className={styles.riderPhone}>📞 {order.deliveryPartner.phone}</div>
                </div>
                <div className={styles.riderRating}>⭐ {order.deliveryPartner.rating?.toFixed(1) || '4.9'}</div>
              </div>
            )}

            {order && (
              <div className={styles.orderMeta}>
                <div className={styles.metaRow}>
                  <span>Items</span>
                  <span>{order.items?.map(i => `${i.name}×${i.qty}`).join(', ')}</span>
                </div>
                <div className={styles.metaRow}>
                  <span>Total</span>
                  <span>₹ {order.total}</span>
                </div>
                <div className={styles.metaRow}>
                  <span>Payment</span>
                  <span style={{color: order.paymentStatus === 'paid' ? 'var(--green)' : 'var(--orange)'}}>
                    {order.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
                    {' · '}{order.paymentMethod === 'upi' ? '📱 UPI' : '💵 COD'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function getStatusLabel(s) {
  const m = { placed:'Order Placed 📋', confirmed:'Confirmed ✅', preparing:'Preparing your food 👨‍🍳', ready:'Ready for pickup 🍱', picked_up:'Rider on the way 🛵', delivered:'Delivered! 🎉' };
  return m[s] || s;
}
