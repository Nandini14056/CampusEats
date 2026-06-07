import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [riderLocation, setRiderLocation] = useState(null); // { lat, lng, heading }
  const [onlineRiders, setOnlineRiders] = useState(0);

  // Connect / reconnect when user changes
  useEffect(() => {
    if (!user) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      // Register user to personal room
      socket.emit('register', user._id);
      // Delivery partner also joins riders broadcast room
      if (user.role === 'delivery') socket.emit('riderOnline', user._id);
    });

    // ── Customer / Seller listeners ──────────────────────────────────────────
    socket.on('orderStatusUpdate', ({ orderId, status, message }) => {
      addNotification({ type: 'status', orderId, message, ts: Date.now() });
      toast(message, { icon: getStatusIcon(status), duration: 5000 });
    });

    socket.on('riderAssigned', ({ orderId, riderName, message }) => {
      addNotification({ type: 'rider', orderId, message, ts: Date.now() });
      toast.success(message, { duration: 6000 });
    });

    socket.on('newOrder', ({ order, message }) => {
      addNotification({ type: 'order', orderId: order?._id, message, ts: Date.now() });
      toast.success(message, { duration: 7000, icon: '🛒' });
    });

    socket.on('orderDelivered', ({ orderId, earned }) => {
      const msg = `💰 Order delivered! ₹${earned} credited to your account`;
      addNotification({ type: 'earning', orderId, message: msg, ts: Date.now() });
      toast.success(msg, { duration: 7000 });
    });

    // ── Delivery partner listeners ────────────────────────────────────────────
    socket.on('newOrderAvailable', (data) => {
      addNotification({ type: 'newOrder', ...data, message: `New order from ${data.sellerName} — ₹${data.riderEarning} earning`, ts: Date.now() });
      toast(`🛵 New delivery request — ₹${data.riderEarning}`, { icon: '📦', duration: 8000 });
    });

    // ── Real-time GPS location from rider (customer/seller receives) ──────────
    socket.on('locationUpdate', ({ lat, lng, heading }) => {
      setRiderLocation({ lat, lng, heading });
    });

    socket.on('disconnect', () => console.log('Socket disconnected'));
    socket.on('connect_error', (e) => console.error('Socket error:', e.message));

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user?._id]);

  const addNotification = (n) => {
    setNotifications(prev => [n, ...prev].slice(0, 50));
  };

  const clearNotifications = () => setNotifications([]);

  // Track a specific order (join its room)
  const trackOrder = (orderId) => {
    if (socketRef.current && orderId) socketRef.current.emit('trackOrder', orderId);
  };

  // Rider emits their real GPS position
  const emitLocation = (riderId, orderId, lat, lng, heading) => {
    if (socketRef.current) {
      socketRef.current.emit('riderLocation', { riderId, orderId, lat, lng, heading });
    }
  };

  const socket = socketRef.current;
  const unreadCount = notifications.length;

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, clearNotifications, trackOrder, emitLocation, riderLocation, setRiderLocation }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

function getStatusIcon(status) {
  const icons = { placed:'📋', confirmed:'✅', preparing:'👨‍🍳', ready:'🍱', picked_up:'🛵', delivered:'✅', cancelled:'❌' };
  return icons[status] || '📦';
}
