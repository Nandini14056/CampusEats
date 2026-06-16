const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

const getActiveSellerWithSubscription = async (req, res) => {
  try {
    const sellers = await User.find({
      role: 'seller',
      block: false,
      'subscription.isActive': true
    })
      .select(
        'name restaurantName restaurantDescription rating'
      )
      .lean();

    return res.status(200).json({
      success: true,
      data: sellers
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getRestaurantMenu = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant id'
      });
    }

    const seller = await User.findOne({
      _id: id,
      role: 'seller',
      block: false
    })
      .select(
        'name restaurantName restaurantDescription rating'
      )
      .lean();

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    const products = await Product.find({
      seller: id,
      isAvailable: true
    }).lean();

    return res.status(200).json({
      success: true,
      data: {
        seller,
        products
      }
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getActiveSellerWithSubscription,
  getRestaurantMenu
}