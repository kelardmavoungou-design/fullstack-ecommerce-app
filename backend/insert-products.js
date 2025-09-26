const mysql = require('mysql2/promise');

async function insertProducts() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sombango'
  });

  try {
    // D'abord, vérifier et insérer les rôles s'ils n'existent pas
    const [existingRoles] = await connection.execute('SELECT COUNT(*) as count FROM roles');
    if (existingRoles[0].count === 0) {
      console.log('📝 Insertion des rôles...');
      await connection.execute('INSERT INTO roles (name) VALUES (?)', ['buyer']);
      await connection.execute('INSERT INTO roles (name) VALUES (?)', ['seller']);
      await connection.execute('INSERT INTO roles (name) VALUES (?)', ['superadmin']);
      console.log('✅ Rôles insérés');
    }

    // Ensuite, vérifier s'il y a des shops
    const [shops] = await connection.execute('SELECT id FROM shops LIMIT 1');
    if (shops.length === 0) {
      console.log('❌ Aucun shop trouvé. Création d\'un shop de test...');

      // Créer un utilisateur vendeur
      const [userResult] = await connection.execute(
        'INSERT INTO users (full_name, email, phone_number, password_hash, role_id) VALUES (?, ?, ?, ?, ?)',
        ['Test Seller', 'seller@test.com', '+2250102030405', '$2b$10$hashedpassword', 2]
      );

      // Créer un shop
      const [shopResult] = await connection.execute(
        'INSERT INTO shops (seller_id, name, description) VALUES (?, ?, ?)',
        [userResult.insertId, 'Test Shop', 'Boutique de test pour les produits']
      );

      console.log('✅ Shop de test créé avec ID:', shopResult.insertId);
      var shopId = shopResult.insertId;
    } else {
      shopId = shops[0].id;
    }

    // Produits à insérer
    const products = [
      {
        name: 'iPhone 15 Pro Max',
        description: 'Le dernier iPhone avec caméra avancée et performance exceptionnelle',
        price: 1200000,
        stock: 10,
        category: 'Téléphones',
        image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop'
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Smartphone Android haut de gamme avec S Pen intégré',
        price: 950000,
        stock: 15,
        category: 'Téléphones',
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=300&h=300&fit=crop'
      },
      {
        name: 'MacBook Pro M3',
        description: 'Ordinateur portable professionnel avec puce M3',
        price: 2500000,
        stock: 5,
        category: 'Ordinateurs',
        image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300&h=300&fit=crop'
      },
      {
        name: 'Dell XPS 13',
        description: 'Ultrabook léger et puissant pour le travail quotidien',
        price: 1800000,
        stock: 8,
        category: 'Ordinateurs',
        image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300&h=300&fit=crop'
      },
      {
        name: 'Sony WH-1000XM5',
        description: 'Casques sans fil avec réduction de bruit active',
        price: 350000,
        stock: 20,
        category: 'Audio',
        image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop'
      },
      {
        name: 'AirPods Pro',
        description: 'Écouteurs sans fil avec réduction de bruit',
        price: 280000,
        stock: 25,
        category: 'Audio',
        image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c9f188?w=300&h=300&fit=crop'
      },
      {
        name: 'iPad Air',
        description: 'Tablette légère et performante pour le travail et les loisirs',
        price: 650000,
        stock: 12,
        category: 'Tablettes',
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop'
      },
      {
        name: 'Samsung Galaxy Tab S9',
        description: 'Tablette Android premium avec S Pen',
        price: 550000,
        stock: 10,
        category: 'Tablettes',
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop'
      },
      {
        name: 'Nintendo Switch OLED',
        description: 'Console de jeu hybride pour jouer partout',
        price: 320000,
        stock: 15,
        category: 'Gaming',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop'
      },
      {
        name: 'PlayStation 5',
        description: 'Console de nouvelle génération avec SSD ultra-rapide',
        price: 450000,
        stock: 8,
        category: 'Gaming',
        image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300&h=300&fit=crop'
      }
    ];

    console.log('📦 Insertion de 10 produits dans la boutique...');

    for (const product of products) {
      await connection.execute(
        'INSERT INTO products (shop_id, name, description, price, stock, category, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [shopId, product.name, product.description, product.price, product.stock, product.category, product.image]
      );
      console.log(`✅ ${product.name} ajouté`);
    }

    console.log('🎉 Tous les produits ont été insérés avec succès !');

    // Vérifier le nombre total de produits
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM products');
    console.log(`📊 Total de produits dans la base: ${countResult[0].total}`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des produits:', error);
  } finally {
    await connection.end();
  }
}

insertProducts();