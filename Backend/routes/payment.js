const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const { protect, requireRole } = require('../middleware/auth');
const router = express.Router();

// ── Mark order as paid (called after simulated payment success) ───────────────
// PATCH /api/payment/confirm-order
router.patch('/confirm-order', protect, requireRole('customer'), async (req, res) => {
  try {
    const { orderId, txnId } = req.body;
    const order = await Order.findOne({ _id: orderId, customer: req.user._id })
      .populate('customer', 'name').populate('seller');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.razorpayPaymentId = txnId || `sim_${Date.now()}`;
    await order.save();

    // Notify seller via Socket.IO
    if (req.io) {
      req.io.to(`user:${order.seller._id}`).emit('newOrder', {
        order,
        message: `🛒 New order #CE${order._id.toString().slice(-4).toUpperCase()} — ₹${order.total}`
      });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Activate seller subscription (after simulated payment) ────────────────────
// Already handled in /api/subscription/activate — this route is kept for
// compatibility with the Payment.js component that calls /subscription/activate
// directly. No extra route needed here.

module.exports = router;
