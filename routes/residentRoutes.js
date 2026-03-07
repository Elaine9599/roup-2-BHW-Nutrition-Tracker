const express = require('express');
const router = express.Router();
const { getAllResidents, addResident } = require('../controllers/residentController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// Protect all resident routes
router.use(authenticate);

// @route   GET /api/residents
// @desc    Get all residents list
router.get('/', getAllResidents);

// @route   POST /api/residents
// @desc    Register a new resident (authenticated users only)
router.post('/', authorizeRoles('bhw'), addResident);

module.exports = router;