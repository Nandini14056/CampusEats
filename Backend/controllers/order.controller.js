const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// Helper: notify all online riders of a new available order
const notifyRiders = (io, order) => {
  io.to('riders').emit('newOrderAvailable', {
    orderId: order._id,
    sellerName: order.seller?.restaurantName || order.seller?.name || 'Restaurant',
    deliveryAddress: order.deliveryAddress,
    deliveryBlock: order.deliveryBlock,
    total: order.total,
    riderEarning: order.riderEarning,
    items: order.items.length
  });
};

const placeOrder = async (req, res) => {
  try {
    const { items, paymentMethod, deliveryAddress, deliveryBlock } = req.body;

    if (!items || !items.length) {
      return res
        .status(400)
        .json({ message: 'Cart is empty' });
    }

    let seller = null;
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const prod = await Product.findById(item.productId).populate('seller');

      if (!prod) {
        return res
          .status(404)
          .json({ message: `Product not found` });
      }

      if (!seller) {
        seller = prod.seller._id;
      }

      if (
        seller &&
        seller.toString() !== prod.seller._id.toString()
      ) {
        return res.status(400).json({
          message: 'All items must be from the same restaurant'
        });
      }

      if (prod.availableQty < item.qty) {
        return res.status(400).json({
          message: `${prod.name} is out of stock`
        });
      }

      orderItems.push({
        product: prod._id,
        name: prod.name,
        price: prod.price,
        qty: item.qty,
        image: prod.image
      });

      subtotal += prod.price * item.qty;

      prod.availableQty = Math.max(0, prod.availableQty - item.qty);
      prod.soldQty = (prod.soldQty || 0) + item.qty;

      await prod.save();
    }

    const deliveryFee = subtotal > 300 ? 0 : 30;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee + tax;

    // For UPI: paymentStatus stays 'pending' until Razorpay verify callback
    // For COD: mark as pending, will be collected on delivery
    const order = await Order.create({
      customer: req.user._id,
      seller,
      items: orderItems,
      subtotal, deliveryFee, tax, total,
      paymentMethod,
      deliveryAddress: deliveryAddress || req.user.address || 'Campus',
      deliveryBlock: deliveryBlock || req.user.block || 'Block A',
      paymentStatus: 'pending', // UPI verified via /verify
      status: paymentMethod === 'cod' ? 'placed' : 'placed',
      riderEarning: Math.round(30 + (total * 0.05)) // base ₹30 + 5% of order
    });

    await order.populate(['customer', 'seller']);

    // For COD orders: immediately notify seller (UPI orders notified after payment verify)
    if (paymentMethod === 'cod' && req.io) {
      req.io.to(`user:${seller}`).emit('newOrder', {
        order,
        message: `🛒 New COD order from ${order.customer.name} — ₹${total}`
      });
    }

    return res
      .status(201)
      .json({
        order,
        message: "order placed successfully"
      });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

const getAllOrders = async (req, res) => {
  try {
    let filter = {};
    const userId = req.user._id;

    if (req.user.role === 'customer') {
      filter.customer = userId;
    }
    else if (req.user.role === 'seller') {
      filter.seller = userId;
    }
    else if (req.user.role === 'delivery') {
      // Show: assigned to me OR available (ready + unassigned)
      filter = {
        $or: [
          {
            deliveryPartner: req.user._id
          },
          {
            status: 'ready',
            deliveryPartner: null
          }]
      };
    }

    const orders = await Order.find(filter)
      .populate('customer', 'name phone block address')
      .populate('seller', 'name restaurantName')
      .populate('deliveryPartner', 'name phone')
      .sort({ placedAt: -1 })
      .limit(100);

    return res
      .status(200)
      .json({
        orders,
        message: "All orders fetched successfully"
      });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

const getOrdersForRiders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: 'ready',
      deliveryPartner: null
    })
      .populate('customer', 'name phone address block')
      .populate('seller', 'name restaurantName')
      .sort({ placedAt: -1 });

    return res
      .status(200)
      .json(orders);
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

const getOrder = async (req, res) => {
  try {

    const order = await Order.findById(req.params.id)
      .populate('customer', 'name phone block address')
      .populate('seller', 'name restaurantName phone')
      .populate('deliveryPartner', 'name phone rating');

    if (!order) {
      return res
        .status(404)
        .json({ message: 'Order not found' });
    }

    const isCustomer =
      order.customer._id.toString() === req.user._id.toString();

    const isSeller =
      order.seller._id.toString() === req.user._id.toString();

    const isRider =
      order.deliveryPartner?._id?.toString() === req.user._id.toString();

    if (!isCustomer && !isSeller && !isRider) {
      return res.status(403).json({
        message: 'Not authorized'
      });
    }

    return res
      .status(200)
      .json({
        order,
        message: "Order fetched successfully"
      });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

const orderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = [
      'confirmed',
      'preparing',
      'ready',
      'picked_up',
      'delivered',
      'cancelled'
    ];

    const order = await Order.findById(req.params.id)
      .populate('customer', 'name phone')
      .populate('seller', 'name restaurantName');

    if (!order) {
      return res
        .status(404)
        .json({ message: 'Order not found' });
    }

    const isSeller = req.user.role === 'seller' && order.seller._id.toString() === req.user._id.toString();

    const isRider = req.user.role === 'delivery' && order.deliveryPartner?.toString() === req.user._id.toString();

    if (!isSeller && !isRider) {
      return res
        .status(403)
        .json({ message: 'Not authorized' });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status'
      });
    }

    const currentStatus = order.status;

    const transitions = {
      placed: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['picked_up'],
      picked_up: ['delivered']
    };

    if (
      transitions[currentStatus] &&
      !transitions[currentStatus].includes(status)
    ) {
      return res.status(400).json({
        message: 'Invalid status transition'
      });
    }

    order.status = status;

    // When seller marks order READY → notify all online riders
    if (status === 'ready' && req.io) {
      notifyRiders(req.io, order);
      // Also notify customer
      req.io.to(`user:${order.customer._id}`).emit('orderStatusUpdate', {
        orderId: order._id,
        status,
        message: '🍱 Your order is ready for pickup!'
      });
    }

    // When rider marks DELIVERED
    if (status === 'delivered') {
      order.deliveredAt = new Date();
      order.paymentStatus = order.paymentMethod === 'cod' ? 'paid' : order.paymentStatus;

      // Credit rider earnings
      if (order.deliveryPartner) {
        await User.findByIdAndUpdate(order.deliveryPartner, {
          $inc: {
            'earnings.today': order.riderEarning,
            'earnings.total': order.riderEarning,
            'earnings.deliveriesToday': 1,
            'earnings.totalDeliveries': 1
          }
        });
      }

      // Credit seller earnings (subtotal minus platform fee)
      const platformFee = order.paymentMethod === 'monthly_sub'
        ? 0  // flat plan: 0% commission
        : Math.round(order.subtotal * 0.10); // revenue share 10%

      const sellerCredit = order.subtotal - platformFee;

      await User.findByIdAndUpdate(order.seller._id, {
        $inc: {
          'earnings.today': sellerCredit,
          'earnings.total': sellerCredit,
          'earnings.ordersToday': 1
        }
      });

      // Notify customer
      if (req.io) {
        req.io.to(`user:${order.customer._id}`).emit('orderStatusUpdate', {
          orderId: order._id, status,
          message: '✅ Your order has been delivered! Enjoy your meal!'
        });
        // Notify seller
        req.io.to(`user:${order.seller._id}`).emit('orderDelivered', {
          orderId: order._id,
          earned: sellerCredit
        });
      }
    }

    // Generic status update → push to customer
    if (status !== 'delivered' && status !== 'ready' && req.io) {
      req.io.to(`user:${order.customer._id}`).emit('orderStatusUpdate', {
        orderId: order._id, status,
        message: getStatusMessage(status)
      });
    }

    await order.save();
    await order.populate('deliveryPartner', 'name phone');

    return res
      .status(200)
      .json(order);
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

const riderAcceptedOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name phone address block')
      .populate('seller', 'name restaurantName');

    if (!order) {
      return res
        .status(404)
        .json({ message: 'Order not found' });
    }

    if (order.deliveryPartner) {
      return res
        .status(400)
        .json({ message: 'Already assigned to another rider' });
    }

    if (order.status !== 'ready') {
      return res.status(400).json({
        message: 'Order is not ready for pickup'
      });
    }

    order.deliveryPartner = req.user._id;
    order.status = 'picked_up';
    await order.save();

    // Notify customer that rider is on the way
    if (req.io) {
      req.io.to(`user:${order.customer._id}`).emit('riderAssigned', {
        orderId: order._id,
        riderId: req.user._id,
        riderName: req.user.name,
        riderPhone: req.user.phone,
        message: `🛵 ${req.user.name} is on the way with your order!`
      });

      // Notify seller
      req.io.to(`user:${order.seller._id}`).emit('orderStatusUpdate', {
        orderId: order._id, status: 'picked_up',
        message: `🛵 Rider ${req.user.name} picked up order #CE${order._id.toString().slice(-4).toUpperCase()}`
      });
    }

    await order.populate('deliveryPartner', 'name phone');

    return res
      .status(200)
      .json(order);
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

function getStatusMessage(status) {
  const m = {
    placed: '📋 Order received!',
    confirmed: '✅ Order confirmed by restaurant',
    preparing: '👨‍🍳 Restaurant is preparing your food',
    ready: '🍱 Order ready for pickup',
    picked_up: '🛵 Rider is on the way!',
    delivered: '✅ Delivered! Enjoy your meal',
    cancelled: '❌ Order was cancelled'
  };
  return m[status] || `Order ${status}`;
}


module.exports = {
  placeOrder,
  getAllOrders,
  getOrdersForRiders,
  getOrder,
  orderStatus,
  riderAcceptedOrder
}