const mysql = require('mysql2/promise');

async function addKelardProducts() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'sombango'
    });

    console.log('Connected to database');

    // Get user ID for kelardmavoungou@gmail.com
    const [users] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['kelardmavoungou@gmail.com']
    );

    if (users.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const userId = users[0].id;
    console.log('✅ Found user ID:', userId);

    // Check if shop exists, if not create it
    let [shops] = await connection.execute(
      'SELECT id FROM shops WHERE seller_id = ?',
      [userId]
    );

    let shopId;
    if (shops.length === 0) {
      console.log('📝 Shop not found, creating one...');
      const [shopResult] = await connection.execute(
        'INSERT INTO shops (seller_id, name, description, logo, is_active) VALUES (?, ?, ?, ?, ?)',
        [userId, 'Boutique Kelard', 'Boutique de Kelard Mavoungou - Produits de qualité', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=150&fit=crop', true]
      );
      shopId = shopResult.insertId;
      console.log('✅ Shop created with ID:', shopId);
    } else {
      shopId = shops[0].id;
      console.log('✅ Found existing shop ID:', shopId);
    }

    // Check existing products in this shop
    const [existingProducts] = await connection.execute(
      'SELECT COUNT(*) as count FROM products WHERE shop_id = ?',
      [shopId]
    );

    console.log('📊 Existing products in shop:', existingProducts[0].count);

    // Add products to Kelard's shop
    const products = [
      {
        name: 'Ordinateur Portable Gaming Kelard',
        description: 'PC portable haute performance pour gamers - Édition Kelard',
        price: 450000,
        stock: 5,
        category: 'Électronique',
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop'
      },
      {
        name: 'Smartphone Premium Kelard',
        description: 'Téléphone dernier cri avec caméra professionnelle - Édition Kelard',
        price: 350000,
        stock: 8,
        category: 'Électronique',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop'
      },
      {
        name: 'Console Gaming Kelard',
        description: 'Console de nouvelle génération pour gaming ultime - Édition Kelard',
        price: 280000,
        stock: 3,
        category: 'Gaming',
        image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300&h=300&fit=crop'
      }
    ];

    for (const product of products) {
      try {
        const [result] = await connection.execute(
          'INSERT INTO products (shop_id, name, description, price, stock, category, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [shopId, product.name, product.description, product.price, product.stock, product.category, product.image]
        );
        console.log('✅ Added product:', product.name, '- ID:', result.insertId);
      } catch (error) {
        console.log('❌ Error adding product:', product.name, error.message);
      }
    }

    // Verify final count
    const [finalCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM products WHERE shop_id = ?',
      [shopId]
    );

    console.log('📊 Final product count for Kelard shop:', finalCount[0].count);

    // Show all products from Kelard's shop
    const [kelardProducts] = await connection.execute(
      'SELECT p.id, p.name, p.price, s.name as shop_name FROM products p JOIN shops s ON p.shop_id = s.id WHERE s.name = ?',
      ['Boutique Kelard']
    );

    console.log('🛍️ Products in Boutique Kelard:');
    kelardProducts.forEach(product => {
      console.log(`  - ${product.name} (${product.price} F CFA)`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addKelardProducts();