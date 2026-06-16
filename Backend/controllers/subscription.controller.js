const User = require('../models/User');

const activateSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user._id;

    if (
      user.subscription?.isActive &&
      user.subscription.endDate < new Date()
    ) {
      return res.status(400).json({
        message: 'Subscription already active'
      });
    }

    if (!['monthly', 'revenue_share'].includes(plan)) {
      return res
        .status(400)
        .json({ message: 'Invalid plan' });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const user = await User.findByIdAndUpdate(userId,
      {
        'subscription.plan': plan,
        'subscription.startDate': startDate,
        'subscription.endDate': endDate,
        'subscription.isActive': true
      },
      {
        new: true,
        runValidators: true
      });

    return res
      .status(200)
      .json({
        message: 'Subscription activated',
        subscription: user.subscription
      });

  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user._id
    const user = await User.findById(userId).select('subscription');

    // Auto-expire if past end date
    if (
      user.subscription.isActive &&
      user.subscription?.endDate &&
      user.subscription.endDate < new Date()
    ) {
      user.subscription.isActive = false;
      await user.save();
    }

    return res
      .status(200)
      .json(user.subscription);

  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

module.exports = {
  activateSubscription,
  getSubscriptionStatus
}