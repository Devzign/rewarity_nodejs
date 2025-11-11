const express = require('express');
const Reward = require('../models/Reward');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/active', auth, async (_req, res) => {
  try { const items = await Reward.find({ isActive: true }).sort({ pointsRequired: 1 }); res.json(items); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});

router.get('/', auth, requireAdmin, async (_req, res) => {
  try { const items = await Reward.find().sort({ createdAt: -1 }); res.json(items); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});

router.post('/', auth, requireAdmin, async (req, res) => {
  try { const { name, description, pointsRequired, isActive } = req.body || {}; if (!name || pointsRequired == null) return res.status(400).json({ message: 'name and pointsRequired required' }); const doc = await Reward.create({ name, description, pointsRequired, isActive }); res.status(201).json(doc); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});

router.patch('/:id', auth, requireAdmin, async (req, res) => {
  try { const doc = await Reward.findById(req.params.id); if (!doc) return res.status(404).json({ message: 'Not found' }); const { name, description, pointsRequired, isActive } = req.body || {}; if (name !== undefined) doc.name = name; if (description !== undefined) doc.description = description; if (pointsRequired != null) doc.pointsRequired = pointsRequired; if (typeof isActive === 'boolean') doc.isActive = isActive; await doc.save(); res.json(doc); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});

router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try { const doc = await Reward.findByIdAndDelete(req.params.id); if (!doc) return res.status(404).json({ message: 'Not found' }); res.json({ message: 'Deleted' }); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});

module.exports = router;

