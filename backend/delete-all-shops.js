const mysql = require('mysql2/promise');
require('dotenv').config();

async function deleteAllShops() {
  let connection;

  try {
    console.log('🗑️ Connecting to database...');

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sombago_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database');

    // Delete in correct order to handle foreign key constraints
    console.log('🗑️ Deleting related records...');

    // Delete order items first
    await connection.execute('DELETE FROM order_items');
    console.log('✅ Deleted order items');

    // Delete orders
    await connection.execute('DELETE FROM orders');
    console.log('✅ Deleted orders');

    // Delete cart items
    await connection.execute('DELETE FROM cart_items');
    console.log('✅ Deleted cart items');

    // Delete products
    await connection.execute('DELETE FROM products');
    console.log('✅ Deleted products');

    // Delete ad campaigns and related records
    await connection.execute('DELETE FROM ad_clicks');
    await connection.execute('DELETE FROM ad_impressions');
    await connection.execute('DELETE FROM ads');
    await connection.execute('DELETE FROM ad_campaigns');
    console.log('✅ Deleted ad campaigns and related records');

    // Now delete all shops
    const [result] = await connection.execute('DELETE FROM shops');
    console.log(`✅ Successfully deleted ${result.affectedRows} shops`);

    // Reset auto-increment counters
    await connection.execute('ALTER TABLE shops AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE products AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE orders AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE ad_campaigns AUTO_INCREMENT = 1');

    console.log('🔄 Auto-increment counters reset');

  } catch (error) {
    console.error('❌ Error deleting shops:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the function
deleteAllShops();