const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserType = require('../models/UserType');

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: 'Unauthorized' });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: 'Missing JWT_SECRET' });

    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.sub).populate('userType');
    if (!user) return res.status(401).json({ message: 'Invalid token user' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  const u = req.user;
  if (!u) return res.status(401).json({ message: 'Unauthorized' });
  const isAdmin = u.userType && (u.userType.name === 'Admin');
  if (!isAdmin) return res.status(403).json({ message: 'Admin only' });
  next();
}

module.exports = { auth, requireAdmin };

