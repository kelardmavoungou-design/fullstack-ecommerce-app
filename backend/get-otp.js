const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getLatestOTP(userId) {
  try {
    console.log(`🔍 Recherche de l'OTP pour l'utilisateur ID: ${userId}`);

    const otp = await prisma.otps.findFirst({
      where: {
        user_id: userId,
        type: 'registration',
        is_used: false
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (otp) {
      console.log(`✅ OTP trouvé:`);
      console.log(`   Code: ${otp.code}`);
      console.log(`   Type: ${otp.type}`);
      console.log(`   Utilisé: ${otp.is_used}`);
      console.log(`   Expiration: ${otp.expires_at}`);
      console.log(`   Créé le: ${otp.created_at}`);
      console.log(`\n🔑 Utilisez ce code pour vérifier l'OTP: ${otp.code}`);
    } else {
      console.log(`❌ Aucun OTP trouvé pour l'utilisateur ${userId}`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'OTP:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer l'ID utilisateur depuis les arguments de ligne de commande
const userId = process.argv[2];

if (!userId) {
  console.log('❌ Veuillez spécifier l\'ID utilisateur');
  console.log('Usage: node get-otp.js <userId>');
  console.log('Exemple: node get-otp.js 6');
  process.exit(1);
}

getLatestOTP(parseInt(userId));