const express = require('express');
const router = express.Router();
const nutritionController = require('../controllers/nutritionController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// All nutrition routes require authentication
router.use(authenticate);

// POST /api/nutrition → add nutrition record (BHW and admin)
router.post('/', authorizeRoles('bhw', 'admin'), nutritionController.addNutritionRecord);

module.exports = router;
