const mysql = require('mysql2/promise');

async function createTestDeliveries() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'sombango'
    });

    console.log('Connected to database successfully');

    // Get delivery user ID
    const [deliveryUsers] = await connection.execute(
      'SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = ?)',
      ['delivery']
    );

    if (deliveryUsers.length === 0) {
      console.error('No delivery users found. Please create a delivery user first.');
      return;
    }

    const deliveryUserId = deliveryUsers[0].id;
    console.log('Using delivery user ID:', deliveryUserId);

    // Get some orders that are paid and not yet delivered
    const [orders] = await connection.execute(
      'SELECT id FROM orders WHERE status = ? AND is_delivered = false LIMIT 3',
      ['paid']
    );

    if (orders.length === 0) {
      console.log('No paid orders found. Creating some test orders first...');

      // Get buyer and seller IDs
      const [buyers] = await connection.execute(
        'SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = ?) LIMIT 1',
        ['buyer']
      );

      const [sellers] = await connection.execute(
        'SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = ?) LIMIT 1',
        ['seller']
      );

      if (buyers.length === 0 || sellers.length === 0) {
        console.error('No buyers or sellers found. Please run the seed first.');
        return;
      }

      const buyerId = buyers[0].id;
      const sellerId = sellers[0].id;

      // Get shop ID for seller
      const [shops] = await connection.execute(
        'SELECT id FROM shops WHERE seller_id = ? LIMIT 1',
        [sellerId]
      );

      if (shops.length === 0) {
        console.error('No shops found for seller.');
        return;
      }

      const shopId = shops[0].id;

      // Get some products from the shop
      const [products] = await connection.execute(
        'SELECT id, name, price FROM products WHERE shop_id = ? LIMIT 3',
        [shopId]
      );

      if (products.length === 0) {
        console.log('No products found for shop, creating test products...');

        // Create test products
        const testProducts = [
          { name: 'iPhone 15', price: 500000 },
          { name: 'MacBook Pro', price: 1200000 },
          { name: 'AirPods', price: 150000 }
        ];

        for (const product of testProducts) {
          const [productResult] = await connection.execute(
            'INSERT INTO products (shop_id, name, price, stock, category) VALUES (?, ?, ?, ?, ?)',
            [shopId, product.name, product.price, 10, 'Électronique']
          );
          products.push({ id: productResult.insertId, name: product.name, price: product.price });
          console.log('Created test product:', product.name);
        }
      }

      // Create test orders
      const testOrders = [
        {
          buyer_id: buyerId,
          shop_id: shopId,
          status: 'paid',
          total: 650000, // iPhone + AirPods
          payment_method: 'mobile_money',
          shipping_address: 'Abidjan, Côte d\'Ivoire',
          delivery_code: 'DEL001',
          is_delivered: false,
          items: [
            { product_id: products[0].id, quantity: 1, price: products[0].price },
            { product_id: products[2].id, quantity: 1, price: products[2].price }
          ]
        },
        {
          buyer_id: buyerId,
          shop_id: shopId,
          status: 'paid',
          total: 1200000, // MacBook Pro
          payment_method: 'cash_on_delivery',
          shipping_address: 'Yamoussoukro, Côte d\'Ivoire',
          delivery_code: 'DEL002',
          is_delivered: false,
          items: [
            { product_id: products[1].id, quantity: 1, price: products[1].price }
          ]
        }
      ];

      for (const orderData of testOrders) {
        const [orderResult] = await connection.execute(
          'INSERT INTO orders (buyer_id, shop_id, status, total, payment_method, shipping_address, delivery_code, is_delivered) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [orderData.buyer_id, orderData.shop_id, orderData.status, orderData.total, orderData.payment_method, orderData.shipping_address, orderData.delivery_code, orderData.is_delivered]
        );
        const orderId = orderResult.insertId;
        console.log('Created test order with ID:', orderId);

        // Add order items
        for (const item of orderData.items) {
          await connection.execute(
            'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
            [orderId, item.product_id, item.quantity, item.price]
          );
        }
        console.log('Added order items for order:', orderId);
      }

      // Re-fetch orders
      const [newOrders] = await connection.execute(
        'SELECT id FROM orders WHERE status = ? AND is_delivered = false LIMIT 3',
        ['paid']
      );

      orders.push(...newOrders);
    }

    // Create deliveries for the orders
    for (let i = 0; i < Math.min(orders.length, 3); i++) {
      const orderId = orders[i].id;
      const statuses = ['assigned', 'picked_up', 'in_transit'];
      const status = statuses[i % statuses.length];

      // Check if delivery already exists
      const [existingDeliveries] = await connection.execute(
        'SELECT id FROM deliveries WHERE order_id = ?',
        [orderId]
      );

      if (existingDeliveries.length === 0) {
        const [deliveryResult] = await connection.execute(
          'INSERT INTO deliveries (order_id, delivery_person_id, status, assigned_at) VALUES (?, ?, ?, NOW())',
          [orderId, deliveryUserId, status]
        );

        console.log(`✅ Created delivery #${deliveryResult.insertId} for order #${orderId} with status: ${status}`);
      } else {
        console.log(`Delivery already exists for order #${orderId}`);
      }
    }

    console.log('✅ Test deliveries creation completed!');

  } catch (error) {
    console.error('Error creating test deliveries:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTestDeliveries();