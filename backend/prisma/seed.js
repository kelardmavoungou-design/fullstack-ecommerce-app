const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create roles
  const buyerRole = await prisma.role.upsert({
    where: { name: 'buyer' },
    update: {},
    create: { name: 'buyer' },
  });

  const sellerRole = await prisma.role.upsert({
    where: { name: 'seller' },
    update: {},
    create: { name: 'seller' },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'superadmin' },
    update: {},
    create: { name: 'superadmin' },
  });

  const deliveryRole = await prisma.role.upsert({
    where: { name: 'delivery' },
    update: {},
    create: { name: 'delivery' },
  });

  console.log('Roles created');

  // Hash passwords
  const buyerPassword = await bcrypt.hash('buyer123', 10);
  const sellerPassword = await bcrypt.hash('seller123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // Create test users
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@test.com' },
    update: {},
    create: {
      full_name: 'Test Buyer',
      email: 'buyer@test.com',
      phone_number: '+2250102030405',
      password_hash: buyerPassword,
      role_id: buyerRole.id,
      is_verified: true,
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: 'seller@test.com' },
    update: {},
    create: {
      full_name: 'Test Seller',
      email: 'seller@test.com',
      phone_number: '+2250607080910',
      password_hash: sellerPassword,
      role_id: sellerRole.id,
      is_verified: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sombango.com' },
    update: {},
    create: {
      full_name: 'Super Admin',
      email: 'admin@sombango.com',
      phone_number: '+2251234567890',
      password_hash: adminPassword,
      role_id: adminRole.id,
      is_verified: true,
    },
  });

  console.log('Users created');

  // Create a test shop for the seller
  const shop = await prisma.shop.upsert({
    where: { id: 1 },
    update: {},
    create: {
      seller_id: seller.id,
      name: 'Test Shop',
      description: 'A test shop for demonstration',
      logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=150&fit=crop',
      is_active: true,
    },
  });

  console.log('Shop created');

  // Create test products
  const products = [
    {
      shop_id: shop.id,
      name: 'Smartphone Samsung Galaxy S24',
      description: 'Dernier smartphone Samsung avec appareil photo avancé et écran AMOLED 6.2"',
      price: 350000.00,
      stock: 15,
      category: 'Électronique',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop',
    },
    {
      shop_id: shop.id,
      name: 'Ordinateur Portable Dell XPS 13',
      description: 'Ultrabook haute performance avec processeur Intel i7 et 16GB RAM',
      price: 650000.00,
      stock: 8,
      category: 'Électronique',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop',
    },
    {
      shop_id: shop.id,
      name: 'Machine à laver LG 8kg',
      description: 'Lave-linge frontal avec programmes intelligents et économie d\'eau',
      price: 220000.00,
      stock: 6,
      category: 'Électroménager',
      image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=300&h=300&fit=crop',
    },
    {
      shop_id: shop.id,
      name: 'Réfrigérateur Samsung Side-by-Side',
      description: 'Réfrigérateur américain 500L avec distributeur d\'eau et glace',
      price: 450000.00,
      stock: 4,
      category: 'Électroménager',
      image: 'https://images.unsplash.com/photo-1584562187864-8247e76b1c3a?w=300&h=300&fit=crop',
    },
    {
      shop_id: shop.id,
      name: 'Télévision LG OLED 55"',
      description: 'TV OLED 4K avec HDR et smart TV intégré',
      price: 380000.00,
      stock: 7,
      category: 'Électronique',
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&h=300&fit=crop',
    },
    {
      shop_id: shop.id,
      name: 'Casque Audio Sony WH-1000XM5',
      description: 'Casque sans fil avec réduction de bruit active et autonomie 30h',
      price: 85000.00,
      stock: 12,
      category: 'Électronique',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
    },
    {
      shop_id: shop.id,
      name: 'Aspirateur Robot iRobot Roomba',
      description: 'Robot aspirateur intelligent avec navigation laser et app mobile',
      price: 180000.00,
      stock: 9,
      category: 'Électroménager',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop',
    },
    {
      shop_id: shop.id,
      name: 'Console PlayStation 5',
      description: 'Console de jeu nouvelle génération avec SSD ultra-rapide',
      price: 320000.00,
      stock: 5,
      category: 'Jeux & Loisirs',
      image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300&h=300&fit=crop',
    },
    {
      shop_id: shop.id,
      name: 'Montre Connectée Apple Watch Series 9',
      description: 'Montre intelligente avec suivi santé avancé et GPS intégré',
      price: 280000.00,
      stock: 11,
      category: 'Électronique',
      image: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=300&h=300&fit=crop',
    },
    {
      shop_id: shop.id,
      name: 'Cafetière Expresso DeLonghi',
      description: 'Machine à café automatique avec mousseur à lait intégré',
      price: 95000.00,
      stock: 8,
      category: 'Électroménager',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=300&fit=crop',
    },
    {
      shop_id: shop.id,
      name: 'Vélo Electrique Trek Verve+',
      description: 'Vélo électrique urbain avec assistance électrique et autonomie 80km',
      price: 550000.00,
      stock: 3,
      category: 'Sports & Loisirs',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
    },
    {
      shop_id: shop.id,
      name: 'Enceinte Bluetooth JBL GO 3',
      description: 'Enceinte portable étanche avec son puissant et batterie longue durée',
      price: 25000.00,
      stock: 20,
      category: 'Électronique',
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop',
    },
  ];

  for (const productData of products) {
    await prisma.product.upsert({
      where: { id: products.indexOf(productData) + 1 },
      update: {},
      create: productData,
    });
  }

  console.log('Products created');

  // Create test ad campaign
  const adCampaign = await prisma.adCampaign.upsert({
    where: { id: 1 },
    update: {},
    create: {
      shop_id: shop.id,
      title: 'Campagne Promotionnelle Été',
      description: 'Promotion des produits électroniques et électroménager',
      status: 'active',
      budget_type: 'total',
      total_budget: 50000.00,
      spent_budget: 0.00,
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      submitted_at: new Date(),
      approved_by: admin.id,
      approved_at: new Date(),
      last_status_change: new Date(),
    },
  });

  console.log('Ad campaign created');

  // Create test ads
  const ads = [
    {
      campaign_id: adCampaign.id,
      title: 'Smartphone Samsung -50%',
      content: 'Découvrez le nouveau Samsung Galaxy S24 avec une réduction exceptionnelle de 50% ! Appareil photo professionnel, écran AMOLED 6.2", autonomie toute la journée.',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
      target_url: 'http://localhost:5173/product/1',
      target_age_min: 18,
      target_age_max: 65,
      target_categories: JSON.stringify(['Électronique']),
      placement: 'home',
      cost_model: 'cpc',
      cost_per_click: 500.00,
      status: 'active',
      is_active: true,
    },
    {
      campaign_id: adCampaign.id,
      title: 'Électroménager LG -30%',
      content: 'Profitez de -30% sur toute la gamme électroménager LG ! Machines à laver, réfrigérateurs et plus encore avec livraison gratuite.',
      image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&h=300&fit=crop',
      target_url: 'http://localhost:5173/category/Électroménager',
      target_age_min: 25,
      target_age_max: 70,
      target_categories: JSON.stringify(['Électroménager']),
      placement: 'sidebar',
      cost_model: 'cpc',
      cost_per_click: 300.00,
      status: 'active',
      is_active: true,
    },
    {
      campaign_id: adCampaign.id,
      title: 'Gaming - PlayStation 5',
      content: 'La console de nouvelle génération est arrivée ! SSD ultra-rapide, graphismes 4K, expérience de jeu immersive.',
      image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&h=300&fit=crop',
      target_url: 'http://localhost:5173/product/8',
      target_age_min: 13,
      target_age_max: 45,
      target_categories: JSON.stringify(['Jeux & Loisirs']),
      placement: 'home',
      cost_model: 'cpm',
      cost_per_impression: 50.00,
      status: 'active',
      is_active: true,
    },
  ];

  for (const adData of ads) {
    await prisma.ad.upsert({
      where: { id: ads.indexOf(adData) + 1 },
      update: {},
      create: adData,
    });
  }

  console.log('Test ads created');

  console.log('Database seeded successfully!');
  console.log('\n=== Test Accounts ===');
  console.log('Buyer: buyer@test.com / buyer123');
  console.log('Seller: seller@test.com / seller123');
  console.log('Admin: admin@sombango.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });