const bcrypt = require('bcryptjs');
const pool = require('./config/database');

async function createAdmin() {
  try {
    const email = 'admin@sombango.com';
    const password = 'admin123';
    const full_name = 'Super Admin';
    const role_name = 'superadmin';

    // Check if admin already exists
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Get role ID
    const [roles] = await pool.query('SELECT id FROM roles WHERE name = ?', [role_name]);
    if (roles.length === 0) {
      console.log('Role superadmin not found');
      return;
    }

    const roleId = roles[0].id;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create admin user
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, phone_number, password_hash, role_id, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name, email, null, password_hash, roleId, true]
    );

    console.log(`Admin user created successfully with ID: ${result.insertId}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('Please change the password after first login!');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    process.exit();
  }
}

createAdmin();