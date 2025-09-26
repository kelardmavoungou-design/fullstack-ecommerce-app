const bcrypt = require('bcryptjs');
const pool = require('./config/database');

async function createTestUser() {
  try {
    console.log('🚀 Création d\'un utilisateur de test...');

    const email = 'test@example.com';
    const password = 'test123';
    const fullName = 'Test User';

    // Vérifier si l'utilisateur existe déjà
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      console.log('⚠️  L\'utilisateur de test existe déjà');
      return;
    }

    // Hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Obtenir l'ID du rôle buyer
    const [roles] = await pool.query('SELECT id FROM roles WHERE name = ?', ['buyer']);

    if (roles.length === 0) {
      console.log('❌ Rôle buyer non trouvé. Veuillez initialiser la base de données d\'abord.');
      return;
    }

    const roleId = roles[0].id;

    // Créer l'utilisateur de test
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, phone_number, password_hash, role_id, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
      [fullName, email, '+2250102030405', passwordHash, roleId, true]
    );

    const userId = result.insertId;

    console.log('✅ Utilisateur de test créé avec succès!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Mot de passe: ${password}`);
    console.log(`🆔 ID utilisateur: ${userId}`);
    console.log(`👤 Rôle: buyer`);
    console.log(`✅ Vérifié: oui`);

    // Fermer la connexion
    await pool.end();
    console.log('🔌 Connexion à la base de données fermée');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur de test:', error);
    process.exit(1);
  }
}

// Exécuter la fonction
createTestUser();