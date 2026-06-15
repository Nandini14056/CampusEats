const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, restaurantName, restaurantDescription, block } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({
      name, email, phone, password, role,
      restaurantName: role === 'seller' ? restaurantName : undefined,
      restaurantDescription: role === 'seller' ? restaurantDescription : undefined,
      block: block || 'Block A'
    });

    const token = signToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

const updateUser = async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'address', 'block', 'isOnline'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  registerUser,
  loginUser,
  updateUser
}