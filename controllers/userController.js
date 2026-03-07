const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { validatePassword } = require('../utils/passwordValidator');
const { logActivity } = require('../utils/activityLogger');

/**
 * Create User (Admin Only)
 * Creates a new BHW user account
 * Only administrators can create new users
 */
const createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Validate username format
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ message: 'Username must be between 3 and 30 characters' });
    }

    // Validate username contains only alphanumeric and underscore
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: 'Password does not meet security requirements', 
        errors: passwordValidation.errors 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password with 12 salt rounds
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = new User({
      username,
      password: hashedPassword,
      role: role || 'bhw',
      isActive: true,
      createdBy: req.user.id // Set who created this user
    });

    await newUser.save();

    // Log the user creation
    await logActivity(
      req.user.id,
      'CREATE_USER',
      'User',
      newUser._id.toString(),
      { username, role: newUser.role },
      req.ip,
      req.get('user-agent')
    );

    // Return user info WITHOUT password
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get All Users (Admin Only)
 * Returns list of all users without passwords
 * Supports: search (name/email), filter by role, and pagination
 */
const getAllUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = {};

    // Add role filter if provided
    if (role && ['admin', 'bhw'].includes(role)) {
      filter.role = role;
    }

    // Add search filter (search in displayName and email)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i'); // case-insensitive
      filter.$or = [
        { displayName: searchRegex },
        { email: searchRegex },
        { username: searchRegex }
      ];
    }

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10)); // max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Fetch users
    const users = await User.find(filter)
      .select('-password')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Deactivate User (Admin Only)
 * Sets isActive to false, preventing login
 */
const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the action
    await logActivity(
      req.user.id,
      'UPDATE_USER',
      'User',
      userId,
      { action: 'deactivated' },
      req.ip,
      req.get('user-agent')
    );

    res.status(200).json({
      message: 'User deactivated successfully',
      user
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Reactivate User (Admin Only)
 * Sets isActive to true, allowing login again
 */
const reactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true, loginAttempts: 0, lockUntil: null },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the action
    await logActivity(
      req.user.id,
      'UPDATE_USER',
      'User',
      userId,
      { action: 'reactivated' },
      req.ip,
      req.get('user-agent')
    );

    res.status(200).json({
      message: 'User reactivated successfully',
      user
    });
  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Reset User Password (Admin Only)
 * Resets a user's password and login attempts
 */
const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        message: 'New password does not meet security requirements',
        errors: passwordValidation.errors
      });
    }

    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 12);
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // Log the action
    await logActivity(
      req.user.id,
      'UPDATE_USER',
      'User',
      userId,
      { action: 'password_reset' },
      req.ip,
      req.get('user-agent')
    );

    res.status(200).json({
      message: 'User password reset successfully',
      user: {
        id: user._id,
        username: user.username,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { 
  createUser,
  getAllUsers,
  deactivateUser,
  reactivateUser,
  resetUserPassword
};