const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addImagesToBartone() {
  try {
    console.log('🔄 Ajout d\'images à bartone...');

    // Images de démonstration (vous pouvez remplacer par vos vraies images)
    const images = [
      'shop_1758102645576_2wk4n7dfd.png', // Image existante
      'shop_1758101939581_gk5jebtv9.png', // Une autre image existante
      'shop_1758006633565_d9d1ae8a6.png'  // Une troisième image
    ];

    const result = await prisma.product.update({
      where: { id: 17 }, // ID de bartone
      data: {
        images: JSON.stringify(images)
      }
    });

    console.log('✅ Images ajoutées à bartone:', result);
    console.log('📸 Images:', images);

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addImagesToBartone();