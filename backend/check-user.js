const mysql = require('mysql2/promise');

async function checkUsers() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'sombango'
    });

    console.log('Connected to database successfully');

    const [rows] = await connection.execute('SELECT id, email, full_name FROM users');
    console.log('\n=== Current users in database ===');
    rows.forEach(user => {
      console.log(`${user.id}: ${user.email} - ${user.full_name}`);
    });

    const [kelardUser] = await connection.execute(
      'SELECT id, email, full_name, password_hash FROM users WHERE email = ?',
      ['kelardmavoungou@gmail.com']
    );

    if (kelardUser.length > 0) {
      console.log('\n=== User kelardmavoungou@gmail.com found ===');
      console.log(kelardUser[0]);
    } else {
      console.log('\n=== User kelardmavoungou@gmail.com NOT found ===');
      console.log('Available test accounts:');
      console.log('- buyer@test.com / buyer123');
      console.log('- seller@test.com / seller123');
      console.log('- admin@sombango.com / admin123');
    }

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUsers();