const express = require('express');
const router = express.Router();
const { getMonthlyReport } = require('../controllers/monthly_reportController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// Protect report routes
router.use(authenticate);

router.get('/summary', authorizeRoles('admin', 'bhw'), getMonthlyReport);

module.exports = router;
