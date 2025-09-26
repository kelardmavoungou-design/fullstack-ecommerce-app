const pool = require('./config/database');

async function checkProducts() {
  try {
    console.log('🔍 Vérification des produits dans la base de données...\n');

    // Compter le nombre total de produits
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM products');
    console.log(`📊 Nombre total de produits: ${countResult[0].total}\n`);

    if (countResult[0].total === 0) {
      console.log('❌ Aucun produit trouvé dans la base de données');
      console.log('💡 Vous devez d\'abord insérer des produits avec le script insert-products.js');
      return;
    }

    // Afficher les premiers produits
    const [products] = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.price,
        p.stock,
        p.category,
        s.name as shop_name
      FROM products p
      JOIN shops s ON p.shop_id = s.id
      ORDER BY p.id ASC
      LIMIT 10
    `);

    console.log('📋 Liste des premiers produits:');
    console.log('─'.repeat(80));
    console.log('ID'.padEnd(5), 'Nom'.padEnd(30), 'Prix'.padEnd(10), 'Stock'.padEnd(8), 'Catégorie'.padEnd(15), 'Boutique');
    console.log('─'.repeat(80));

    products.forEach(product => {
      console.log(
        String(product.id).padEnd(5),
        String(product.name || 'N/A').padEnd(30),
        String(product.price || 'N/A').padEnd(10),
        String(product.stock || 0).padEnd(8),
        String(product.category || 'N/A').padEnd(15),
        product.shop_name || 'N/A'
      );
    });

    console.log('\n✅ Vérification terminée');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des produits:', error);
  } finally {
    process.exit();
  }
}

checkProducts();