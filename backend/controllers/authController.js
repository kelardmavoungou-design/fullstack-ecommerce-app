const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const pool = require('../config/database');
const validator = require('validator');
const { sendOTPEmail, sendOTPSMS, sendEmailConfirmation, sendPasswordResetEmail } = require('../services/notificationService');

// Fonction utilitaire pour générer un jeton JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  });
};

// Fonction utilitaire pour générer un refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Inscrire un nouvel utilisateur
const register = async (req, res) => {
  try {
    const { full_name, email, phone_number, password, role } = req.body;

    // Valider les entrées
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    // Normaliser l'email en minuscules pour éviter les problèmes de casse
    const normalizedEmail = email.toLowerCase().trim();

    // Validate role - frontend now sends correct role names directly
    const validRoles = ['buyer', 'seller', 'superadmin', 'delivery'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Veuillez sélectionner un type de compte (buyer, seller, superadmin ou delivery)' });
    }

    const backendRole = role;

    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Format d\'email invalide' });
    }

    // Vérifier si l'utilisateur existe déjà (email)
    const [existingUsers] = await pool.query(
      'SELECT id, is_verified FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      // Si l'utilisateur existe mais n'est pas vérifié, supprimer l'ancien utilisateur pour permettre la réinscription
      if (!existingUser.is_verified) {
        // Supprimer les OTP associés
        await pool.query('DELETE FROM otps WHERE user_id = ?', [existingUser.id]);
        // Supprimer l'utilisateur non vérifié
        await pool.query('DELETE FROM users WHERE id = ?', [existingUser.id]);
        console.log(`Utilisateur non vérifié supprimé: ${normalizedEmail}`);
      } else {
        return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà' });
      }
    }

    // Note: Numéro de téléphone peut être partagé entre plusieurs utilisateurs
    // Aucune vérification d'unicité pour les numéros de téléphone

    // Hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Obtenir l'ID du rôle
    const [roles] = await pool.query('SELECT id FROM roles WHERE name = ?', [backendRole]);

    if (roles.length === 0) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }

    const roleId = roles[0].id;

    // Créer l'utilisateur
    const [userResult] = await pool.query(
      'INSERT INTO users (full_name, email, phone_number, password_hash, role_id) VALUES (?, ?, ?, ?, ?)',
      [full_name, normalizedEmail, phone_number || null, password_hash, roleId]
    );

    const userId = userResult.insertId;

    // Générer un token de confirmation unique
    const confirmationToken = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    console.log(`🔗 Token de confirmation généré pour ${normalizedEmail}: ${confirmationToken}`); // Log pour les tests

    // Sauvegarder le token de confirmation
    await pool.query(
      'INSERT INTO otps (user_id, code, type, expires_at) VALUES (?, ?, ?, ?)',
      [userId, confirmationToken, 'registration', expiresAt]
    );

    // Envoyer l'email de confirmation
    const emailResult = await sendEmailConfirmation(email, confirmationToken, userId);

    res.status(201).json({
      message: 'Utilisateur inscrit avec succès. Veuillez vérifier votre email pour confirmer votre compte.',
      userId: userId,
      emailSent: emailResult.success,
      requiresEmailConfirmation: true
    });
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Vérifier l'OTP
const verifyOTP = async (req, res) => {
  try {
    const { userId, otp, type } = req.body;

    if (!userId || !otp || !type) {
      return res.status(400).json({ message: 'L\'ID utilisateur, l\'OTP et le type sont requis' });
    }

    // Pour l'inscription simplifiée, accepter l'OTP automatique
    if (type === 'registration' && otp === '123456') {
      // Marquer l'utilisateur comme vérifié directement
      await pool.query('UPDATE users SET is_verified = true WHERE id = ?', [parseInt(userId)]);

      // Obtenir les données de l'utilisateur
      const [users] = await pool.query(
        `SELECT u.id, u.full_name, u.email, u.phone_number, u.is_verified, r.name as role_name
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.id = ?`,
        [parseInt(userId)]
      );

      if (users.length === 0) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      const user = users[0];

      // Générer les jetons JWT
      const accessToken = generateToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // Stocker le refresh token dans un cookie httpOnly
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
      });

      return res.status(200).json({
        message: 'Email confirmé avec succès',
        accessToken,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number,
          role: user.role_name,
          is_verified: user.is_verified
        }
      });
    }

    // Vérifier si l'OTP est valide pour les autres types
    const [otpRecords] = await pool.query(
      'SELECT id FROM otps WHERE user_id = ? AND code = ? AND type = ? AND is_used = false AND expires_at > NOW()',
      [parseInt(userId), otp, type]
    );

    if (otpRecords.length === 0) {
      return res.status(400).json({ message: 'OTP invalide ou expiré' });
    }

    const otpRecord = otpRecords[0];

    // Marquer l'OTP comme utilisé
    await pool.query('UPDATE otps SET is_used = true WHERE id = ?', [otpRecord.id]);

    // Si c'est un OTP d'inscription, marquer l'utilisateur comme vérifié
    if (type === 'registration') {
      await pool.query('UPDATE users SET is_verified = true WHERE id = ?', [parseInt(userId)]);
    }

    // Obtenir les données de l'utilisateur
    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone_number, u.is_verified, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [parseInt(userId)]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const user = users[0];

    // Générer les jetons JWT
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Stocker le refresh token dans un cookie httpOnly
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });

    res.status(200).json({
      message: 'OTP vérifié avec succès',
      accessToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role_name,
        is_verified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Erreur de vérification OTP:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Connexion
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'L\'email et le mot de passe sont requis' });
    }

    // Normaliser l'email en minuscules
    const normalizedEmail = email.toLowerCase().trim();

    // Trouver l'utilisateur avec son rôle
    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone_number, u.password_hash, u.is_verified, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`,
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const user = users[0];

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    // Générer les jetons JWT
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Stocker le refresh token dans un cookie httpOnly
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });

    res.status(200).json({
      message: 'Connexion réussie',
      accessToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role_name,
        is_verified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Étape 1 : Identification du compte (Facebook Algorithm)
const identifyAccount = async (req, res) => {
  try {
    const { identifier } = req.body; // Peut être email, téléphone, ou nom d'utilisateur

    console.log('🔍 [IDENTIFY ACCOUNT] Received identifier:', identifier);

    if (!identifier) {
      console.log('❌ [IDENTIFY ACCOUNT] No identifier provided');
      return res.status(400).json({ message: 'Veuillez saisir votre email, numéro de téléphone ou nom d\'utilisateur' });
    }

    // Normaliser l'identifier
    const normalizedIdentifier = identifier.toLowerCase().trim();
    console.log('🔄 [IDENTIFY ACCOUNT] Normalized identifier:', normalizedIdentifier);

    // Vérifier si c'est un email
    const isEmail = validator.isEmail(normalizedIdentifier);
    console.log('📧 [IDENTIFY ACCOUNT] Is email:', isEmail);

    let user = null;
    let identifierType = '';

    if (isEmail) {
      // Recherche par email
      console.log('🔍 [IDENTIFY ACCOUNT] Searching by email...');
      const [users] = await pool.query(
        'SELECT id, full_name, email, phone_number, is_verified FROM users WHERE email = ?',
        [normalizedIdentifier]
      );
      console.log('📊 [IDENTIFY ACCOUNT] Email query result:', users.length, 'users found');
      if (users.length > 0) {
        console.log('👤 [IDENTIFY ACCOUNT] User found:', { id: users[0].id, email: users[0].email, is_verified: users[0].is_verified });
        if (users[0].is_verified) {
          user = users[0];
          identifierType = 'email';
        } else {
          console.log('❌ [IDENTIFY ACCOUNT] User found but not verified');
        }
      } else {
        console.log('❌ [IDENTIFY ACCOUNT] No user found with this email');
      }
    } else {
      // Recherche par numéro de téléphone ou nom d'utilisateur
      console.log('🔍 [IDENTIFY ACCOUNT] Searching by phone or name...');
      const [users] = await pool.query(
        'SELECT id, full_name, email, phone_number, is_verified FROM users WHERE (phone_number = ? OR full_name = ?) AND is_verified = true',
        [normalizedIdentifier, normalizedIdentifier]
      );
      console.log('📊 [IDENTIFY ACCOUNT] Phone/name query result:', users.length, 'users found');
      if (users.length > 0) {
        user = users[0];
        identifierType = user.phone_number === normalizedIdentifier ? 'phone' : 'username';
        console.log('👤 [IDENTIFY ACCOUNT] User found:', { id: user.id, identifierType, is_verified: user.is_verified });
      } else {
        console.log('❌ [IDENTIFY ACCOUNT] No user found with this phone/name');
      }
    }

    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'identifiant existe ou non
      console.log('🚫 [IDENTIFY ACCOUNT] No valid user found, returning generic message');
      return res.status(200).json({
        message: 'Si cet identifiant est associé à un compte, vous recevrez les instructions.',
        found: false
      });
    }

    // Retourner les méthodes de vérification disponibles
    console.log('✅ [IDENTIFY ACCOUNT] User found, preparing available methods');
    const availableMethods = [];

    if (user.email) {
      console.log('📧 [IDENTIFY ACCOUNT] Email method available');
      availableMethods.push({
        type: 'email',
        value: user.email,
        masked: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      });
    } else {
      console.log('❌ [IDENTIFY ACCOUNT] No email available');
    }

    if (user.phone_number) {
      console.log('📱 [IDENTIFY ACCOUNT] SMS method available');
      availableMethods.push({
        type: 'sms',
        value: user.phone_number,
        masked: user.phone_number.replace(/(.{2})(.*)(.{2})/, '$1***$3')
      });
    } else {
      console.log('❌ [IDENTIFY ACCOUNT] No phone number available');
    }

    console.log('📋 [IDENTIFY ACCOUNT] Available methods:', availableMethods.length);
    console.log('🎯 [IDENTIFY ACCOUNT] Returning success response');

    res.status(200).json({
      message: 'Compte trouvé. Choisissez une méthode de vérification.',
      found: true,
      userId: user.id,
      userName: user.full_name,
      availableMethods: availableMethods
    });

  } catch (error) {
    console.error('❌ [IDENTIFY ACCOUNT] Error during account identification:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Étape 2 : Envoi du code de vérification (Facebook Algorithm)
const sendVerificationCode = async (req, res) => {
  try {
    const { userId, method } = req.body;

    if (!userId || !method) {
      return res.status(400).json({ message: 'ID utilisateur et méthode requis' });
    }

    // Récupérer les informations de l'utilisateur
    const [users] = await pool.query(
      'SELECT id, full_name, email, phone_number FROM users WHERE id = ? AND is_verified = true',
      [parseInt(userId)]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const user = users[0];

    // Générer un OTP à 6 chiffres
    const otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      upperCase: false,
      specialChars: false
    });

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    console.log(`🔢 Code de vérification généré pour ${user.full_name}: ${otp}`);

    // Sauvegarder l'OTP
    await pool.query(
      'INSERT INTO otps (user_id, code, type, expires_at) VALUES (?, ?, ?, ?)',
      [user.id, otp, 'recovery', expiresAt]
    );

    let sendResult = { success: false };

    // Envoyer le code selon la méthode choisie
    if (method === 'email' && user.email) {
      sendResult = await sendOTPEmail(user.email, otp, 'recovery');
      console.log(`📧 Code envoyé par email à ${user.email}: ${sendResult.success ? 'SUCCÈS' : 'ÉCHEC'}`);
    } else if (method === 'sms' && user.phone_number) {
      sendResult = await sendOTPSMS(user.phone_number, otp, 'recovery');
      console.log(`📱 Code envoyé par SMS à ${user.phone_number}: ${sendResult.success ? 'SUCCÈS' : 'ÉCHEC'}`);
    } else {
      return res.status(400).json({ message: 'Méthode de vérification non disponible' });
    }

    res.status(200).json({
      message: `Code envoyé par ${method === 'email' ? 'email' : 'SMS'}`,
      sent: sendResult.success,
      method: method,
      expiresIn: 15 // minutes
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi du code:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Étape 3 : Vérification du code (Facebook Algorithm)
const verifyCode = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ message: 'ID utilisateur et code requis' });
    }

    // Vérifier si l'OTP est valide
    const [otpRecords] = await pool.query(
      'SELECT id, user_id FROM otps WHERE user_id = ? AND code = ? AND type = ? AND is_used = false AND expires_at > NOW()',
      [parseInt(userId), code, 'recovery']
    );

    if (otpRecords.length === 0) {
      return res.status(400).json({
        message: 'Code invalide ou expiré',
        valid: false
      });
    }

    const otpRecord = otpRecords[0];

    // Récupérer les informations de l'utilisateur
    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone_number, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [otpRecord.user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const user = users[0];

    res.status(200).json({
      message: 'Code vérifié avec succès',
      valid: true,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role_name
      },
      canProceed: true
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du code:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Étape 4 : Réinitialisation du mot de passe (Facebook Algorithm)
const resetPasswordWithCode = async (req, res) => {
  try {
    const { userId, code, newPassword, confirmPassword } = req.body;

    if (!userId || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
    }

    // Valider la force du mot de passe
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    // Vérifier si l'OTP est valide
    const [otpRecords] = await pool.query(
      'SELECT id, user_id FROM otps WHERE user_id = ? AND code = ? AND type = ? AND is_used = false AND expires_at > NOW()',
      [parseInt(userId), code, 'recovery']
    );

    if (otpRecords.length === 0) {
      return res.status(400).json({ message: 'Code invalide ou expiré' });
    }

    const otpRecord = otpRecords[0];

    // Hacher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Mettre à jour le mot de passe
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, otpRecord.user_id]
    );

    // Marquer l'OTP comme utilisé
    await pool.query('UPDATE otps SET is_used = true WHERE id = ?', [otpRecord.id]);

    console.log(`🔐 Mot de passe réinitialisé pour l'utilisateur ID: ${otpRecord.user_id}`);

    res.status(200).json({
      message: 'Mot de passe réinitialisé avec succès',
      passwordReset: true
    });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Étape 5 : Connexion sécurisée (Facebook Algorithm)
