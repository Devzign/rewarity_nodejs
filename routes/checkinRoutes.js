const express = require('express');
const CheckIn = require('../models/CheckIn');
const User = require('../models/User');
const UserType = require('../models/UserType');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function isSalespersonName(name) {
  return /^(sales(person)?|salesman)$/i.test(String(name || ''));
}

function requireSalesperson(req, res, next) {
  const u = req.user;
  if (!u) return res.status(401).json({ message: 'Unauthorized' });
  const ok = u.userType && isSalespersonName(u.userType.name);
  if (!ok) return res.status(403).json({ message: 'Salesperson only' });
  return next();
}

async function ensureDealer(userId) {
  const u = await User.findById(userId).populate('userType');
  if (!u) return { ok: false, error: 'Dealer not found' };
  const isDealer = u.userType && /^dealer$/i.test(u.userType.name);
  if (!isDealer) return { ok: false, error: 'dealerId is not a Dealer' };
  return { ok: true, user: u };
}

// Create a check-in (Salesperson only)
router.post('/', auth, requireSalesperson, async (req, res) => {
  try {
    const { dealerId, remarks, lat, lng, proofImageBase64, proofMimeType, proofCapturedAt } = req.body || {};
    if (!dealerId) return res.status(400).json({ message: 'dealerId is required' });

    const dealerRes = await ensureDealer(dealerId);
    if (!dealerRes.ok) return res.status(400).json({ message: dealerRes.error });

    const hasGps = Number.isFinite(lat) && Number.isFinite(lng);
    if (!hasGps && !proofImageBase64) {
      return res.status(400).json({ message: 'GPS missing: proofImageBase64 is required' });
    }

    let proof;
    if (proofImageBase64) {
      try {
        const buf = Buffer.from(String(proofImageBase64).replace(/^data:[^;]+;base64,/, ''), 'base64');
        proof = {
          data: buf,
          size: buf.length,
          mimeType: proofMimeType || 'image/jpeg',
          capturedAt: proofCapturedAt ? new Date(proofCapturedAt) : undefined,
        };
      } catch (e) {
        return res.status(400).json({ message: 'Invalid base64 image' });
      }
    }

    const doc = await CheckIn.create({
      salesperson: req.user._id,
      dealer: dealerId,
      remarks,
      lat: hasGps ? lat : undefined,
      lng: hasGps ? lng : undefined,
      proof,
    });

    const populated = await CheckIn.findById(doc._id).populate({ path: 'salesperson', select: 'userName userType' }).populate({ path: 'dealer', select: 'userName userType' });
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create check-in', error: err.message });
  }
});

// List my check-ins (Salesperson)
router.get('/', auth, requireSalesperson, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;
    const q = { salesperson: req.user._id };
    if (req.query.from || req.query.to) {
      q.createdAt = {};
      if (req.query.from) q.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) q.createdAt.$lte = new Date(req.query.to);
    }
    const [items, total] = await Promise.all([
      CheckIn.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('dealer salesperson'),
      CheckIn.countDocuments(q),
    ]);
    res.json({ items, page, limit, total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list check-ins', error: err.message });
  }
});

// Admin: list check-ins with filters
router.get('/admin', auth, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 200);
    const skip = (page - 1) * limit;
    const q = {};
    if (req.query.salesperson) q.salesperson = req.query.salesperson;
    if (req.query.dealer) q.dealer = req.query.dealer;
    if (req.query.from || req.query.to) {
      q.createdAt = {};
      if (req.query.from) q.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) q.createdAt.$lte = new Date(req.query.to);
    }
    const [items, total] = await Promise.all([
      CheckIn.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('dealer salesperson'),
      CheckIn.countDocuments(q),
    ]);
    res.json({ items, page, limit, total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list check-ins', error: err.message });
  }
});

// Get single check-in (owner or admin)
router.get('/:id', auth, async (req, res) => {
  try {
    const doc = await CheckIn.findById(req.params.id).populate('dealer salesperson');
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const isOwner = String(doc.salesperson) === String(req.user._id) || (doc.salesperson && String(doc.salesperson._id) === String(req.user._id));
    const isAdmin = req.user.userType && /^admin$/i.test(req.user.userType.name);
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get check-in', error: err.message });
  }
});

// Get proof image (binary)
router.get('/:id/proof', auth, async (req, res) => {
  try {
    const doc = await CheckIn.findById(req.params.id).select('+proof');
    if (!doc || !doc.proof || !doc.proof.data) return res.status(404).json({ message: 'No proof' });
    const isOwner = String(doc.salesperson) === String(req.user._id);
    const isAdmin = req.user.userType && /^admin$/i.test(req.user.userType.name);
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });
    res.setHeader('Content-Type', doc.proof.mimeType || 'application/octet-stream');
    res.send(doc.proof.data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch proof', error: err.message });
  }
});

module.exports = router;

