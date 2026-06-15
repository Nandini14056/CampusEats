const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const router = express.Router();
const {registerUser, loginUser, updateUser} = require('../controllers/user.controllers');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register',registerUser);

// POST /api/auth/login
router.post('/login', loginUser);

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json(req.user));

// PATCH /api/auth/me - update profile
router.patch('/me', protect, updateUser);

module.exports = router;
