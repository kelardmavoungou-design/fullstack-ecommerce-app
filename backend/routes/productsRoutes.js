const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products (public)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product names
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [popular, price_asc, price_desc, newest]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *                       stock:
 *                         type: integer
 *                       category:
 *                         type: string
 *                       image:
 *                         type: string
 *                       shop_name:
 *                         type: string
 *                       shop_logo:
 *                         type: string
 *                       rating:
 *                         type: number
 *                       reviews_count:
 *                         type: integer
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const category = req.query.category;
    const search = req.query.search;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const sort = req.query.sort || 'newest';
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = '';
    let params = [];

    if (category && category !== 'all') {
      whereClause += ' AND p.category = ?';
      params.push(category);
    }

    if (search) {
      whereClause += ' AND p.name LIKE ?';
      params.push(`%${search}%`);
    }

    if (minPrice !== null) {
      whereClause += ' AND p.price >= ?';
      params.push(minPrice);
    }

    if (maxPrice !== null) {
      whereClause += ' AND p.price <= ?';
      params.push(maxPrice);
    }

    // Build ORDER BY clause
    let orderBy = 'ORDER BY p.created_at DESC'; // default: newest
    switch (sort) {
      case 'price_asc':
        orderBy = 'ORDER BY p.price ASC';
        break;
      case 'price_desc':
        orderBy = 'ORDER BY p.price DESC';
        break;
      case 'popular':
        orderBy = 'ORDER BY COALESCE(review_stats.avg_rating, 0) DESC, COALESCE(review_stats.review_count, 0) DESC';
        break;
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM products p
       JOIN shops s ON p.shop_id = s.id
       ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get products with shop info and review stats
    const [products] = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.category,
        p.image,
        p.images,
        p.created_at,
        s.name as shop_name,
        s.logo as shop_logo,
        COALESCE(review_stats.avg_rating, 4.5) as rating,
        COALESCE(review_stats.review_count, 0) as reviews_count
      FROM products p
      JOIN shops s ON p.shop_id = s.id
      LEFT JOIN (
        SELECT
          product_id,
          AVG(rating) as avg_rating,
          COUNT(*) as review_count
        FROM reviews
        GROUP BY product_id
      ) review_stats ON p.id = review_stats.product_id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Transform data to match expected format
    const transformedProducts = products.map(product => {
      // Process images array
      let images = [];
      if (product.images) {
        try {
          const parsedImages = JSON.parse(product.images);
          if (Array.isArray(parsedImages)) {
            images = parsedImages
              .filter(img => typeof img === 'string')
              .map(img =>
                img.startsWith('http') ? img : `${process.env.BASE_URL || 'http://localhost:4000'}/uploads/products/${img}`
              );
          }
        } catch (e) {
          console.warn('Invalid images JSON for product', product.id, e);
        }
      }

      return {
        id: product.id,
        name: product.name || 'Produit sans nom',
        description: product.description || 'Aucune description disponible.',
        price: product.price || 0,
        stock: product.stock || 0,
        category: product.category || 'Non catégorisé',
        image: product.image ? `${process.env.BASE_URL || 'http://localhost:4000'}/uploads/products/${product.image}` : null,
        images: images,
        shop_name: product.shop_name || 'Boutique inconnue',
        shop_logo: product.shop_logo ? `${process.env.BASE_URL || 'http://localhost:4000'}/uploads/logos/${product.shop_logo}` : null,
        rating: parseFloat(product.rating) || 4.5,
        reviews_count: product.reviews_count || 0
      };
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      products: transformedProducts,
      total,
      page,
      limit,
      totalPages
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des produits'
    });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product details by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details retrieved successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);
    console.log('🔎 API: Recherche du produit ID:', id, 'Type:', typeof id, 'Parsed:', productId);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de produit invalide'
      });
    }

    console.log('🔎 API: About to query database for product ID:', productId);

    const [products] = await pool.query(`
      SELECT
        p.*,
        s.name as shop_name,
        s.logo as shop_logo,
        s.description as shop_description,
        COALESCE(review_stats.avg_rating, 4.5) as rating,
        COALESCE(review_stats.review_count, 0) as reviews_count
      FROM products p
      JOIN shops s ON p.shop_id = s.id
      LEFT JOIN (
        SELECT
          product_id,
          AVG(rating) as avg_rating,
          COUNT(*) as review_count
        FROM reviews
        GROUP BY product_id
      ) review_stats ON p.id = review_stats.product_id
      WHERE p.id = ?
    `, [productId]);

    console.log('🔎 API: Nombre de produits trouvés:', products.length, 'pour ID:', productId);
    if (products.length > 0) {
      console.log('🔎 API: Premier produit trouvé:', {
        id: products[0].id,
        name: products[0].name,
        shop_id: products[0].shop_id
      });
    }

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé'
      });
    }

    const product = products[0];

    // Process images array
    let images = [];
    if (product.images) {
      try {
        const parsedImages = JSON.parse(product.images);
        if (Array.isArray(parsedImages)) {
          images = parsedImages.map(img =>
            img.startsWith('http') ? img : `${process.env.BASE_URL || 'http://localhost:4000'}/uploads/products/${img}`
          );
        }
      } catch (e) {
        console.warn('Invalid images JSON for product', product.id, e);
      }
    }

    // Transform data
    const transformedProduct = {
      id: product.id,
      name: product.name || 'Produit sans nom',
      description: product.description || 'Aucune description disponible.',
      price: product.price || 0,
      stock: product.stock || 0,
      category: product.category || 'Non catégorisé',
      image: product.image ? `${process.env.BASE_URL || 'http://localhost:4000'}/uploads/products/${product.image}` : null,
      images: images,
      shop_name: product.shop_name || 'Boutique inconnue',
      shop_logo: product.shop_logo ? `${process.env.BASE_URL || 'http://localhost:4000'}/uploads/logos/${product.shop_logo}` : null,
      shop_description: product.shop_description || 'Aucune description de boutique disponible.',
      rating: parseFloat(product.rating) || 4.5,
      reviews_count: product.reviews_count || 0,
      created_at: product.created_at
    };

    res.json(transformedProduct);
  } catch (error) {
    console.error('Error fetching product details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du produit'
    });
  }
});

