# 🍽️ CampusEats v2 — Real-Time Campus Delivery Platform

Full-stack MERN app with **Razorpay payments**, **real GPS tracking**, and **Socket.IO** connecting customers, sellers, and delivery partners live.

---

## 🚀 What's New in v2

| Feature | v1 | v2 |
|---|---|---|
| GPS | Canvas animation | ✅ **Real device GPS + Leaflet maps** |
| Order notifications | Polling | ✅ **Socket.IO push (instant)** |
| Seller earnings | Manual | ✅ **Auto-credited on delivery** |
| Rider income | Manual | ✅ **DB `$inc` on delivery** |
| Customer tracking | Canvas | ✅ **Live Leaflet map with rider dot** |
| Rider navigation | Canvas | ✅ **Leaflet + watchPosition + compass** |

---

## 📁 Project Structure

```
campuseats/
├── backend/
│   ├── models/
│   │   ├── User.js          # Customer / Seller / Delivery schemas + earnings
│   │   ├── Product.js       # Food items with Cloudinary image
│   │   └── Order.js         # Full order lifecycle + Razorpay fields
│   ├── routes/
│   │   ├── auth.js          # Register, login, /me, update location
│   │   ├── payment.js       # ★ Razorpay: create-order, verify, subscription
│   │   ├── orders.js        # ★ Socket.IO: notifies all parties on status change
│   │   ├── products.js      # CRUD + image upload
│   │   ├── restaurants.js   # Seller listing + menus
│   │   ├── delivery.js      # Stats, toggle online
│   │   └── subscription.js  # Activate plan
│   ├── middleware/
│   │   ├── auth.js          # JWT protect + role guard
│   │   └── upload.js        # Multer + Cloudinary
│   └── server.js            # ★ Socket.IO server + all event handlers
│
└── frontend/src/
    ├── context/
    │   ├── AuthContext.js   # User state + JWT
    │   ├── CartContext.js   # Cart with localStorage
    │   └── SocketContext.js # ★ Socket.IO client: emits/listens for all events
    ├── components/
    │   └── Sidebar.js       # ★ Notification bell (real-time badge)
    ├── pages/
    │   ├── customer/
    │   │   ├── Cart.js      # ★ Razorpay checkout flow (UPI/Card/Wallet/Net Banking)
    │   │   └── Tracking.js  # ★ Real Leaflet map + live rider dot from socket
    │   ├── seller/
    │   │   ├── Dashboard.js # ★ Socket newOrder listener + earnings display
    │   │   └── Payment.js   # ★ Razorpay subscription payment (₹499)
    │   └── delivery/
    │       ├── Dashboard.js # ★ Socket push for new orders + earnings from DB
    │       └── Navigation.js# ★ Real GPS watchPosition → socket emit → customer sees live dot
    └── utils/api.js
```

---

## ⚙️ Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Cloudinary account (free tier)

---

### Step 1 — Get API Keys

#### Cloudinary
1. Sign up at https://cloudinary.com (free)
2. Copy **Cloud Name**, **API Key**, **API Secret** from Dashboard

---

### Step 2 — Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/campuseats

JWT_SECRET=any_random_string_at_least_32_characters_long

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

