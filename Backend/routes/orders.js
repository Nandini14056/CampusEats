const express = require('express');
const { protect, requireRole } = require('../middleware/auth');
const { placeOrder, getAllOrders, getOrdersForRiders, getOrder, orderStatus, riderAcceptedOrder } = require('../controllers/order.controller');
const router = express.Router();

// ─── POST /api/orders  (customer places order) 
router.post('/', protect, requireRole('customer'), placeOrder);

// ─── GET /api/orders  (role-based list) 
router.get('/', protect, getAllOrders);

// ─── GET /api/orders/available  (unassigned ready orders for riders)
router.get('/available', protect, requireRole('delivery'), getOrdersForRiders);

// ─── GET /api/orders/:id  (single order) 
router.get('/:id', protect, getOrder);

// ─── PATCH /api/orders/:id/status  (seller updates: confirmed→preparing→ready) 
router.patch('/:id/status', protect, orderStatus);

// ─── PATCH /api/orders/:id/accept  (rider accepts order) 
router.patch('/:id/accept', protect, requireRole('delivery'), riderAcceptedOrder);

function getStatusMessage(status) {
  const m = {
    placed: '📋 Order received!',
    confirmed: '✅ Order confirmed by restaurant',
    preparing: '👨‍🍳 Restaurant is preparing your food',
    ready: '🍱 Order ready for pickup',
    picked_up: '🛵 Rider is on the way!',
    delivered: '✅ Delivered! Enjoy your meal',
    cancelled: '❌ Order was cancelled'
  };
  return m[status] || `Order ${status}`;
}

module.exports = router;
