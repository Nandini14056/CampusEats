const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// ─── Socket.IO Setup ──────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Attach io to every request so route handlers can emit events
app.use((req, _res, next) => { req.io = io; next(); });

// userId → socketId map
const onlineUsers = {};
// riderId → { lat, lng, orderId }
const riderLocations = {};

io.on('connection', (socket) => {
  // Register any authenticated user to their personal room
  socket.on('register', (userId) => {
    if (!userId) return;
    onlineUsers[userId] = socket.id;
    socket.join(`user:${userId}`);
  });

  // Delivery partner goes online — join rider room for push notifications
  socket.on('riderOnline', (riderId) => {
    if (!riderId) return;
    onlineUsers[riderId] = socket.id;
    socket.join(`rider:${riderId}`);
    socket.join('riders'); // broadcast room for all active riders
  });

  // Rider pushes real GPS coordinates (sent every 3s from navigator)
  socket.on('riderLocation', ({ riderId, orderId, lat, lng, heading }) => {
    riderLocations[riderId] = { lat, lng, orderId, heading, ts: Date.now() };
    // Emit to all watching this order (customer + seller)
    io.to(`order:${orderId}`).emit('locationUpdate', { lat, lng, heading, riderId, ts: Date.now() });
  });

  // Customer or seller joins an order room to get live location
  socket.on('trackOrder', (orderId) => {
    if (!orderId) return;
    socket.join(`order:${orderId}`);
    // Immediately push last known location if rider is already moving
    const entry = Object.values(riderLocations).find(v => v.orderId === orderId);
    if (entry) socket.emit('locationUpdate', { lat: entry.lat, lng: entry.lng, heading: entry.heading });
  });

  socket.on('disconnect', () => {
    for (const [uid, sid] of Object.entries(onlineUsers)) {
      if (sid === socket.id) { delete onlineUsers[uid]; break; }
    }
  });
});

// Make onlineUsers accessible from routes
app.locals.onlineUsers = onlineUsers;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/products',     require('./routes/products'));
app.use('/api/orders',       require('./routes/orders'));
app.use('/api/restaurants',  require('./routes/restaurants'));
app.use('/api/delivery',     require('./routes/delivery'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/payment',      require('./routes/payment'));

app.get('/api/health', (_req, res) =>
  res.json({ status: 'CampusEats v2 running ✅', clients: io.engine.clientsCount })
);

// ─── Start ───────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    httpServer.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server + Socket.IO on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1); });
