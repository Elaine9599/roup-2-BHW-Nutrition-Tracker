const express = require('express');
const router = express.Router();
const bmiController = require('../controllers/bmiController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// All BMI routes require authentication
router.use(authenticate);

// GET /api/bmi → get all BMI records (BHW and admin)
router.get('/', authorizeRoles('bhw', 'admin'), bmiController.getAllBMI);

// POST /api/bmi → calculate and save BMI record (BHW and admin)
router.post('/', authorizeRoles('bhw', 'admin'), bmiController.createBMI);

module.exports = router;