CLIENT_URL=http://localhost:3000
```

Install and start:
```bash
npm install
npm run dev
```

Backend runs at: **http://localhost:5000**

---

### Step 3 — Configure Frontend

```bash
cd frontend
```

Create `frontend/.env`:
```env
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_API_URL=http://localhost:5000/api
```

Install and start:
```bash
npm install
npm start
```

Frontend runs at: **http://localhost:3000**

---

## 💳 How Razorpay Works (Test Mode)

### Customer Food Payment (UPI/Card)
1. Customer adds items → Cart → clicks "Pay via Razorpay"
2. Backend: `POST /api/payment/create-order` creates a Razorpay order
3. Frontend opens Razorpay modal (test card: `4111 1111 1111 1111`)
4. On success: `POST /api/payment/verify` validates HMAC-SHA256 signature
5. Order marked `paymentStatus: 'paid'`, seller gets Socket.IO `newOrder` push

### Seller Subscription (₹499 Monthly)
1. Seller chooses "Monthly Flat" → clicks Pay
2. Backend: `POST /api/payment/subscription-order` (₹499 in paise)
3. Razorpay modal opens
4. On success: `POST /api/payment/verify-subscription` validates + activates plan
5. Seller can now list products

### Test Credentials
| Method | Details |
|--------|---------|
| Card | 4111 1111 1111 1111, any future expiry, any CVV |
| UPI | success@razorpay |
| Net Banking | Any bank → Test User |
| Wallet | Any → Test Mode |

---

## 📍 How Real GPS Works

### Delivery Partner (Sender)
- `navigator.geolocation.watchPosition()` fires every time device moves
- Sends `{ riderId, orderId, lat, lng, heading }` to Socket.IO server via `riderLocation` event
- Also updates `User.location` in DB every 10 position updates
- Speed (km/h), heading (compass), and distance to destination shown on screen

### Customer / Seller (Receiver)
- Calls `socket.emit('trackOrder', orderId)` to join the order room
- Server relays rider location to all room members via `locationUpdate` event
- Leaflet map moves the rider marker smoothly in real time
- OpenStreetMap tiles + Nominatim geocoding for the destination pin

---

## 🔌 Socket.IO Event Reference

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `register` | `userId` | Join personal room |
| `riderOnline` | `riderId` | Join `riders` broadcast room |
| `trackOrder` | `orderId` | Join order GPS room |
| `riderLocation` | `{riderId, orderId, lat, lng, heading}` | Push GPS position |

### Server → Client
| Event | Who receives | Description |
|-------|-------------|-------------|
| `newOrder` | Seller | Customer placed/paid an order |
| `newOrderAvailable` | All online riders | Order marked Ready by seller |
| `riderAssigned` | Customer | Rider accepted order |
| `orderStatusUpdate` | Customer | Any status change |
| `locationUpdate` | Customer + Seller | Rider GPS position |
| `orderDelivered` | Seller | Delivery complete + earnings credited |

---

## 💰 Earnings Flow (All Automatic)

```
Customer pays ₹200 order
    │
    ├── Delivery fee: ₹30 (free if order > ₹300)
    ├── Tax (5%): ₹10
    └── Total: ₹240
    
On delivery:
    ├── Rider earns: ₹70 (base ₹30 + 5% of order)
    │     → User.earnings.today += 70
    │     → User.earnings.deliveriesToday += 1
    │
    └── Seller earns: Subtotal − platform fee
          Monthly plan: 0% → earns ₹200
          Revenue share: 10% → earns ₹180 (₹20 to platform)
          → User.earnings.today += sellerCredit
```

---

## 🗄️ MongoDB Collections

### users
```js
{
  role: 'customer' | 'seller' | 'delivery',
  subscription: { plan, isActive, razorpayPaymentId },
  earnings: { today, total, deliveriesToday, totalDeliveries, ordersToday },
  location: { lat, lng, updatedAt },  // delivery partner GPS
  isOnline: Boolean
}
```

### products
```js
{
  seller: ObjectId,
  name, description, price, image,  // Cloudinary URL
  category, availableQty, prepTime,
  rating, isAvailable
}
```

### orders
```js
{
  customer, seller, deliveryPartner: ObjectId,
  items: [{ product, name, price, qty, image }],
  subtotal, deliveryFee, tax, total,
  paymentMethod: 'upi' | 'cod',
  paymentStatus: 'pending' | 'paid',
  razorpayOrderId, razorpayPaymentId,  // filled after Razorpay verify
  status: 'placed'→'confirmed'→'preparing'→'ready'→'picked_up'→'delivered',
  riderEarning, sellerEarning,
  deliveryAddress, deliveryBlock
}
```

---

## 🌐 API Endpoints

### Payment (New in v2)
```
POST /api/payment/create-order          Customer: creates Razorpay order for food
POST /api/payment/verify                Customer: verifies payment + confirms order
POST /api/payment/subscription-order    Seller: creates ₹499 subscription order
POST /api/payment/verify-subscription   Seller: verifies + activates plan
GET  /api/payment/key                   Returns Razorpay key ID
```

### Orders
```
POST   /api/orders                     Place order (customer)
GET    /api/orders                     List (role-filtered)
GET    /api/orders/available           Unassigned ready orders (delivery)
GET    /api/orders/:id                 Single order with all populated fields
PATCH  /api/orders/:id/status          Update status (seller or rider)
PATCH  /api/orders/:id/accept          Rider accepts → assigned + Socket notify
```

### Auth / Delivery
```
POST  /api/auth/register
POST  /api/auth/login
GET   /api/auth/me
PATCH /api/auth/me                     Update profile + GPS location
GET   /api/delivery/stats              Real earnings from DB
PATCH /api/delivery/toggle-online      Toggle isOnline + Socket emit
```

---

## 🚀 Production Deployment

### Backend (Render / Railway / Fly.io)
1. Set all environment variables
2. Build: `npm install`
3. Start: `node server.js`
4. Enable WebSocket support in your host settings

### Frontend (Vercel / Netlify)
1. Set `REACT_APP_SOCKET_URL=https://your-backend.com`
2. Build: `npm run build`
3. Add `_redirects`: `/* /index.html 200`
4. Update `CLIENT_URL` in backend `.env` to your frontend URL

### Razorpay Go Live
1. Complete KYC on Razorpay dashboard
2. Switch from Test to Live keys
3. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in backend `.env`

---

## ✅ Complete Feature Checklist

### Payments
- [x] Customer: UPI / Card / Net Banking / Wallet via Razorpay modal
- [x] HMAC-SHA256 signature verification (server-side)
- [x] COD orders (no payment gateway needed)
- [x] Seller subscription ₹499/month via Razorpay
- [x] Revenue Share plan (free activation)
- [x] Payment status tracked in Order collection

### Real-Time (Socket.IO)
- [x] Seller notified instantly when customer places order
- [x] All online riders notified when seller marks order Ready
- [x] Customer notified when rider accepts (name + phone shown)
- [x] Customer gets live status updates at every stage
- [x] Seller gets delivery confirmation + earnings credited message
- [x] Notification bell in sidebar with real-time badge count

### Real GPS
- [x] Rider uses `navigator.geolocation.watchPosition()` (real device GPS)
- [x] Position emitted to Socket.IO every update
- [x] Customer sees real Leaflet map (OpenStreetMap) with live rider dot
- [x] Smooth marker animation on position update
- [x] GPS polyline trail showing rider's route
- [x] Destination geocoded via Nominatim (real address → coordinates)
- [x] GPS status indicator (Live / Denied / Waiting)
- [x] Speed (km/h), compass heading, distance to destination on rider screen

### Earnings (All from DB, 0 for new users)
- [x] Rider earnings auto-incremented on `PATCH /orders/:id/status {delivered}`
- [x] Seller earnings auto-incremented based on subscription plan
- [x] Monthly Flat: 0% commission (seller keeps 100% of subtotal)
- [x] Revenue Share: 10% deducted, 90% credited to seller
- [x] Today's stats reset daily (manual endpoint or cron job)
- [x] New delivery partner: all stats start at 0

### User Flows
- [x] Customer → Razorpay → Order confirmed → Live GPS tracking
- [x] Seller → Subscription payment → Add products → Manage orders → Earn
- [x] Rider → Online toggle → Socket push notification → Accept → GPS nav → Deliver → Earnings update
