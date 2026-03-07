const express = require('express');
const router = express.Router();
const { 
  createUser, 
  getAllUsers, 
  deactivateUser, 
  reactivateUser,
  resetUserPassword
} = require('../controllers/userController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authenticate, authorizeRoles('admin'));

// Create new user (admin only)
router.post('/', createUser);

// Get all users (admin only)
router.get('/', getAllUsers);

// Deactivate user (admin only)
router.patch('/:userId/deactivate', deactivateUser);

// Reactivate user (admin only)
router.patch('/:userId/reactivate', reactivateUser);

// Reset user password (admin only)
router.post('/:userId/reset-password', resetUserPassword);

module.exports = router;