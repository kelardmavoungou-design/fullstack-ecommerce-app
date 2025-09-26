const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const multer = require('multer');
const path = require('path');
const {
  register,
  verifyOTP,
  confirmEmail,
  login,
  resetPassword,
  loginWithOTP,
  identifyAccount,
  sendVerificationCode,
  verifyCode,
  resetPasswordWithCode,
  secureLogin,
  getProfile,
  updateProfile,
  refreshToken,
  logout
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Configuration multer pour l'upload de photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - full_name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         full_name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         phone_number:
 *           type: string
 *           description: User's phone number (optional)
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *         role:
 *           type: string
 *           enum: [buyer, seller, superadmin]
 *           description: User's role
 *     OTP:
 *       type: object
 *       required:
 *         - userId
 *         - otp
 *         - type
 *       properties:
 *         userId:
 *           type: integer
 *           description: User ID
 *         otp:
 *           type: string
 *           description: One-time password
 *         type:
 *           type: string
 *           enum: [registration, login, recovery]
 *           description: OTP type
 *     Login:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *     PasswordReset:
 *       type: object
 *       required:
 *         - userId
 *         - otp
 *         - newPassword
 *       properties:
 *         userId:
 *           type: integer
 *           description: User ID
 *         otp:
 *           type: string
 *           description: One-time password
 *         newPassword:
 *           type: string
 *           format: password
 *           description: New password
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: User already exists
 *       500:
 *         description: Server error
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/confirm-email:
 *   get:
 *     summary: Confirm email via link
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Confirmation token
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       302:
 *         description: Redirects to login page
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.get('/confirm-email', confirmEmail);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTP'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Server error
 */
router.post('/verify-otp', verifyOTP);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', login);


/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordReset'
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Server error
 */
router.post('/reset-password', resetPassword);

/**
 * @swagger
 * /api/auth/login-with-otp:
 *   post:
 *     summary: Login with OTP (Facebook style)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - otp
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: User ID
 *               otp:
 *                 type: string
 *                 description: One-time password
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid OTP
 *       500:
 *         description: Server error
 */
router.post('/login-with-otp', loginWithOTP);

/**
 * @swagger
 * /api/auth/identify-account:
 *   post:
 *     summary: Step 1 - Identify account (Facebook Algorithm)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email, phone number, or username
 *     responses:
 *       200:
 *         description: Account found with available verification methods
 *       400:
 *         description: Invalid identifier
 *       500:
 *         description: Server error
 */
router.post('/identify-account', identifyAccount);

/**
 * @swagger
 * /api/auth/send-verification-code:
 *   post:
 *     summary: Step 2 - Send verification code (Facebook Algorithm)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - method
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: User ID
 *               method:
 *                 type: string
 *                 enum: [email, sms]
 *                 description: Verification method
 *     responses:
 *       200:
 *         description: Verification code sent
 *       400:
 *         description: Invalid method or user
 *       500:
 *         description: Server error
 */
router.post('/send-verification-code', sendVerificationCode);

/**
 * @swagger
 * /api/auth/verify-code:
 *   post:
 *     summary: Step 3 - Verify code (Facebook Algorithm)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - code
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: User ID
 *               code:
 *                 type: string
 *                 description: 6-digit verification code
 *     responses:
 *       200:
 *         description: Code verified successfully
 *       400:
 *         description: Invalid or expired code
 *       500:
 *         description: Server error
 */
router.post('/verify-code', verifyCode);

/**
 * @swagger
 * /api/auth/reset-password-with-code:
 *   post:
 *     summary: Step 4 - Reset password with code (Facebook Algorithm)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - code
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: User ID
 *               code:
 *                 type: string
 *                 description: 6-digit verification code
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Confirm new password
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid code or password
 *       500:
 *         description: Server error
 */
router.post('/reset-password-with-code', resetPasswordWithCode);

/**
 * @swagger
 * /api/auth/secure-login:
 *   post:
 *     summary: Step 5 - Secure login (Facebook Algorithm)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - code
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: User ID
 *               code:
 *                 type: string
 *                 description: 6-digit verification code
 *     responses:
 *       200:
 *         description: Secure login successful
 *       400:
 *         description: Invalid code
 *       500:
 *         description: Server error
 */
router.post('/secure-login', secureLogin);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               phone_number:
 *                 type: string
 *                 description: User's phone number
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Email or phone number already in use
 *       500:
 *         description: Server error
 */
router.put('/profile', authenticateToken, updateProfile);

/**
 * @swagger
 * /api/auth/upload-photo:
 *   post:
 *     summary: Upload profile photo
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Profile photo file
 *     responses:
 *       200:
 *         description: Photo uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 photoUrl:
 *                   type: string
 *                   description: URL of the uploaded photo
 *       400:
 *         description: Invalid file or file too large
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/upload-photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    console.log('📸 Upload photo request received');
    console.log('📸 User ID:', req.user?.id);
    console.log('📸 File:', req.file);

    if (!req.file) {
      console.log('❌ No file provided');
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    // Générer l'URL de la photo
    const photoUrl = `/uploads/avatars/${req.file.filename}`;

    console.log('📸 Photo uploaded successfully:', photoUrl);
    console.log('📸 Full URL would be:', `http://localhost:4000${photoUrl}`);

    res.json({
      photoUrl: photoUrl,
      message: 'Photo téléchargée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors du téléchargement de la photo:', error);
    res.status(500).json({ message: 'Erreur lors du téléchargement de la photo' });
  }
});

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to frontend with auth result
 */
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  (req, res) => {
    console.log('🔄 Google OAuth callback - User:', req.user);
    const jwt = require('jsonwebtoken');
    const accessToken = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    });

    const refreshToken = jwt.sign({ userId: req.user.id }, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    // Stocker le refresh token dans un cookie httpOnly
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });

    res.redirect(`${process.env.FRONTEND_URL}/login?accessToken=${accessToken}&oauth=google`);
  }
);

/**
 * @swagger
 * /api/auth/facebook:
 *   get:
 *     summary: Initiate Facebook OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to Facebook OAuth
 */
// Init Facebook OAuth
router.get('/facebook', passport.authenticate('facebook', { scope: ['public_profile', 'email'] }));

// Callback Facebook
router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  (req, res) => {
    console.log('🔄 Facebook OAuth callback - User:', req.user);
    const jwt = require('jsonwebtoken');

    const accessToken = jwt.sign({
      userId: req.user.id,
      full_name: req.user.full_name,
      email: req.user.email,
      avatar: req.user.avatar
    }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });

    const refreshToken = jwt.sign({ userId: req.user.id }, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    // Stocker le refresh token dans un cookie httpOnly
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });

    // Redirection vers le frontend avec le JWT et les infos utilisateur
    res.redirect(`${process.env.FRONTEND_URL}/login?accessToken=${accessToken}&oauth=facebook`);
  }
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: New access token generated
 *       401:
 *         description: Invalid refresh token
 *       500:
 *         description: Server error
 */
router.post('/refresh', refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Successfully logged out
 *       500:
 *         description: Server error
 */
router.post('/logout', logout);

module.exports = router;