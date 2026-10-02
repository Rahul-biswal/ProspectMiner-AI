const jwt = require('jsonwebtoken');
const User = require('../models/User');

/** Generate a signed JWT for a user */
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h', // Default to 1 hour session timeout
  });
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password, inviteCode } = req.body;

    // ── Invite-only gate ──
    // If INVITE_CODE is set in .env, every registration must supply it.
    // Set INVITE_CODE= (empty) to allow open registration.
    if (process.env.INVITE_CODE) {
      if (!inviteCode || inviteCode !== process.env.INVITE_CODE) {
        return res.status(403).json({ error: 'Invalid invite code. This app is invite-only.' });
      }
    }

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Explicitly select password (it's excluded by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/auth/me  (protected)
async function getMe(req, res) {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email } });
}

// POST /api/auth/change-password (protected)
async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await user.comparePassword(oldPassword))) {
      return res.status(401).json({ error: 'Incorrect old password.' });
    }

    user.password = newPassword;
    await user.save(); // Model pre-save hook will hash the new password

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { register, login, getMe, changePassword };
