const express = require('express');
const { protect, requireRole } = require('../middleware/auth');
const { confirmOrder } = require('../controllers/payment.controller');
const router = express.Router();

// ── Mark order as paid (called after simulated payment success) ───────────────
// PATCH /api/payment/confirm-order
router.patch('/confirm-order', protect, requireRole('customer'), confirmOrder);

module.exports = router;
