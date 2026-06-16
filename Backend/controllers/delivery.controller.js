const User = require('../models/User');

const deliveryPartnerDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('earnings rating ratingCount isOnline name');
    return res
      .status(200)
      .json({
        user,
        message: "Delivery Partner's data is fetched"
      });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

const deliveryPartnerStatus = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isOnline: !req.user.isOnline },
      { new: true }
    ).select('isOnline');

    return res
      .status(200)
      .json(user);
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

const resetStats = async (req, res) => {
  try {
    await User.updateMany({ role: 'delivery' }, {
      'earnings.today': 0,
      'earnings.deliveriesToday': 0
    });

    return res
      .status(200)
      .json({ message: 'Daily stats reset' });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

module.exports = {
  deliveryPartnerDashboard,
  deliveryPartnerStatus,
  resetStats
}