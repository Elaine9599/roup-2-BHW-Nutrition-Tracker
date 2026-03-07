const express = require('express');
const router = express.Router();
const { addItem, getInventory } = require('../controllers/inventoryController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// Protect inventory routes
router.use(authenticate);

router.post('/', authorizeRoles('admin', 'bhw'), addItem);
router.get('/', getInventory);

module.exports = router;