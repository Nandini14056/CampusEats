const express = require('express');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');
const { activateSubscription, getSubscriptionStatus } = require('../controllers/subscription.controller');
const router = express.Router();

// POST /api/subscription/activate
router.post('/activate', protect, requireRole('seller'), activateSubscription);

// GET /api/subscription/status
router.get('/status', protect, requireRole('seller'), getSubscriptionStatus);

module.exports = router;
