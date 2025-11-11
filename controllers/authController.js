const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserType = require('../models/UserType');
const Address = require('../models/Address');
const City = require('../models/City');
const Otp = require('../models/Otp');

const ADMIN_OTP = process.env.ADMIN_OTP || '555444';

async function isAdminUser(user) {
  try {
    if (!user) return false;
    const typeId = user.userType || (user.user && user.user.userType);
    if (!typeId) return false;
    const type = await UserType.findById(typeId);
    return !!(type && /^admin$/i.test(type.name));
  } catch (_e) {
    return false;
  }
}

// POST /api/auth/login (OTP-only)
async function login(req, res) {
  try {
    const { mobile, code } = req.body || {};
    if (!mobile) return res.status(400).json({ message: 'mobile is required' });

    const user = await User.findOne({ primaryMobile: mobile }).lean(false);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isActive === false) return res.status(403).json({ message: 'User is inactive' });

    if (!code) {
      const issued = await issueOtp({ userId: user._id, mobile, purpose: 'login' });
      const resp = { message: 'OTP sent', mobile: mobile.replace(/.(?=.{4})/g, 'x') };
      if (process.env.NODE_ENV !== 'production') resp.debugOtp = issued;
      return res.json(resp);
    }

    const isAdmin = await isAdminUser(user);
    if (isAdmin && code === ADMIN_OTP) {
      // Admin fixed OTP: allow without consuming
    } else {
      const now = new Date();
      const otp = await Otp.findOne({ mobile, code, consumed: false, expiresAt: { $gt: now } }).sort({ createdAt: -1 });
      if (!otp) return res.status(400).json({ message: 'Invalid or expired OTP' });
      otp.consumed = true;
      await otp.save();
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: 'Missing JWT_SECRET in environment' });

    const token = jwt.sign(
      { sub: user._id.toString(), mobile: user.primaryMobile, email: user.email },
      secret,
      { expiresIn: '12h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, userName: user.userName, email: user.email, uniqueCode: user.uniqueCode },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
}

// Helpers
function randomDigits(length) {
  let out = '';
  while (out.length < length) out += Math.floor(Math.random() * 10).toString();
  return out.slice(0, length);
}

async function generateUniqueUserCode(typeName) {
  const MAX_TRIES = 10;
  let attempt = 0;
  while (attempt < MAX_TRIES) {
    attempt++;
    let code;
    if (/^dealer$/i.test(typeName)) {
      code = '99' + randomDigits(14);
    } else if (/^sales(person)?$/i.test(typeName) || /^salesman$/i.test(typeName)) {
      code = '11' + randomDigits(14);
    } else if (/^distributor$/i.test(typeName)) {
      const n = 100000 + Math.floor(Math.random() * 900000);
      code = String(n);
    } else {
      code = randomDigits(12);
    }
    const exists = await User.exists({ uniqueCode: code });
    if (!exists) return code;
  }
  throw new Error('Failed to generate unique user code');
}

async function issueOtp({ userId, mobile, purpose, ttlMinutes = 10 }) {
  let code = '' + Math.floor(100000 + Math.random() * 900000);
  let expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  // If user is Admin, enforce fixed OTP and long expiry
  if (userId) {
    try {
      const u = await User.findById(userId);
      if (await isAdminUser(u)) {
        code = ADMIN_OTP;
        expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // ~1 year
      }
    } catch (_e) {
      // ignore and fallback to random OTP
    }
  }

  await Otp.create({ user: userId || undefined, mobile, code, purpose, expiresAt });
  return { code, expiresAt };
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { userName, email, primaryMobile, typeName, address1, address2, cityName } = req.body || {};
    if (!userName || !primaryMobile || !typeName) {
      return res.status(400).json({ message: 'userName, primaryMobile, typeName are required' });
    }

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) return res.status(409).json({ message: 'Email already registered' });
    }

    const existingMobile = await User.findOne({ primaryMobile });
    if (existingMobile) return res.status(409).json({ message: 'Mobile already registered' });

    let userType = await UserType.findOne({ name: typeName });
    if (!userType) userType = await UserType.create({ name: typeName });

    let addressDoc;
    if (address1 || address2 || cityName) {
      let cityDoc = null;
      if (cityName) {
        cityDoc = await City.findOneAndUpdate({ cityName }, { cityName }, { new: true, upsert: true });
      }
      addressDoc = await Address.create({ address1, address2, city: cityDoc?._id });
    }

    const uniqueCode = await generateUniqueUserCode(typeName);

    const user = await User.create({
      userName,
      email,
      primaryMobile,
      userType: userType._id,
      address: addressDoc?._id,
      uniqueCode,
      isActive: true,
    });

    const { code, expiresAt } = await issueOtp({ userId: user._id, mobile: primaryMobile, purpose: 'register' });

    const mask = (m) => (m ? m.replace(/.(?=.{4})/g, 'x') : m);
    const payload = {
      message: 'User registered. OTP sent to mobile.',
      user: { id: user._id, email: user.email, userName: user.userName, uniqueCode: user.uniqueCode, primaryMobile: mask(user.primaryMobile) },
    };
    if (process.env.NODE_ENV !== 'production') payload.debugOtp = { code, expiresAt };
    res.status(201).json(payload);
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
}

async function requestOtp(req, res) {
  try {
    const { mobile, purpose } = req.body || {};
    if (!mobile || !purpose) return res.status(400).json({ message: 'mobile and purpose are required' });
    const user = await User.findOne({ primaryMobile: mobile });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { code, expiresAt } = await issueOtp({ userId: user._id, mobile, purpose });
    const response = { message: 'OTP sent', mobile: mobile.replace(/.(?=.{4})/g, 'x') };
    if (process.env.NODE_ENV !== 'production') response.debugOtp = { code, expiresAt };
    res.json(response);
  } catch (err) {
    console.error('requestOtp error:', err);
    res.status(500).json({ message: 'Failed to issue OTP', error: err.message });
  }
}

async function verifyOtp(req, res) {
  try {
    const { mobile, code } = req.body || {};
    if (!mobile || !code) return res.status(400).json({ message: 'mobile and code are required' });
    const user = await User.findOne({ primaryMobile: mobile });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isAdmin = await isAdminUser(user);
    if (isAdmin && code === ADMIN_OTP) {
      // Do not consume admin fixed OTP; keep reusable
    } else {
      const now = new Date();
      const otp = await Otp.findOne({ mobile, code, consumed: false, expiresAt: { $gt: now } }).sort({ createdAt: -1 });
      if (!otp) return res.status(400).json({ message: 'Invalid or expired OTP' });
      otp.consumed = true;
      await otp.save();
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: 'Missing JWT_SECRET in environment' });

    const token = jwt.sign({ sub: user._id.toString(), mobile: user.primaryMobile, email: user.email }, secret, { expiresIn: '12h' });
    res.json({ message: 'OTP verified', token, user: { id: user._id, email: user.email, userName: user.userName, uniqueCode: user.uniqueCode } });
  } catch (err) {
    console.error('verifyOtp error:', err);
    res.status(500).json({ message: 'Failed to verify OTP', error: err.message });
  }
}

module.exports = { login, register, requestOtp, verifyOtp };
