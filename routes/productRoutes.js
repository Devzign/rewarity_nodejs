const express = require('express');
const Product = require('../models/Product');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Create product: any authenticated user (admin or regular)
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, category, colors, price, isActive } = req.body || {};
    if (!name) return res.status(400).json({ message: 'name is required' });
    const doc = await Product.create({
      name,
      description,
      category,
      colors,
      price,
      isActive,
      createdBy: req.user?._id,
    });
    const populated = await Product.findById(doc._id).populate('category colors createdBy');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create product', error: err.message });
  }
});

// List products: any authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const q = {};
    if (req.query.active === 'true') q.isActive = true;
    if (req.query.category) q.category = req.query.category;
    const items = await Product.find(q).sort({ createdAt: -1 }).populate('category colors createdBy');
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list products', error: err.message });
  }
});

// Get a product
router.get('/:id', auth, async (req, res) => {
  try {
    const doc = await Product.findById(req.params.id).populate('category colors createdBy');
    if (!doc) return res.status(404).json({ message: 'Product not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get product', error: err.message });
  }
});

// Update product: admin only for now
router.patch('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { name, description, category, colors, price, isActive } = req.body || {};
    const doc = await Product.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Product not found' });
    if (name !== undefined) doc.name = name;
    if (description !== undefined) doc.description = description;
    if (category !== undefined) doc.category = category || undefined;
    if (colors !== undefined) doc.colors = Array.isArray(colors) ? colors : [];
    if (price !== undefined) doc.price = price;
    if (typeof isActive === 'boolean') doc.isActive = isActive;
    await doc.save();
    const populated = await Product.findById(doc._id).populate('category colors createdBy');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update product', error: err.message });
  }
});

// Delete product: admin only
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const doc = await Product.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete product', error: err.message });
  }
});

module.exports = router;

