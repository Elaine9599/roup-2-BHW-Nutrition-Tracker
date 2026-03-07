const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: function() {
      return !this.googleId; // Only required if not using Google login
    }, 
    unique: true,
    sparse: true, // Allow null values for unique index
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: { 
    type: String, 
    required: function() {
      return !this.googleId; // Only required if not using Google login
    }
    // Note: Password is hashed, never stored or returned in plaintext
  },
  // Google OAuth fields
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allow null values
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  displayName: {
    type: String
  },
  profilePicture: {
    type: String
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  role: { 
    type: String, 
    enum: ['bhw', 'admin'],
    default: 'bhw' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: { 
    type: Date 
  },
  loginAttempts: { 
    type: Number, 
    default: 0 
  },
  lockUntil: { 
    type: Date 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  }
}, { timestamps: true });

// Virtual to check if account is locked
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Index for faster lookups
UserSchema.index({ username: 1, isActive: 1 });

module.exports = mongoose.model('User', UserSchema);