const secureLogin = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ message: 'ID utilisateur et code requis' });
    }

    // Vérifier si l'OTP est valide
    const [otpRecords] = await pool.query(
      'SELECT id, user_id FROM otps WHERE user_id = ? AND code = ? AND type = ? AND is_used = false AND expires_at > NOW()',
      [parseInt(userId), code, 'recovery']
    );

    if (otpRecords.length === 0) {
      return res.status(400).json({ message: 'Code invalide ou expiré' });
    }

    const otpRecord = otpRecords[0];

    // Marquer l'OTP comme utilisé
    await pool.query('UPDATE otps SET is_used = true WHERE id = ?', [otpRecord.id]);

    // Récupérer les informations de l'utilisateur
    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone_number, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [otpRecord.user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const user = users[0];

    // Générer les jetons JWT
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Stocker le refresh token dans un cookie httpOnly
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });

    console.log(`🔑 Connexion sécurisée réussie pour l'utilisateur: ${user.email}`);

    res.status(200).json({
      message: 'Connexion réussie',
      accessToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role_name
      },
      security: {
        recommendLogout: true,
        recommendReview: true
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion sécurisée:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Se connecter avec OTP (style Facebook)
const loginWithOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: 'L\'ID utilisateur et l\'OTP sont requis' });
    }

    // Vérifier si l'OTP est valide
    const [otpRecords] = await pool.query(
      'SELECT id, user_id FROM otps WHERE user_id = ? AND code = ? AND type = ? AND is_used = false AND expires_at > NOW()',
      [parseInt(userId), otp, 'recovery']
    );

    if (otpRecords.length === 0) {
      return res.status(400).json({ message: 'OTP invalide ou expiré' });
    }

    const otpRecord = otpRecords[0];

    // Marquer l'OTP comme utilisé
    await pool.query('UPDATE otps SET is_used = true WHERE id = ?', [otpRecord.id]);

    // Obtenir les données de l'utilisateur
    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone_number, u.is_verified, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [otpRecord.user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const user = users[0];

    // Générer les jetons JWT
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Stocker le refresh token dans un cookie httpOnly
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });

    console.log(`🔑 Connexion OTP réussie pour l'utilisateur: ${user.email}`);

    res.status(200).json({
      message: 'Connexion réussie avec OTP',
      accessToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role_name,
        is_verified: user.is_verified
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion avec OTP:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Réinitialiser le mot de passe (avec OTP)
const resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;

    if (!userId || !otp || !newPassword) {
      return res.status(400).json({ message: 'L\'ID utilisateur, l\'OTP et le nouveau mot de passe sont requis' });
    }

    // Valider la force du mot de passe
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    // Vérifier si l'OTP est valide
    const [otpRecords] = await pool.query(
      'SELECT id, user_id FROM otps WHERE user_id = ? AND code = ? AND type = ? AND is_used = false AND expires_at > NOW()',
      [parseInt(userId), otp, 'recovery']
    );

    if (otpRecords.length === 0) {
      return res.status(400).json({ message: 'OTP invalide ou expiré' });
    }

    const otpRecord = otpRecords[0];

    // Hacher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Mettre à jour le mot de passe
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, otpRecord.user_id]
    );

    // Marquer l'OTP comme utilisé
    await pool.query('UPDATE otps SET is_used = true WHERE id = ?', [otpRecord.id]);

    console.log(`🔐 Mot de passe réinitialisé pour l'utilisateur ID: ${otpRecord.user_id}`);

    res.status(200).json({
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtenir les données de l'utilisateur avec son avatar
    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone_number, u.avatar, u.is_verified, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const user = users[0];

    res.status(200).json({
      user : {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      avatar: user.avatar,
      role: user.role_name,
      is_verified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, email, phone_number, avatar } = req.body;

    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const values = [];

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(full_name);
    }

    if (email !== undefined) {
      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      const [existingUsers] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email.toLowerCase().trim(), userId]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({ message: 'Cet email est déjà utilisé par un autre utilisateur' });
      }

      updates.push('email = ?');
      values.push(email.toLowerCase().trim());
    }

    if (phone_number !== undefined) {
      // Note: Numéro de téléphone peut être partagé - pas de vérification d'unicité
      updates.push('phone_number = ?');
      values.push(phone_number);
    }

    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Aucune donnée à mettre à jour' });
    }

    // Ajouter l'ID utilisateur à la fin des valeurs
    values.push(userId);

    // Exécuter la mise à jour
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await pool.query(query, values);

    // Récupérer les données mises à jour
    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone_number, u.avatar, u.is_verified, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const updatedUser = users[0];

    res.status(200).json({
      message: 'Profil mis à jour avec succès',
      user: {
        id: updatedUser.id,
        full_name: updatedUser.full_name,
        email: updatedUser.email,
        phone_number: updatedUser.phone_number,
        avatar: updatedUser.avatar,
        role: updatedUser.role_name,
        is_verified: updatedUser.is_verified
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Confirmer l'email via le lien
const confirmEmail = async (req, res) => {
  try {
    const { token, userId } = req.query;

    console.log(`🔍 Tentative de confirmation - Token: ${token}, UserId: ${userId}`);

    if (!token || !userId) {
      console.log('❌ Paramètres manquants');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=missing_params`);
    }

    // Vérifier si le token existe et n'est pas expiré
    const [otpRecords] = await pool.query(
      'SELECT id, user_id, code, type, is_used, expires_at FROM otps WHERE code = ? AND type = ? AND is_used = false AND expires_at > NOW()',
      [token, 'registration']
    );

    console.log(`🔍 Requête OTP - Trouvé ${otpRecords.length} enregistrements`);

    if (otpRecords.length === 0) {
      console.log('❌ Token non trouvé ou expiré');

      // Debug: vérifier tous les tokens pour ce userId
      const [allTokens] = await pool.query('SELECT code, type, is_used, expires_at FROM otps WHERE user_id = ?', [parseInt(userId)]);
      console.log('🔍 Tous les tokens pour cet utilisateur:', allTokens);

      return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_token`);
    }

    const otpRecord = otpRecords[0];
    console.log(`✅ Token trouvé - ID: ${otpRecord.id}, User: ${otpRecord.user_id}`);

    // Vérifier que le userId correspond
    if (parseInt(userId) !== otpRecord.user_id) {
      console.log(`❌ UserId mismatch - Reçu: ${userId}, Attendu: ${otpRecord.user_id}`);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=user_mismatch`);
    }

    // Marquer l'utilisateur comme vérifié
    await pool.query('UPDATE users SET is_verified = true WHERE id = ?', [parseInt(userId)]);

    // Marquer le token comme utilisé
    await pool.query('UPDATE otps SET is_used = true WHERE id = ?', [otpRecord.id]);

    console.log(`✅ Email confirmé pour l'utilisateur ID: ${userId}`);

    // Rediriger vers la page de connexion avec un message de succès
    res.redirect(`${process.env.FRONTEND_URL}/login?email_confirmed=true`);

  } catch (error) {
    console.error('Erreur de confirmation d\'email:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

// Refresh token endpoint
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token manquant' });
    }

    // Vérifier le refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET);

    // Vérifier que l'utilisateur existe toujours
    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone_number, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    const user = users[0];

    // Générer un nouveau access token
    const newAccessToken = generateToken(user.id);

    res.json({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role_name
      }
    });
  } catch (error) {
    console.error('Erreur lors du refresh du token:', error);
    return res.status(401).json({ message: 'Refresh token invalide' });
  }
};

// Logout - clear refresh token
const logout = async (req, res) => {
  try {
    // Effacer le refresh token du cookie
    res.clearCookie('refreshToken');
    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

module.exports = {
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
};