const User = require('../models/User');
const Order = require('../models/Order');

const confirmOrder = async (req, res) => {
  try {
    const { orderId, txnId } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id
    })
      .populate('seller', 'name restaurantName');

    if (!order) {
      return res
        .status(404)
        .json({ message: 'Order not found' });
    }

    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.razorpayPaymentId = txnId || `sim_${crypto.randomBytes(8).toString('hex')}`;
    await order.save();

    // Notify seller via Socket.IO
    if (req.io) {
      req.io.to(`user:${order.seller._id}`).emit('newOrder', {
        order,
        message: `🛒 New order #CE${order._id.toString().slice(-4).toUpperCase()} — ₹${order.total}`
      });
    }

    return res
      .status(200)
      .json({
        success: true,
        data: {
          id: order._id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: order.total
        }
      });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

module.exports = {
  confirmOrder
}