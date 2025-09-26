const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const pool = require('./database');
require('dotenv').config();

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone_number, u.avatar, u.is_verified, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [parseInt(id)]
    );

    if (users.length === 0) {
      return done(null, false);
    }

    const user = users[0];
    done(null, {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      avatar: user.avatar,
      role: user.role_name,
      is_verified: user.is_verified
    });
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`}/api/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔍 Google OAuth Profile:', {
        id: profile.id,
        displayName: profile.displayName,
        emails: profile.emails,
        photos: profile.photos
      });

      // Check if user already exists
      const [existingUsers] = await pool.query(
        'SELECT id, full_name, email, google_id, avatar FROM users WHERE email = ?',
        [profile.emails[0].value]
      );

      if (existingUsers.length > 0) {
        const user = existingUsers[0];

        // Update user with Google ID and avatar if not already set
        const updates = [];
        const values = [];

        if (!user.google_id) {
          updates.push('google_id = ?');
          values.push(profile.id);
        }

        if (!user.avatar && profile.photos && profile.photos.length > 0) {
          updates.push('avatar = ?');
          values.push(profile.photos[0].value);
        }

        if (updates.length > 0) {
          values.push(user.id);
          const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
          await pool.query(query, values);
        }

        // Get updated user data
        const [updatedUsers] = await pool.query(
          `SELECT u.id, u.full_name, u.email, u.phone_number, u.avatar, u.is_verified, r.name as role_name
           FROM users u
           JOIN roles r ON u.role_id = r.id
           WHERE u.id = ?`,
          [user.id]
        );

        return done(null, {
          id: updatedUsers[0].id,
          full_name: updatedUsers[0].full_name,
          email: updatedUsers[0].email,
          phone_number: updatedUsers[0].phone_number,
          avatar: updatedUsers[0].avatar,
          role: updatedUsers[0].role_name,
          is_verified: updatedUsers[0].is_verified
        });
      }

      // Get buyer role ID
      const [roles] = await pool.query('SELECT id FROM roles WHERE name = ?', ['buyer']);
      if (roles.length === 0) {
        return done(new Error('Default role not found'), null);
      }

      const roleId = roles[0].id;

      // Create new user
      const [userResult] = await pool.query(
        'INSERT INTO users (full_name, email, google_id, avatar, is_verified, role_id) VALUES (?, ?, ?, ?, ?, ?)',
        [
          profile.displayName,
          profile.emails[0].value,
          profile.id,
          profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
          true, // OAuth users are pre-verified
          roleId
        ]
      );

      const userId = userResult.insertId;

      // Get created user data
      const [newUsers] = await pool.query(
        `SELECT u.id, u.full_name, u.email, u.phone_number, u.avatar, u.is_verified, r.name as role_name
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.id = ?`,
        [userId]
      );

      return done(null, {
        id: newUsers[0].id,
        full_name: newUsers[0].full_name,
        email: newUsers[0].email,
        phone_number: newUsers[0].phone_number,
        avatar: newUsers[0].avatar,
        role: newUsers[0].role_name,
        is_verified: newUsers[0].is_verified
      });
    } catch (error) {
      return done(error, null);
    }
  }
));

// Facebook OAuth Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`}/api/auth/facebook/callback`,
    profileFields: ['id', 'emails', 'name']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔍 Facebook OAuth Profile:', {
        id: profile.id,
        name: profile.name,
        emails: profile.emails,
        photos: profile.photos
      });

      // Check if user already exists
      const [existingUsers] = await pool.query(
        'SELECT id, full_name, email, facebook_id, avatar FROM users WHERE email = ?',
        [profile.emails[0].value]
      );

      if (existingUsers.length > 0) {
        const user = existingUsers[0];

        // Update user with Facebook ID and avatar if not already set
        const updates = [];
        const values = [];

        if (!user.facebook_id) {
          updates.push('facebook_id = ?');
          values.push(profile.id);
        }

        if (!user.avatar && profile.photos && profile.photos.length > 0) {
          updates.push('avatar = ?');
          values.push(profile.photos[0].value);
        }

        if (updates.length > 0) {
          values.push(user.id);
          const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
          await pool.query(query, values);
        }

        // Get updated user data
        const [updatedUsers] = await pool.query(
          `SELECT u.id, u.full_name, u.email, u.phone_number, u.avatar, u.is_verified, r.name as role_name
           FROM users u
           JOIN roles r ON u.role_id = r.id
           WHERE u.id = ?`,
          [user.id]
        );

        return done(null, {
          id: updatedUsers[0].id,
          full_name: updatedUsers[0].full_name,
          email: updatedUsers[0].email,
          phone_number: updatedUsers[0].phone_number,
          avatar: updatedUsers[0].avatar,
          role: updatedUsers[0].role_name,
          is_verified: updatedUsers[0].is_verified
        });
      }

      // Get buyer role ID
      const [roles] = await pool.query('SELECT id FROM roles WHERE name = ?', ['buyer']);
      if (roles.length === 0) {
        return done(new Error('Default role not found'), null);
      }

      const roleId = roles[0].id;

      // Create new user
      const [userResult] = await pool.query(
        'INSERT INTO users (full_name, email, facebook_id, avatar, is_verified, role_id) VALUES (?, ?, ?, ?, ?, ?)',
        [
          `${profile.name.givenName} ${profile.name.familyName}`,
          profile.emails[0].value,
          profile.id,
          profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
          true, // OAuth users are pre-verified
          roleId
        ]
      );

      const userId = userResult.insertId;

      // Get created user data
      const [newUsers] = await pool.query(
        `SELECT u.id, u.full_name, u.email, u.phone_number, u.avatar, u.is_verified, r.name as role_name
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.id = ?`,
        [userId]
      );

      return done(null, {
        id: newUsers[0].id,
        full_name: newUsers[0].full_name,
        email: newUsers[0].email,
        phone_number: newUsers[0].phone_number,
        avatar: newUsers[0].avatar,
        role: newUsers[0].role_name,
        is_verified: newUsers[0].is_verified
      });
    } catch (error) {
      return done(error, null);
    }
  }
));

module.exports = passport;