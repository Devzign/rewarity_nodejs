const jwt = require('jsonwebtoken');
const User = require('../models/User');

let bcrypt;
try {
  bcrypt = require('bcryptjs');
} catch (_) {
  bcrypt = null;
}

// POST /api/auth/login
// Body: { email, password }
async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email }).lean(false);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'User is inactive' });
    }

    if (!bcrypt) {
      return res.status(500).json({ message: 'Password validation unavailable. Please install bcryptjs.' });
    }

    const ok = await bcrypt.compare(password, user.password || '');
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Missing JWT_SECRET in environment' });
    }

    // Map role info from either schema field
    const role = user.role || undefined; // for docs inserted directly

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role,
      },
      secret,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.userName || user.name,
        email: user.email,
        role,
        isActive: user.isActive !== false,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
}

module.exports = { login };

