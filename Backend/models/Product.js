const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    default: ''
  },
  imagePublicId: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['Canteen', 'South Indian', 'North Indian', 'Snacks', 'Beverages', 'Café', 'Desserts'],
    default: 'Canteen'
  },
  rating: {
    type: Number,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  availableQty: {
    type: Number,
    required: true,
    default: 0
  },
  soldQty: {
    type: Number,
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  prepTime: {
    type: Number,
    default: 15
  }, // minutes
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

productSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);
