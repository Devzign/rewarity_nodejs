const Otp = require('../models/Otp');

function isAllowed(req) {
  const devKey = process.env.DEV_ADMIN_KEY;
  const provided = req.headers['x-dev-key'];

  // Allow in non-production; in production require matching key
  if (process.env.NODE_ENV !== 'production') {
    if (!devKey) return true; // no key set, allow locally
    return provided === devKey;
  }
  // production
  return devKey && provided === devKey;
}

// GET /api/dev/otps?mobile=...&limit=5
async function listOtps(req, res) {
  if (!isAllowed(req)) return res.status(403).json({ message: 'Forbidden' });

  const { mobile } = req.query;
  let limit = parseInt(req.query.limit, 10);
  if (Number.isNaN(limit) || limit <= 0) limit = 5;
  if (limit > 20) limit = 20;

  const filter = {};
  if (mobile) filter.mobile = String(mobile);

  const rows = await Otp.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('mobile code purpose consumed expiresAt createdAt');

  res.json({ count: rows.length, rows });
}

module.exports = { listOtps };

