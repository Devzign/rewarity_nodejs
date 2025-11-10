const express = require('express');
const UserType = require('../models/UserType');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Create role
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body || {};
    if (!name) return res.status(400).json({ message: 'name is required' });
    const doc = await UserType.create({ name, description });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create role', error: err.message });
  }
});

// List roles
router.get('/', auth, requireAdmin, async (_req, res) => {
  try {
    const items = await UserType.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list roles', error: err.message });
  }
});

// Update role
router.patch('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body || {};
    const doc = await UserType.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Role not found' });
    if (name !== undefined) doc.name = name;
    if (description !== undefined) doc.description = description;
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role', error: err.message });
  }
});

// Delete role
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const doc = await UserType.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Role not found' });
    res.json({ message: 'Role deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete role', error: err.message });
  }
});

module.exports = router;

