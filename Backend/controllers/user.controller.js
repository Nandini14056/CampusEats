const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, restaurantName, restaurantDescription, block } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({
          message: "All required fields must be provided"
        });
    }

    const normalizedEmail = email.toLowerCase();

    const exists = await User.findOne({
      email: normalizedEmail
    });

    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      password,
      role,
      restaurantName: role === 'seller' ? restaurantName : undefined,
      restaurantDescription: role === 'seller' ? restaurantDescription : undefined,
      block: block || 'Block A'
    });

    const token = generateToken(user._id);

    return res
      .status(201)
      .json({ token, user, message: "User registered successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user || !(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    return res
      .status(200)
      .json({ token, user, message: "User logged in successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

const updateUser = async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'address', 'block', 'isOnline'];
    const updates = {};

    allowed.forEach(k => {
      if (req.body[k] !== undefined) {
        updates[k] = req.body[k];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      {
        new: true,
        runValidators: true
      });

    return res
      .status(200)
      .json({
        user,
        message: "User updated successfully"
      });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message });
  }
}

module.exports = {
  registerUser,
  loginUser,
  updateUser
}