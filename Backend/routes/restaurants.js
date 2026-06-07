const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const router = express.Router();

// GET /api/restaurants - all active sellers with subscription
router.get('/', async (req, res) => {
  try {
    const sellers = await User.find({
      role: 'seller',
      'subscription.isActive': true
    }).select('name restaurantName restaurantDescription rating block');
    res.json(sellers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/restaurants/:id/menu
router.get('/:id/menu', async (req, res) => {
  try {
    const seller = await User.findById(req.params.id).select('-password');
    if (!seller || seller.role !== 'seller')
      return res.status(404).json({ message: 'Restaurant not found' });
    const products = await Product.find({ seller: req.params.id, isAvailable: true });
    res.json({ seller, products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
