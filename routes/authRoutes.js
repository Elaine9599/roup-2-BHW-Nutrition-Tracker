const express = require('express');
const router = express.Router();
const { login, logout, validatePasswordStrength, googleCallback, googleFailure } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const passport = require('../config/passport');

// Rate-limited login endpoint
router.post('/login', loginLimiter, login);

// Logout endpoint (requires authentication)
router.post('/logout', authenticate, logout);

// Validate password strength endpoint
router.post('/validate-password', validatePasswordStrength);

// Google OAuth routes
router.get('/google',
	passport.authenticate('google', { 
		scope: ['profile', 'email'] 
	})
);

router.get('/google/callback',
	passport.authenticate('google', { 
		failureRedirect: '/api/auth/google/failure',
		session: false
	}),
	googleCallback
);

router.get('/google/failure', googleFailure);

module.exports = router;