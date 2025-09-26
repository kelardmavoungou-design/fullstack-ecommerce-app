const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Utilisateurs dans la base de données :');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      full_name: true,
      email: true,
      is_verified: true,
      created_at: true
    }
  });

  users.forEach(user => {
    console.log(`- ID: ${user.id}, Nom: ${user.full_name}, Email: ${user.email}, Vérifié: ${user.is_verified}, Créé: ${user.created_at}`);
  });

  console.log(`\nTotal: ${users.length} utilisateurs`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });