const pool = require('./config/database');

async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    // Insert default roles if they don't exist
    const roles = [
      { name: 'buyer' },
      { name: 'seller' },
      { name: 'superadmin' }
    ];

    for (const role of roles) {
      const [existingRoles] = await pool.query(
        'SELECT * FROM roles WHERE name = ?',
        [role.name]
      );

      if (existingRoles.length === 0) {
        await pool.query(
          'INSERT INTO roles (name) VALUES (?)',
          [role.name]
        );
        console.log(`Role '${role.name}' created successfully`);
      } else {
        console.log(`Role '${role.name}' already exists`);
      }
    }

    // Create a default superadmin if none exists
    const [superAdmins] = await pool.query(`
      SELECT u.* FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'superadmin'
    `);

    if (superAdmins.length === 0) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('admin123', salt);

      // Get superadmin role ID
      const [roles] = await pool.query(
        'SELECT id FROM roles WHERE name = ?',
        ['superadmin']
      );
      const roleId = roles[0].id;

      // Create superadmin user
      await pool.query(
        'INSERT INTO users (full_name, email, phone_number, password_hash, role_id, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
        ['Super Admin', 'admin@sombango.com', '1234567890', password_hash, roleId, true]
      );

      console.log('Default superadmin created successfully');
      console.log('Email: admin@sombango.com');
      console.log('Password: admin123');
    } else {
      console.log('Superadmin already exists');
    }

    console.log('Database initialization completed');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();