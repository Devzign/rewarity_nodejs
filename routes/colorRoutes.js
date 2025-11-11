const express = require('express');
const Color = require('../models/Color');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Allow any authenticated user to add a color
router.post('/', auth, async (req, res) => {
  try {
    const { name, value, isActive } = req.body || {};
    if (!name) return res.status(400).json({ message: 'name is required' });
    const doc = await Color.create({ name, value, isActive });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create color', error: err.message });
  }
});

// Keep full list admin-only; add an active list for users below
router.get('/', auth, requireAdmin, async (_req, res) => {
  try {
    const items = await Color.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list colors', error: err.message });
  }
});

router.patch('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { name, value, isActive } = req.body || {};
    const doc = await Color.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Color not found' });
    if (name !== undefined) doc.name = name;
    if (value !== undefined) doc.value = value;
    if (typeof isActive === 'boolean') doc.isActive = isActive;
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update color', error: err.message });
  }
});

router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const doc = await Color.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Color not found' });
    res.json({ message: 'Color deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete color', error: err.message });
  }
});

module.exports = router;
// Additional route: list active colors for any user
router.get('/active', auth, async (_req, res) => {
  try {
    const items = await Color.find({ isActive: true }).sort({ name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list active colors', error: err.message });
  }
});
