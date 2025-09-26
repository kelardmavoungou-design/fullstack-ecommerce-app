const pool = require('./config/database');

async function fixPhoneNumberColumn() {
  try {
    console.log('Fixing phone_number column to allow NULL values...');

    // Alter the phone_number column to make it nullable
    await pool.query('ALTER TABLE users MODIFY COLUMN phone_number VARCHAR(20)');

    console.log('✅ phone_number column updated successfully - now allows NULL values');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating phone_number column:', error);
    process.exit(1);
  }
}

fixPhoneNumberColumn();