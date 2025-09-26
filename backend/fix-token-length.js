const pool = require('./config/database');

async function fixTokenLength() {
  try {
    console.log('🔧 Fixing token length in database...');

    // Alter the code column to allow longer tokens
    await pool.query('ALTER TABLE otps MODIFY COLUMN code VARCHAR(100)');

    console.log('✅ Token length updated successfully - now supports up to 100 characters');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating token length:', error);
    process.exit(1);
  }
}

fixTokenLength();