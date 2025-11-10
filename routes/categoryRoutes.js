const express = require('express');
const Category = require('../models/Category');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const { name, parent, isActive } = req.body || {};
    if (!name) return res.status(400).json({ message: 'name is required' });
    const doc = await Category.create({ name, parent, isActive });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create category', error: err.message });
  }
});

router.get('/', auth, requireAdmin, async (_req, res) => {
  try {
    const items = await Category.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list categories', error: err.message });
  }
});

router.patch('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { name, parent, isActive } = req.body || {};
    const doc = await Category.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Category not found' });
    if (name !== undefined) doc.name = name;
    if (parent !== undefined) doc.parent = parent || undefined;
    if (typeof isActive === 'boolean') doc.isActive = isActive;
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update category', error: err.message });
  }
});

router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const doc = await Category.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete category', error: err.message });
  }
});

module.exports = router;

