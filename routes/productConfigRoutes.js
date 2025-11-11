const express = require('express');
const { auth, requireAdmin } = require('../middleware/auth');
const ProductPointsConfig = require('../models/ProductPointsConfig');
const ProductPurchasePrice = require('../models/ProductPurchasePrice');
const ProductSalePrice = require('../models/ProductSalePrice');
const ProductDealerPrice = require('../models/ProductDealerPrice');

const router = express.Router();

// Points config
router.post('/points', auth, requireAdmin, async (req, res) => {
  try {
    const { product, pointsPerUnit, isActive, effectiveFrom } = req.body || {};
    if (!product || pointsPerUnit == null) return res.status(400).json({ message: 'product and pointsPerUnit required' });
    const doc = await ProductPointsConfig.create({ product, pointsPerUnit, isActive, effectiveFrom });
    res.status(201).json(doc);
  } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});
router.get('/points', auth, async (req, res) => {
  try {
    const q = {}; if (req.query.product) q.product = req.query.product;
    const items = await ProductPointsConfig.find(q).sort({ effectiveFrom: -1 });
    res.json(items);
  } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});

// Purchase price
router.post('/purchase-price', auth, requireAdmin, async (req, res) => {
  try { const { product, price, currency, effectiveFrom } = req.body || {}; if (!product || price == null) return res.status(400).json({ message: 'product and price required' }); const doc = await ProductPurchasePrice.create({ product, price, currency, effectiveFrom }); res.status(201).json(doc); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});
router.get('/purchase-price', auth, async (req, res) => {
  try { const q = {}; if (req.query.product) q.product = req.query.product; const items = await ProductPurchasePrice.find(q).sort({ effectiveFrom: -1 }); res.json(items); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});

// Sale price
router.post('/sale-price', auth, requireAdmin, async (req, res) => {
  try { const { product, price, currency, effectiveFrom } = req.body || {}; if (!product || price == null) return res.status(400).json({ message: 'product and price required' }); const doc = await ProductSalePrice.create({ product, price, currency, effectiveFrom }); res.status(201).json(doc); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});
router.get('/sale-price', auth, async (req, res) => {
  try { const q = {}; if (req.query.product) q.product = req.query.product; const items = await ProductSalePrice.find(q).sort({ effectiveFrom: -1 }); res.json(items); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});

// Dealer price
router.post('/dealer-price', auth, requireAdmin, async (req, res) => {
  try { const { product, dealer, price, currency, effectiveFrom } = req.body || {}; if (!product || !dealer || price == null) return res.status(400).json({ message: 'product, dealer and price required' }); const doc = await ProductDealerPrice.create({ product, dealer, price, currency, effectiveFrom }); res.status(201).json(doc); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});
router.get('/dealer-price', auth, async (req, res) => {
  try { const q = {}; if (req.query.product) q.product = req.query.product; if (req.query.dealer) q.dealer = req.query.dealer; const items = await ProductDealerPrice.find(q).sort({ effectiveFrom: -1 }); res.json(items); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});

module.exports = router;

