const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function createTestSeller() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sombango'
  });

  try {
    // Mot de passe simple pour les tests
    const plainPassword = 'seller123';

    // Hacher le mot de passe avec bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    // Insérer l'utilisateur vendeur test
    const [result] = await connection.execute(
      'INSERT INTO users (full_name, email, phone_number, password_hash, role_id) VALUES (?, ?, ?, ?, ?)',
      ['Test Seller', 'testseller@example.com', '+2250708091012', hashedPassword, 2] // role_id 2 = seller
    );

    const userId = result.insertId;
    console.log('✅ Utilisateur vendeur créé avec succès !');
    console.log('📧 Email: testseller@example.com');
    console.log('🔑 Mot de passe: seller123');
    console.log('🆔 ID utilisateur:', userId);

    // Générer un token JWT pour les tests
    const token = jwt.sign(
      { id: userId, email: 'testseller@example.com', role: 'seller' },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );

    console.log('🎫 Token JWT généré:', token);

    // Créer une boutique de test pour ce vendeur
    const [shopResult] = await connection.execute(
      'INSERT INTO shops (seller_id, name, description, is_active) VALUES (?, ?, ?, ?)',
      [userId, 'Boutique Test', 'Boutique de test pour les vendeurs', true]
    );

    console.log('🏪 Boutique créée avec ID:', shopResult.insertId);

    // Créer quelques produits de test
    const products = [
      { name: 'Smartphone Samsung', price: 250000, stock: 10, category: 'Électronique' },
      { name: 'Ordinateur Portable', price: 450000, stock: 5, category: 'Informatique' },
      { name: 'Casque Audio', price: 35000, stock: 20, category: 'Électronique' }
    ];

    for (const product of products) {
      await connection.execute(
        'INSERT INTO products (shop_id, name, description, price, stock, category, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [shopResult.insertId, product.name, `Description de ${product.name}`, product.price, product.stock, product.category]
      );
    }

    console.log('📦 3 produits de test créés');

    return { userId, token, shopId: shopResult.insertId };

  } catch (error) {
    console.error('❌ Erreur lors de la création du vendeur:', error.message);
  } finally {
    await connection.end();
  }
}

createTestSeller();