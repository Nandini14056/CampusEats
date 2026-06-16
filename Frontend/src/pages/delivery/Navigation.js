import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import styles from './Navigation.module.css';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

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

export default function DeliveryNavigation() {
  const { orderId } = useParams();
  const { state } = useLocation();
  const { user, updateUser } = useAuth();
  const { emitLocation } = useSocket();
  const navigate = useNavigate();

  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const trailRef = useRef(null);
  const watchIdRef = useRef(null);
  const posHistoryRef = useRef([]);

  const [order, setOrder] = useState(null);
  const [delivered, setDelivered] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('waiting'); // waiting | active | denied
  const [currentPos, setCurrentPos] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [heading, setHeading] = useState(null);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    api.get(`/orders/${orderId}`).then(r => setOrder(r.data)).catch(() => { });
  }, [orderId]);

  // Init Leaflet map
  useEffect(() => {
    loadLeaflet().then((L) => {
      if (!mapRef.current || leafletMapRef.current) return;
      const defaultCenter = [28.6139, 77.2090];
      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false });
      leafletMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      map.setView(defaultCenter, 16);

      // Rider marker (animated)
      const riderIcon = L.divIcon({
        html: `<div id="riderDot" style="background:#4A8C7F;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid #fff;box-shadow:0 2px 12px rgba(74,140,127,0.5)">🛵</div>`,
        iconSize: [40, 40], iconAnchor: [20, 20], className: ''
      });
      const destIcon = L.divIcon({
        html: `<div style="background:#EF4444;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">📍</div>`,
        iconSize: [36, 36], iconAnchor: [18, 36], className: ''
      });

      riderMarkerRef.current = L.marker(defaultCenter, { icon: riderIcon }).addTo(map);
      destMarkerRef.current = L.marker(defaultCenter, { icon: destIcon }).addTo(map).bindPopup('📍 Delivery Destination');
      trailRef.current = L.polyline([], { color: '#4A8C7F', weight: 4, opacity: 0.7 }).addTo(map);
    });

    return () => {
      if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; }
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Start real GPS watch after map is ready
  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus('denied'); return; }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, speed: spd, heading: hdg, accuracy } = pos.coords;
        setGpsStatus('active');
        setCurrentPos({ lat, lng, accuracy });
        setSpeed(spd ? Math.round(spd * 3.6) : 0); // m/s → km/h
        if (hdg) setHeading(Math.round(hdg));

        // Update rider position on map
        const L = window.L;
        if (riderMarkerRef.current && L) {
          riderMarkerRef.current.setLatLng([lat, lng]);
        }

        // Trail
        if (trailRef.current) {
          const latlngs = trailRef.current.getLatLngs();
          latlngs.push([lat, lng]);
          if (latlngs.length > 100) latlngs.shift();
          trailRef.current.setLatLngs(latlngs);
        }

        // Pan map
        if (leafletMapRef.current) leafletMapRef.current.panTo([lat, lng], { animate: true, duration: 1 });

        // Emit to socket (customer sees this)
        emitLocation(user._id, orderId, lat, lng, hdg);

        // Update location in DB (every 10 positions)
        posHistoryRef.current.push({ lat, lng });
        if (posHistoryRef.current.length % 10 === 0) {
          api.patch('/auth/me', { location: { lat, lng } }).catch(() => { });
        }

        // Calculate distance to destination if dest marker placed
        if (destMarkerRef.current && L) {
          const destLatLng = destMarkerRef.current.getLatLng();
          if (destLatLng.lat !== 28.6139) {
            const d = leafletMapRef.current.distance([lat, lng], destLatLng);
            setDistance(d < 1000 ? `${Math.round(d)} m` : `${(d / 1000).toFixed(1)} km`);
          }
        }
      },
      (err) => {
        if (err.code === 1) setGpsStatus('denied');
        else setGpsStatus('waiting');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    watchIdRef.current = watchId;
    return () => navigator.geolocation.clearWatch(watchId);
  }, [orderId, user._id, emitLocation]);

  // Place destination marker using customer block/address
  useEffect(() => {
    if (!order || !leafletMapRef.current || !destMarkerRef.current) return;
    // Use Nominatim geocoding to find delivery address
    const addr = `${order.deliveryAddress}, ${order.deliveryBlock}`;
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr + ' India')}&format=json&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data?.[0]) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          destMarkerRef.current.setLatLng([lat, lng]);
          destMarkerRef.current.bindPopup(`📍 ${order.deliveryAddress}`).openPopup();
        }
      })
      .catch(() => { });
  }, [order]);

  const markDelivered = async () => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'delivered' });
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      // Refresh earnings from server
      const { data } = await api.get('/delivery/stats');
      updateUser({ earnings: data.earnings });
      setDelivered(true);
      toast.success(`✅ Delivered! +₹${order?.riderEarning || 70} earned`);
    } catch {
      toast.error('Failed to mark as delivered');
    }
  };

  if (delivered) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successBox}>
          <div className={styles.successIcon}>✅</div>
          <h2>Delivery Complete!</h2>
          <p>Great work! You earned <strong>₹{order?.riderEarning || 70}</strong></p>
          <div className={styles.earnCard}><span>💰</span><span>₹{order?.riderEarning || 70} added to Today's Earnings</span></div>
          <button className="btn btn-primary btn-full btn-lg" onClick={() => navigate('/delivery')}>← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/delivery')}>←</button>
        <span className={styles.headerTitle}>Navigation 🗺️</span>
        {order && <span className={styles.orderId}>
          #CE{order?._id?.slice(-4)?.toUpperCase() || '----'}
        </span>}
        <div className={`${styles.gpsChip} ${gpsStatus === 'active' ? styles.gpsActive : ''}`}>
          {gpsStatus === 'active' ? '🟢 GPS Live' : gpsStatus === 'denied' ? '🔴 GPS Off' : '🟡 Finding GPS...'}
        </div>
      </div>

      {/* Map */}
      <div className={styles.mapWrap}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {/* GPS stats overlay */}
        {gpsStatus === 'active' && (
          <div className={styles.statsOverlay}>
            {speed > 0 && <div className={styles.statPill}>🚀 {speed} km/h</div>}
            {distance && <div className={styles.statPill}>📍 {distance} away</div>}
            {heading !== null && <div className={styles.statPill}>🧭 {getCardinal(heading)}</div>}
          </div>
        )}
        {gpsStatus === 'denied' && (
          <div className={styles.gpsWarning}>
            <span>⚠️</span> GPS access denied — please enable location in browser settings
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div className={styles.panel}>
        <div className={styles.destLabel}>Delivering to</div>
        <div className={styles.destName}>📍 {order?.deliveryAddress || state?.dest || 'Customer location'}</div>
        {distance && <div className={styles.eta}>{distance} away · ~{getETA(distance)} min ETA</div>}

        <div className={styles.actions}>
          <button className="btn btn-primary btn-lg" style={{ flex: 1, justifyContent: 'center' }} onClick={markDelivered}>
            ✅ Mark as Delivered
          </button>
          <button className="btn btn-ghost" style={{ padding: '14px 16px' }} onClick={() => navigate('/delivery')}>✕</button>
        </div>

        {order && (
          <div className={styles.orderInfo}>
            <span>📦 {order.items?.length} item(s)</span>
            <span>₹ {order.total}</span>
            <span>💰 Earn ₹{order.riderEarning}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function getCardinal(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}
function getETA(distStr) {
  if (!distStr) return '?';
  const m = parseFloat(distStr);
  const km = distStr.includes('km') ? m : m / 1000;
  return Math.max(1, Math.round(km / 0.3)); // avg ~18 km/h = 0.3 km/min
}
