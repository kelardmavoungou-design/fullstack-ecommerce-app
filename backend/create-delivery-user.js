const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createDeliveryUser() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'sombango'
    });

    console.log('Connected to database successfully');

    // Hash the password
    const hashedPassword = await bcrypt.hash('1234', 10);

    // Get delivery role ID
    const [roles] = await connection.execute(
      'SELECT id FROM roles WHERE name = ?',
      ['delivery']
    );

    if (roles.length === 0) {
      console.error('Delivery role not found');
      return;
    }

    const roleId = roles[0].id;

    // Create the delivery user
    const [result] = await connection.execute(
      'INSERT INTO users (full_name, email, phone_number, password_hash, role_id, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
      ['Marie Livreur', 'marie@livreur.com', '+2250708091012', hashedPassword, roleId, true]
    );

    console.log('✅ Delivery user created successfully!');
    console.log('Email: jean@livreur.com');
    console.log('Password: 1234');
    console.log('Role: delivery');

  } catch (error) {
    console.error('Error creating delivery user:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createDeliveryUser();