/**
 * @swagger
 * /api/products/{id}/reviews:
 *   get:
 *     summary: Get product reviews
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of reviews per page
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get reviews
    const [reviews] = await pool.query(`
      SELECT
        r.*,
        u.full_name as reviewer_name,
        u.avatar as reviewer_avatar
      FROM reviews r
      JOIN users u ON r.buyer_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [id, limit, offset]);

    // Get total count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM reviews WHERE product_id = ?',
      [id]
    );
    const total = countResult[0].total;

    // Transform reviews
    const transformedReviews = reviews.map(review => ({
      id: review.id,
      buyer_id: review.buyer_id,
      product_id: review.product_id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      reviewer_name: review.reviewer_name,
      reviewer_avatar: review.reviewer_avatar ? `${process.env.BASE_URL || 'http://localhost:4000'}/uploads/avatars/${review.reviewer_avatar}` : null
    }));

    res.json({
      reviews: transformedReviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des avis'
    });
  }
});

/**
 * @swagger
 * /api/products/{id}/reviews:
 *   post:
 *     summary: Add a review for a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review added successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.post('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de produit invalide'
      });
    }

    // Check if product exists
    const [product] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé'
      });
    }

    // Insert review
    await pool.query(
      'INSERT INTO reviews (product_id, buyer_id, rating, comment, created_at) VALUES (?, ?, ?, ?, NOW())',
      [productId, req.user.id, rating, comment]
    );

    res.status(201).json({
      success: true,
      message: 'Avis ajouté avec succès'
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'ajout de l\'avis'
    });
  }
});

/**
 * @swagger
 * /api/products/{id}/reviews/{reviewId}:
 *   put:
 *     summary: Update a review
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Product or review not found
 *       500:
 *         description: Server error
 */
router.put('/:id/reviews/:reviewId', async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const { rating, comment } = req.body;
    const productId = parseInt(id);
    const reviewIdInt = parseInt(reviewId);

    if (isNaN(productId) || isNaN(reviewIdInt)) {
      return res.status(400).json({
        success: false,
        error: 'ID de produit ou d\'avis invalide'
      });
    }

    // Check if product and review exist
    const [review] = await pool.query('SELECT id FROM reviews WHERE id = ? AND product_id = ?', [reviewIdInt, productId]);
    if (review.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produit ou avis non trouvé'
      });
    }

    // Update review
    await pool.query(
      'UPDATE reviews SET rating = ?, comment = ?, updated_at = NOW() WHERE id = ?',
      [rating, comment, reviewIdInt]
    );

    res.json({
      success: true,
      message: 'Avis mis à jour avec succès'
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de l\'avis'
    });
  }
});

/**
 * @swagger
 * /api/products/{id}/reviews/{reviewId}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       404:
 *         description: Product or review not found
 *       500:
 *         description: Server error
 */
router.delete('/:id/reviews/:reviewId', async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const productId = parseInt(id);
    const reviewIdInt = parseInt(reviewId);

    if (isNaN(productId) || isNaN(reviewIdInt)) {
      return res.status(400).json({
        success: false,
        error: 'ID de produit ou d\'avis invalide'
      });
    }

    // Check if product and review exist
    const [review] = await pool.query('SELECT id FROM reviews WHERE id = ? AND product_id = ?', [reviewIdInt, productId]);
    if (review.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produit ou avis non trouvé'
      });
    }

    // Delete review
    await pool.query('DELETE FROM reviews WHERE id = ?', [reviewIdInt]);

    res.json({
      success: true,
      message: 'Avis supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de l\'avis'
    });
  }
});

module.exports = router;