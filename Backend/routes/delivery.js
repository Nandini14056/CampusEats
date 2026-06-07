const express = require('express');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /api/delivery/stats - delivery partner dashboard stats
router.get('/stats', protect, requireRole('delivery'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('earnings rating ratingCount isOnline name');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/delivery/toggle-online
router.patch('/toggle-online', protect, requireRole('delivery'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isOnline: !req.user.isOnline },
      { new: true }
    ).select('isOnline');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/delivery/reset-daily - reset today's stats (called at midnight via cron)
router.post('/reset-daily', async (req, res) => {
  try {
    await User.updateMany({ role: 'delivery' }, {
      'earnings.today': 0,
      'earnings.deliveriesToday': 0
    });
    res.json({ message: 'Daily stats reset' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
