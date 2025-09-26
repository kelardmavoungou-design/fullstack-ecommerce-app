const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Middleware pour vérifier le jeton JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // console.log('--- AUTH DEBUG ---');
  // console.log('Authorization header:', authHeader);
  // console.log('Extracted token:', token);

  if (!token) {
    console.warn('Aucun token reçu');
    return res.status(401).json({ message: "Jeton d'accès requis" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log('Token décodé:', decoded);

    // Obtenir l'utilisateur depuis la base de données
    const [users] = await pool.query(`
      SELECT u.*, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [decoded.userId]);

    if (users.length === 0) {
      console.warn('Aucun utilisateur trouvé pour ce token');
      return res.status(401).json({ message: 'Jeton invalide' });
    }

    const user = users[0];
    // console.log('Utilisateur trouvé:', user);

    // Formater l'utilisateur pour maintenir la compatibilité
    req.user = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role_name,
      role_id: user.role_id,
      is_verified: user.is_verified,
      avatar: user.avatar,
      google_id: user.google_id,
      facebook_id: user.facebook_id
    };

    // console.log('req.user injecté dans la requête:', req.user);
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return res.status(403).json({ message: 'Jeton invalide ou expiré' });
  }
};

// Middleware pour vérifier si l'utilisateur est un acheteur
const isBuyer = (req, res, next) => {
  // Permettre l'accès au panier pour tous les rôles authentifiés
  // Les vendeurs et admins peuvent aussi avoir un panier
  if (!req.user || !req.user.role) {
    return res.status(403).json({ message: 'Accès refusé. Utilisateur non authentifié.' });
  }
  next();
};

// Middleware pour vérifier si l'utilisateur est un vendeur
const isSeller = (req, res, next) => {
  if (req.user.role !== 'seller') {
    return res.status(403).json({ message: 'Accès refusé. Rôle de vendeur requis.' });
  }
  next();
};

// Middleware pour vérifier si l'utilisateur est un superadministrateur
const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Accès refusé. Rôle de SuperAdmin requis.' });
  }
  next();
};

// Middleware pour vérifier si l'utilisateur est soit un vendeur soit un superadministrateur
const isSellerOrSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'seller' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Accès refusé. Rôle de vendeur ou de SuperAdmin requis.' });
  }
  next();
};

module.exports = {
  authenticateToken,
  isBuyer,
  isSeller,
  isSuperAdmin,
  isSellerOrSuperAdmin
};