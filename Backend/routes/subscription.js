const express = require('express');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');
const router = express.Router();

// POST /api/subscription/activate
router.post('/activate', protect, requireRole('seller'), async (req, res) => {
  try {
    const { plan, paymentMethod, transactionId } = req.body;
    if (!['monthly', 'revenue_share'].includes(plan))
      return res.status(400).json({ message: 'Invalid plan' });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const user = await User.findByIdAndUpdate(req.user._id, {
      'subscription.plan': plan,
      'subscription.startDate': startDate,
      'subscription.endDate': endDate,
      'subscription.isActive': true
    }, { new: true });

    res.json({ message: 'Subscription activated', subscription: user.subscription });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/subscription/status
router.get('/status', protect, requireRole('seller'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('subscription');
    // Auto-expire if past end date
    if (user.subscription.isActive && user.subscription.endDate < new Date()) {
      user.subscription.isActive = false;
      await user.save();
    }
    res.json(user.subscription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
