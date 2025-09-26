require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugToken() {
  try {
    console.log('=== DEBUG TOKEN VALIDATION ===');

    // Get the latest OTP record for user 34
    const otpRecord = await prisma.otp.findFirst({
      where: {
        user_id: 34,
        type: 'registration',
        is_used: false
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (otpRecord) {
      console.log('OTP Record found:');
      console.log('- ID:', otpRecord.id);
      console.log('- User ID:', otpRecord.user_id);
      console.log('- Code (first 20 chars):', otpRecord.code.substring(0, 20) + '...');
      console.log('- Code length:', otpRecord.code.length);
      console.log('- Code (full):', otpRecord.code);
      console.log('- Type:', otpRecord.type);
      console.log('- Is Used:', otpRecord.is_used);
      console.log('- Created At:', otpRecord.created_at);
      console.log('- Expires At:', otpRecord.expires_at);
      console.log('- Is Expired:', new Date() > otpRecord.expires_at);

      // Test the exact query used in confirmEmail
      const testQuery = await prisma.otp.findFirst({
        where: {
          user_id: 34,
          code: otpRecord.code,
          type: 'registration',
          is_used: false,
          expires_at: {
            gt: new Date()
          }
        }
      });

      console.log('Test Query Result:', testQuery ? 'FOUND' : 'NOT FOUND');

      // Test with trimmed code
      const testQueryTrimmed = await prisma.otp.findFirst({
        where: {
          user_id: 34,
          code: otpRecord.code.trim(),
          type: 'registration',
          is_used: false,
          expires_at: {
            gt: new Date()
          }
        }
      });

      console.log('Test Query with trim Result:', testQueryTrimmed ? 'FOUND' : 'NOT FOUND');

    } else {
      console.log('No OTP record found for user 34');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugToken();