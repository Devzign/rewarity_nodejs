const express = require('express');
const { createUserType, createUser } = require('../controllers/userController');

const router = express.Router();

router.post('/create-type', createUserType);
router.post('/create-user', createUser);

module.exports = router;
