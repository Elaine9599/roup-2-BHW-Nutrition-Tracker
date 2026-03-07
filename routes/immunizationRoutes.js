const express = require('express');
const router = express.Router();
const { addImmunization, getResidentHistory } = require('../controllers/immunizationController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// Protect immunization routes
router.use(authenticate);

router.post('/', authorizeRoles('admin', 'bhw'), addImmunization);
router.get('/:residentId', getResidentHistory);

module.exports = router;
