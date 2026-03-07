const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const allowedGoogleEmails = (process.env.ALLOWED_GOOGLE_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleEmail = profile.emails?.[0]?.value?.trim().toLowerCase();

        if (!googleEmail) {
          return done(null, false);
        }

        if (allowedGoogleEmails.length > 0 && !allowedGoogleEmails.includes(googleEmail)) {
          return done(null, false);
        }

        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, update last login
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        // Check if user exists with this email (from local auth)
        user = await User.findOne({ email: googleEmail });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.displayName = profile.displayName;
          user.profilePicture = profile.photos[0]?.value;
          user.authProvider = 'google';
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        // Create new user
        const newUser = new User({
          googleId: profile.id,
          email: googleEmail,
          displayName: profile.displayName,
          username: googleEmail.split('@')[0], // Use email prefix as username
          profilePicture: profile.photos[0]?.value,
          authProvider: 'google',
          isActive: true,
          role: 'bhw', // Default role
          lastLogin: new Date()
        });

        await newUser.save();
        done(null, newUser);
      } catch (err) {
        console.error('Google OAuth error:', err);
        done(err, null);
      }
    }
  )
);

module.exports = passport;
