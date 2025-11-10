const express = require('express');
const { createUserType, createUser, listUsers, getUserById, updateUser, deleteUser, assignManager, listSubordinates } = require('../controllers/userController');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/create-type', createUserType);
router.post('/create-user', createUser);

// Admin-protected CRUD for users
router.get('/', auth, requireAdmin, listUsers);
router.get('/:id', auth, requireAdmin, getUserById);
router.patch('/:id', auth, requireAdmin, updateUser);
router.delete('/:id', auth, requireAdmin, deleteUser);

// Map Dealer/Salesperson: assign manager and list subordinates
router.post('/:id/assign-manager', auth, requireAdmin, assignManager);
router.get('/:id/subordinates', auth, requireAdmin, listSubordinates);

module.exports = router;
