const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  phone:    { type: String, required: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['customer', 'seller', 'delivery'], required: true },
  avatar:   { type: String, default: '' },
  address:  { type: String, default: '' },
  block:    { type: String, default: 'Block A' },

  // ── Seller ────────────────────────────────────────────────────────────────
  restaurantName:        { type: String },
  restaurantDescription: { type: String },
  subscription: {
    plan:              { type: String, enum: ['none', 'monthly', 'revenue_share'], default: 'none' },
    startDate:         Date,
    endDate:           Date,
    isActive:          { type: Boolean, default: false },
    razorpayOrderId:   { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' }
  },
  // Seller earnings (credited when order delivered)
  earnings: {
    today:       { type: Number, default: 0 }, // reset daily
    total:       { type: Number, default: 0 },
    ordersToday: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    // Delivery partner fields (shared schema for simplicity)
    deliveriesToday: { type: Number, default: 0 },
    totalDeliveries: { type: Number, default: 0 }
  },

  // ── Delivery Partner ──────────────────────────────────────────────────────
  rating:      { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  isOnline:    { type: Boolean, default: false },

  // GPS location (delivery partner only)
  location: {
    lat:       { type: Number, default: 0 },
    lng:       { type: Number, default: 0 },
    updatedAt: Date
  },

  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (pw) {
  return bcrypt.compare(pw, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
