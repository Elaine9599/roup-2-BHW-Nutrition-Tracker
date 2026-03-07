const { generateToken } = require('../utils/jwt');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { validatePassword } = require('../utils/passwordValidator');
const { logActivity } = require('../utils/activityLogger');

// Maximum login attempts before account lock
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60 * 1000; // 30 minutes

/**
 * Secure Login
 * - No env-based fallback
 * - Only accepts pre-created users
 * - Implements account locking after failed attempts
 * - Stores JWT in HTTP-only cookie
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user by username
    const user = await User.findOne({ username });

    // User not found
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Contact administrator.' });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(429).json({ 
        message: 'Account temporarily locked due to too many failed attempts. Try again later.' 
      });
    }

    // Verify password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // Increment login attempts
      user.loginAttempts += 1;
      
      // Lock account if max attempts exceeded
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME);
        await user.save();
        return res.status(429).json({ 
          message: 'Account locked due to too many failed login attempts. Try again in 30 minutes.' 
        });
      }
      
      await user.save();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Successful login - reset attempts and lock
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(
      { id: user._id, username: user.username, role: user.role },
      '1h' // Shorter expiry for security
    );

    // Log the login activity
    await logActivity(
      user._id,
      'LOGIN',
      'User',
      user._id.toString(),
      { ip: req.ip },
      req.ip,
      req.get('user-agent')
    );

    // Send token as HTTP-only cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'Lax',
      maxAge: 3600000 // 1 hour
    });

    // Return user info (WITHOUT password)
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
/**
 * Google OAuth Callback Handler
 * Handles successful Google authentication
 */
exports.googleCallback = async (req, res) => {
  try {
    // User is authenticated via Passport
    const user = req.user;

    // Check if account is active
    if (!user.isActive) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=account_deactivated`);
    }

    // Generate JWT token
    const token = generateToken(
      { id: user._id, username: user.username || user.email, role: user.role },
      '1h'
    );

    // Log the login activity
    await logActivity(
      user._id,
      'LOGIN',
      'User',
      user._id.toString(),
      { provider: 'google', ip: req.ip },
      req.ip,
      req.get('user-agent')
    );

    // Send token as HTTP-only cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 3600000 // 1 hour
    });

    // Redirect to frontend dashboard
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    console.error('Google callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
};

/**
 * Google OAuth Failure Handler
 */
exports.googleFailure = (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
};


/**
 * Secure Logout
 * Clears the authentication cookie
 */
exports.logout = async (req, res) => {
  try {
    // Log the logout activity
    if (req.user) {
      await logActivity(
        req.user.id,
        'LOGOUT',
        'User',
        req.user.id.toString(),
        {},
        req.ip,
        req.get('user-agent')
      );
    }

    // Clear the authentication cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict'
    });

    return res.status(200).json({ message: 'Logout successful' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Validate Password Strength
 * Used during initial user creation (setup)
 */
exports.validatePasswordStrength = (req, res) => {
  try {
    const { password } = req.body;
    const validation = validatePassword(password);

    if (validation.isValid) {
      return res.status(200).json({ 
        isValid: true, 
        message: 'Password meets security requirements' 
      });
    } else {
      return res.status(400).json({ 
        isValid: false, 
        errors: validation.errors 
      });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
