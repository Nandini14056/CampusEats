const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const { getActiveSellerWithSubscription, getRestaurantMenu } = require('../controllers/restaurants.controller');
const router = express.Router();

// GET /api/restaurants - all active sellers with subscription
router.get('/', getActiveSellerWithSubscription);

// GET /api/restaurants/:id/menu
router.get('/:id/menu', getRestaurantMenu);

module.exports = router;
