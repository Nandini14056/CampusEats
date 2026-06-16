const express = require('express');
const { protect, requireRole } = require('../middleware/auth');
const { deliveryPartnerDashboard, deliveryPartnerStatus, resetStats } = require('../controllers/delivery.controller');
const router = express.Router();

// GET /api/delivery/stats - delivery partner dashboard stats
router.get('/stats', protect, requireRole('delivery'), deliveryPartnerDashboard);

// PATCH /api/delivery/toggle-online
router.patch('/toggle-online', protect, requireRole('delivery'), deliveryPartnerStatus);

// POST /api/delivery/reset-daily - reset today's stats (called at midnight via cron)
router.post('/reset-daily', resetStats);

module.exports = router;
