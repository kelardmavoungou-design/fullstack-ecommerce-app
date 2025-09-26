const bcrypt = require('bcryptjs');
const pool = require('./config/database');

async function createAdminUser() {
  try {
    console.log('🚀 Création de l\'utilisateur administrateur...');

    const email = 'barro8453@gmail.com';
    const password = '1234';
    const fullName = 'Administrateur SOMBA';

    // Vérifier si l'utilisateur existe déjà
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      console.log('⚠️  L\'utilisateur administrateur existe déjà');
      return;
    }

    // Hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Obtenir l'ID du rôle superadmin
    const [roles] = await pool.query('SELECT id FROM roles WHERE name = ?', ['superadmin']);

    if (roles.length === 0) {
      console.log('❌ Rôle superadmin non trouvé. Veuillez initialiser la base de données d\'abord.');
      return;
    }

    const roleId = roles[0].id;

    // Créer l'utilisateur administrateur
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, phone_number, password_hash, role_id, is_verified, wallet_balance) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [fullName, email, '+2250102030405', passwordHash, roleId, true, 1000000] // 1M F CFA pour tests
    );

    const userId = result.insertId;

    console.log('✅ Utilisateur administrateur créé avec succès!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Mot de passe: ${password}`);
    console.log(`🆔 ID utilisateur: ${userId}`);
    console.log(`👤 Rôle: superadmin`);
    console.log(`💰 Solde portefeuille: 1,000,000 F CFA`);

    // Fermer la connexion
    await pool.end();
    console.log('🔌 Connexion à la base de données fermée');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur administrateur:', error);
    process.exit(1);
  }
}

// Exécuter la fonction
createAdminUser();