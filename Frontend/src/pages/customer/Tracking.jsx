import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import styles from './Tracking.module.css';

const riderIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
  iconSize: [45, 45],
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [40, 40],
});

export default function Tracking() {
  const { orderId } = useParams();
  const { socket } = useSocket();

  const [riderPosition, setRiderPosition] = useState(null);
  const [destination, setDestination] = useState([19.076, 72.8777]);
  const [routeCoords, setRouteCoords] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('delivery-location-update', (data) => {
      setRiderPosition([data.lat, data.lng]);
    });

    return () => {
      socket.off('delivery-location-update');
    };
  }, [socket]);

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h2>Track Your Order</h2>
      </div>

      <MapContainer
        center={destination}
        zoom={16}
        className={styles.map}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        {riderPosition && (
          <Marker position={riderPosition} icon={riderIcon}>
            <Popup>Delivery Partner</Popup>
          </Marker>
        )}

        <Marker position={destination} icon={destinationIcon}>
          <Popup>Your Location</Popup>
        </Marker>

        {routeCoords.length > 0 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{
              color: '#16a34a',
              weight: 6,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
