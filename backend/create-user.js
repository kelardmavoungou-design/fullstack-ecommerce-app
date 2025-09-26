const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createUser() {
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

    // Get buyer role ID
    const [roles] = await connection.execute(
      'SELECT id FROM roles WHERE name = ?',
      ['buyer']
    );

    if (roles.length === 0) {
      console.error('Buyer role not found');
      return;
    }

    const roleId = roles[0].id;

    // Create the user
    const [result] = await connection.execute(
      'INSERT INTO users (full_name, email, phone_number, password_hash, role_id, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
      ['Kelard Mavoungou', 'kelardmavoungou@gmail.com', '+2250102030405', hashedPassword, roleId, true]
    );

    console.log('✅ User created successfully!');
    console.log('Email: kelardmavoungou@gmail.com');
    console.log('Password: 1234');
    console.log('Role: buyer');

  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createUser();