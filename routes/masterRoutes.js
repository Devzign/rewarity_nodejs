const express = require('express');
const Country = require('../models/Country');
const State = require('../models/State');
const City = require('../models/City');
const Pincode = require('../models/Pincode');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Countries
router.get('/countries', auth, async (_req, res) => {
  try { res.json(await Country.find({ isActive: true }).sort({ countryName: 1 })); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});
router.post('/countries', auth, requireAdmin, async (req, res) => {
  try { const { countryName, isActive } = req.body || {}; if (!countryName) return res.status(400).json({ message: 'countryName required' }); const doc = await Country.create({ countryName, isActive }); res.status(201).json(doc); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});
router.patch('/countries/:id', auth, requireAdmin, async (req, res) => {
  try { const doc = await Country.findById(req.params.id); if (!doc) return res.status(404).json({ message: 'Not found' }); const { countryName, isActive } = req.body || {}; if (countryName !== undefined) doc.countryName = countryName; if (typeof isActive === 'boolean') doc.isActive = isActive; await doc.save(); res.json(doc); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});
router.delete('/countries/:id', auth, requireAdmin, async (req, res) => {
  try { const doc = await Country.findByIdAndDelete(req.params.id); if (!doc) return res.status(404).json({ message: 'Not found' }); res.json({ message: 'Deleted' }); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});

// States
router.get('/states', auth, async (req, res) => {
  try { const q = {}; if (req.query.country) q.country = req.query.country; res.json(await State.find(q).sort({ stateName: 1 })); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});
router.post('/states', auth, requireAdmin, async (req, res) => {
  try { const { stateName, country, isActive } = req.body || {}; if (!stateName) return res.status(400).json({ message: 'stateName required' }); const doc = await State.create({ stateName, country, isActive }); res.status(201).json(doc); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});
router.patch('/states/:id', auth, requireAdmin, async (req, res) => {
  try { const doc = await State.findById(req.params.id); if (!doc) return res.status(404).json({ message: 'Not found' }); const { stateName, country, isActive } = req.body || {}; if (stateName !== undefined) doc.stateName = stateName; if (country !== undefined) doc.country = country || undefined; if (typeof isActive === 'boolean') doc.isActive = isActive; await doc.save(); res.json(doc); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});
router.delete('/states/:id', auth, requireAdmin, async (req, res) => {
  try { const doc = await State.findByIdAndDelete(req.params.id); if (!doc) return res.status(404).json({ message: 'Not found' }); res.json({ message: 'Deleted' }); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});

// Cities
router.get('/cities', auth, async (req, res) => {
  try { const q = {}; if (req.query.state) q.state = req.query.state; res.json(await City.find(q).sort({ cityName: 1 })); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});
router.post('/cities', auth, requireAdmin, async (req, res) => {
  try { const { cityName } = req.body || {}; if (!cityName) return res.status(400).json({ message: 'cityName required' }); const doc = await City.findOneAndUpdate({ cityName }, { cityName }, { upsert: true, new: true }); res.status(201).json(doc); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});
router.patch('/cities/:id', auth, requireAdmin, async (req, res) => {
  try { const doc = await City.findById(req.params.id); if (!doc) return res.status(404).json({ message: 'Not found' }); const { cityName } = req.body || {}; if (cityName !== undefined) doc.cityName = cityName; await doc.save(); res.json(doc); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});
router.delete('/cities/:id', auth, requireAdmin, async (req, res) => {
  try { const doc = await City.findByIdAndDelete(req.params.id); if (!doc) return res.status(404).json({ message: 'Not found' }); res.json({ message: 'Deleted' }); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});

// Pincodes
router.get('/pincodes', auth, async (req, res) => {
  try { const q = {}; if (req.query.city) q.city = req.query.city; res.json(await Pincode.find(q).sort({ code: 1 })); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});
router.post('/pincodes', auth, requireAdmin, async (req, res) => {
  try { const { code, city, isActive } = req.body || {}; if (!code) return res.status(400).json({ message: 'code required' }); const doc = await Pincode.create({ code, city, isActive }); res.status(201).json(doc); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});
router.patch('/pincodes/:id', auth, requireAdmin, async (req, res) => {
  try { const doc = await Pincode.findById(req.params.id); if (!doc) return res.status(404).json({ message: 'Not found' }); const { code, city, isActive } = req.body || {}; if (code !== undefined) doc.code = code; if (city !== undefined) doc.city = city || undefined; if (typeof isActive === 'boolean') doc.isActive = isActive; await doc.save(); res.json(doc); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});
router.delete('/pincodes/:id', auth, requireAdmin, async (req, res) => {
  try { const doc = await Pincode.findByIdAndDelete(req.params.id); if (!doc) return res.status(404).json({ message: 'Not found' }); res.json({ message: 'Deleted' }); } catch (e) { res.status(500).json({ message: 'Failed', error: e.message }); }
});

module.exports = router;

