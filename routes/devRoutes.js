const express = require('express');
const { listOtps } = require('../controllers/devController');

const router = express.Router();

router.get('/otps', listOtps);

module.exports = router;

