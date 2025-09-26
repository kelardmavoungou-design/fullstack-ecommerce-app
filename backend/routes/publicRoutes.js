const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * @swagger
 * /api/shops:
 *   get:
 *     summary: Get all active shops (public)
 *     tags: [Public]
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
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for shop names
 *     responses:
 *       200:
 *         description: Shops retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shops:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       seller_id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       logo:
 *                         type: string
 *                       is_active:
 *                         type: boolean
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       product_count:
 *                         type: integer
 *                       order_count:
 *                         type: integer
 *                       total_sales:
 *                         type: number
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get('/shops', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    // Build WHERE clause for search
    let whereClause = '';
    let params = [];

    if (search) {
      whereClause += ' AND s.name LIKE ?';
      params.push(`%${search}%`);
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM shops s ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get shops with stats
    const [shops] = await pool.query(`
      SELECT
        s.id,
        s.seller_id,
        s.name,
        s.description,
        s.logo,
        s.created_at,
        s.address,
        s.phone,
        s.email,
        s.opening_hours,
        s.facebook_url,
        s.twitter_url,
        s.instagram_url,
        s.youtube_url,
        s.footer_description,
        COALESCE(p_stats.product_count, 0) as product_count,
        COALESCE(o_stats.order_count, 0) as order_count,
        COALESCE(sales_stats.total_sales, 0) as total_sales
      FROM shops s
      LEFT JOIN (
        SELECT shop_id, COUNT(*) as product_count
        FROM products
        GROUP BY shop_id
      ) p_stats ON s.id = p_stats.shop_id
      LEFT JOIN (
        SELECT shop_id, COUNT(*) as order_count
        FROM orders
        GROUP BY shop_id
      ) o_stats ON s.id = o_stats.shop_id
      LEFT JOIN (
        SELECT shop_id, SUM(total) as total_sales
        FROM orders
        WHERE status IN ('paid', 'shipped', 'delivered')
        GROUP BY shop_id
      ) sales_stats ON s.id = sales_stats.shop_id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Transform data to match expected format
    const transformedShops = shops.map(shop => ({
      id: shop.id,
      seller_id: shop.seller_id,
      name: shop.name,
      description: shop.description,
      logo: shop.logo ? (shop.logo.startsWith('http') ? shop.logo : `${process.env.BASE_URL || 'http://localhost:4000'}${shop.logo}`) : null,
      created_at: shop.created_at,
      address: shop.address,
      phone: shop.phone,
      email: shop.email,
      opening_hours: shop.opening_hours,
      facebook_url: shop.facebook_url,
      twitter_url: shop.twitter_url,
      instagram_url: shop.instagram_url,
      youtube_url: shop.youtube_url,
      footer_description: shop.footer_description,
      product_count: shop.product_count,
      order_count: shop.order_count,
      total_sales: shop.total_sales
    }));

    const pages = Math.ceil(total / limit);

    res.json({
      shops: transformedShops,
      pagination: {
        total,
        page,
        limit,
        pages
      }
    });
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des boutiques'
    });
  }
});

module.exports = router;