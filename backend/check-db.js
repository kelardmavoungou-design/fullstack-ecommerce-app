const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 VÉRIFICATION DE LA BASE DE DONNÉES SOMBAGO\n');

    // Vérifier les utilisateurs
    console.log('👥 UTILISATEURS:');
    const users = await prisma.users.findMany({
      select: {
        id: true,
        full_name: true,
        email: true,
        role_id: true,
        is_verified: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 10
    });

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé');
    } else {
      users.forEach(user => {
        console.log(`  🆔 ${user.id}: ${user.full_name} (${user.email}) - ${user.is_verified ? '✅ Vérifié' : '⏳ Non vérifié'} - ${user.created_at}`);
      });
    }

    // Vérifier les OTP
    console.log('\n🔑 CODES OTP:');
    const otps = await prisma.otps.findMany({
      select: {
        id: true,
        user_id: true,
        code: true,
        type: true,
        is_used: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 10
    });

    if (otps.length === 0) {
      console.log('❌ Aucun OTP trouvé');
    } else {
      otps.forEach(otp => {
        console.log(`  🔢 User ${otp.user_id}: ${otp.code} (${otp.type}) - ${otp.is_used ? '✅ Utilisé' : '⏳ Actif'} - ${otp.created_at}`);
      });
    }

    // Statistiques
    console.log('\n📊 STATISTIQUES:');
    const userCount = await prisma.users.count();
    const otpCount = await prisma.otps.count();
    const verifiedCount = await prisma.users.count({
      where: { is_verified: true }
    });

    console.log(`  👥 Total utilisateurs: ${userCount}`);
    console.log(`  🔑 Total OTP: ${otpCount}`);
    console.log(`  ✅ Utilisateurs vérifiés: ${verifiedCount}`);

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();