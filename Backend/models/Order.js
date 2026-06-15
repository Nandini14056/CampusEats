const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  name: String,
  price: Number,
  qty: Number,
  image: String
});

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    default: 30
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },

  paymentMethod: {
    type: String,
    enum: ['upi', 'cod'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },

  // Razorpay fields
  razorpayOrderId: {
    type: String,
    default: ''
  },
  razorpayPaymentId: {
    type: String,
    default: ''
  },

  status: {
    type: String,
    enum: ['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'],
    default: 'placed'
  },

  deliveryAddress: {
    type: String,
    required: true
  },
  deliveryBlock: {
    type: String,
    default: 'Block A'
  },
  estimatedDelivery: {
    type: Number,
    default: 30
  }, // minutes

  riderEarning: {
    type: Number,
    default: 70
  },  // credited to rider on delivery
  sellerEarning: {
    type: Number,
    default: 0
  },   // credited to seller on delivery

  placedAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: Date
});

module.exports = mongoose.model('Order', orderSchema);
