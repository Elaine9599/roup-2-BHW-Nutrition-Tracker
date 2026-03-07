const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// Protect dashboard routes
router.use(authenticate);

router.get('/', authorizeRoles('bhw', 'admin'), dashboardController.getDashboardStats);

module.exports = router;