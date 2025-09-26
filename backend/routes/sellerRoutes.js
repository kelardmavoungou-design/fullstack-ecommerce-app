const express = require('express');
const router = express.Router();
const {
  createShop,
  getShops,
  getShopById,
  updateShop,
  deleteShop,
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getShopStats,
  getShopCategories,
  getSellerProfile,
  updateSellerProfile,
  uploadSellerAvatar,
  processSellerWithdrawal,
  updateSellerBankAccount,
  getSellerBankAccount,
  verifySellerBankAccount
} = require('../controllers/sellerController');
const { authenticateToken, isSeller } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Shop:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Shop ID
 *         seller_id:
 *           type: integer
 *           description: Seller ID
 *         name:
 *           type: string
 *           description: Shop name
 *         description:
 *           type: string
 *           description: Shop description
 *         logo:
 *           type: string
 *           description: Shop logo URL
 *         is_active:
 *           type: boolean
 *           description: Shop active status
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Shop creation date
 *         product_count:
 *           type: integer
 *           description: Number of products in shop
 *         order_count:
 *           type: integer
 *           description: Number of orders for shop
 *         total_sales:
 *           type: number
 *           format: decimal
 *           description: Total sales amount
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Product ID
 *         shop_id:
 *           type: integer
 *           description: Shop ID
 *         name:
 *           type: string
 *           description: Product name
 *         description:
 *           type: string
 *           description: Product description
 *         price:
 *           type: number
 *           format: decimal
 *           description: Product price
 *         stock:
 *           type: integer
 *           description: Product stock quantity
 *         category:
 *           type: string
 *           description: Product category
 *         variants:
 *           type: object
 *           description: Product variants (JSON)
 *         image:
 *           type: string
 *           description: Product image URL
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Product creation date
 *     SellerOrder:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Order ID
 *         buyer_id:
 *           type: integer
 *           description: Buyer ID
 *         shop_id:
 *           type: integer
 *           description: Shop ID
 *         status:
 *           type: string
 *           enum: [pending, paid, shipped, delivered, cancelled]
 *           description: Order status
 *         total:
 *           type: number
 *           format: decimal
 *           description: Order total
 *         payment_method:
 *           type: string
 *           enum: [mobile_money, cash_on_delivery]
 *           description: Payment method
 *         shipping_address:
 *           type: string
 *           description: Shipping address
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Order creation date
 *         buyer_name:
 *           type: string
 *           description: Buyer name
 *         buyer_phone:
 *           type: string
 *           description: Buyer phone number
 *         buyer_email:
 *           type: string
 *           description: Buyer email
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *     ShopStats:
 *       type: object
 *       properties:
 *         product_count:
 *           type: integer
 *           description: Number of products in shop
 *         order_stats:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: Order status
 *               count:
 *                 type: integer
 *                 description: Number of orders with this status
 *         total_sales:
 *           type: number
 *           format: decimal
 *           description: Total sales amount
 *         monthly_sales:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               month:
 *                 type: integer
 *                 description: Month number (1-12)
 *               sales:
 *                 type: number
 *                 format: decimal
 *                 description: Sales amount for the month
 *         top_products:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: Product ID
 *               name:
 *                 type: string
 *                 description: Product name
 *               total_sold:
 *                 type: integer
 *                 description: Total quantity sold
 */

/**
 * @swagger
 * /api/seller/shops:
 *   post:
 *     summary: Create a new shop
 *     tags: [Seller Shops]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Shop name
 *               description:
 *                 type: string
 *                 description: Shop description
 *               logo:
 *                 type: string
 *                 description: Shop logo URL
 *     responses:
 *       201:
 *         description: Shop created successfully
 *       400:
 *         description: Shop name is required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/seller/shops', authenticateToken, isSeller, createShop);

/**
 * @swagger
 * /api/seller/shops:
 *   get:
 *     summary: Get seller's shops
 *     tags: [Seller Shops]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shops retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/seller/shops', authenticateToken, isSeller, getShops);

/**
 * @swagger
 * /api/seller/shops/{id}:
 *   get:
 *     summary: Get shop details by ID
 *     tags: [Seller Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shop ID
 *     responses:
 *       200:
 *         description: Shop details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */
router.get('/seller/shops/:id', authenticateToken, isSeller, getShopById);

/**
 * @swagger
 * /api/seller/shops/{id}:
 *   put:
 *     summary: Update shop
 *     tags: [Seller Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shop ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Shop name
 *               description:
 *                 type: string
 *                 description: Shop description
 *               logo:
 *                 type: string
 *                 description: Shop logo URL
 *               is_active:
 *                 type: boolean
 *                 description: Shop active status
 *     responses:
 *       200:
 *         description: Shop updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */
router.put('/seller/shops/:id', authenticateToken, isSeller, updateShop);


/**
 * @swagger
 * /api/seller/shops/{id}:
 *   delete:
 *     summary: Delete shop
 *     tags: [Seller Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shop ID
 *     responses:
 *       200:
 *         description: Shop deleted successfully
 *       400:
 *         description: Cannot delete shop with products
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */
router.delete('/seller/shops/:id', authenticateToken, isSeller, deleteShop);

/**
 * @swagger
 * /api/seller/shops/{shopId}/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Seller Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shop ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *               description:
 *                 type: string
 *                 description: Product description
 *               price:
 *                 type: number
 *                 format: decimal
 *                 description: Product price
 *               stock:
 *                 type: integer
 *                 description: Product stock quantity
 *               category:
 *                 type: string
 *                 description: Product category
 *               variants:
 *                 type: object
 *                 description: Product variants (JSON)
 *               image:
 *                 type: string
 *                 description: Product image URL
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Name, price, and stock are required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */
router.post('/seller/shops/:shopId/products', authenticateToken, isSeller, createProduct);

/**
 * @swagger
 * /api/seller/shops/{shopId}/products:
 *   get:
 *     summary: Get shop's products
 *     tags: [Seller Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shop ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Product category filter
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
 *         description: Search term
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */
router.get('/seller/shops/:shopId/products', authenticateToken, isSeller, getProducts);

/**
 * @swagger
 * /api/seller/shops/{shopId}/products/{productId}:
 *   get:
 *     summary: Get product details by ID
 *     tags: [Seller Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shop ID
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop or product not found
 *       500:
 *         description: Server error
 */
router.get('/seller/shops/:shopId/products/:productId', authenticateToken, isSeller, getProductById);

/**
 * @swagger
 * /api/seller/shops/{shopId}/products/{productId}:
 *   put:
 *     summary: Update product
 *     tags: [Seller Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shop ID
 *       - in: path
 *         name: productId
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
 *               name:
 *                 type: string
 *                 description: Product name
 *               description:
 *                 type: string
 *                 description: Product description
 *               price:
 *                 type: number
 *                 format: decimal
 *                 description: Product price
 *               stock:
 *                 type: integer
 *                 description: Product stock quantity
 *               category:
 *                 type: string
 *                 description: Product category
 *               variants:
 *                 type: object
 *                 description: Product variants (JSON)
 *               image:
 *                 type: string
 *                 description: Product image URL
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop or product not found
 *       500:
 *         description: Server error
 */
router.put('/seller/shops/:shopId/products/:productId', authenticateToken, isSeller, updateProduct);

/**
 * @swagger
 * /api/seller/shops/{shopId}/products/{productId}:
 *   delete:
 *     summary: Delete product
 *     tags: [Seller Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shop ID
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop or product not found
 *       500:
 *         description: Server error
 */
router.delete('/seller/shops/:shopId/products/:productId', authenticateToken, isSeller, deleteProduct);

/**
 * @swagger
 * /api/seller/shops/{shopId}/orders:
 *   get:
 *     summary: Get shop's orders
 *     tags: [Seller Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shop ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, shipped, delivered, cancelled]
 *         description: Order status filter
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
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */
router.get('/seller/shops/:shopId/orders', authenticateToken, isSeller, getOrders);

/**
 * @swagger
 * /api/seller/shops/{shopId}/orders/{orderId}:
 *   get:
 *     summary: Get order details by ID
 *     tags: [Seller Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shop ID
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop or order not found
 *       500:
 *         description: Server error
 */
router.get('/seller/shops/:shopId/orders/:orderId', authenticateToken, isSeller, getOrderById);

/**
 * @swagger
 * /api/seller/shops/{shopId}/orders/{orderId}:
 *   put:
 *     summary: Update order status
 *     tags: [Seller Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shop ID
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, paid, shipped, delivered, cancelled]
 *                 description: Order status
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop or order not found
 *       500:
 *         description: Server error
 */
router.put('/seller/shops/:shopId/orders/:orderId', authenticateToken, isSeller, updateOrderStatus);

/**
 * @swagger
 * /api/seller/shops/{shopId}/stats:
 *   get:
 *     summary: Get shop statistics
 *     tags: [Seller Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shop ID
 *     responses:
 *       200:
 *         description: Shop statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */
router.get('/seller/shops/:shopId/stats', authenticateToken, isSeller, getShopStats);

/**
 * @swagger
 * /api/seller/shops/{shopId}/categories:
 *   get:
 *     summary: Get shop categories
 *     tags: [Seller Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shop ID
 *     responses:
 *       200:
 *         description: Shop categories retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */
router.get('/seller/shops/:shopId/categories', authenticateToken, isSeller, getShopCategories);

/**
 * @swagger
 * /api/seller/profile:
 *   get:
 *     summary: Get seller profile
 *     tags: [Seller Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.get('/seller/profile', authenticateToken, isSeller, getSellerProfile);

/**
 * @swagger
 * /api/seller/profile:
 *   put:
 *     summary: Update seller profile
 *     tags: [Seller Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Seller first name
 *               lastName:
 *                 type: string
 *                 description: Seller last name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Seller email
 *               phone:
 *                 type: string
 *                 description: Seller phone number
 *               address:
 *                 type: string
 *                 description: Seller address
 *               city:
 *                 type: string
 *                 description: Seller city
 *               country:
 *                 type: string
 *                 description: Seller country
 *               businessName:
 *                 type: string
 *                 description: Business name
 *               businessType:
 *                 type: string
 *                 description: Business type
 *               businessRegistration:
 *                 type: string
 *                 description: Business registration number
 *               taxId:
 *                 type: string
 *                 description: Tax ID
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/seller/profile', authenticateToken, isSeller, updateSellerProfile);

/**
 * @swagger
 * /api/seller/profile/avatar:
 *   post:
 *     summary: Upload seller avatar
 *     tags: [Seller Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 description: Base64 encoded image
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: Invalid image
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/seller/profile/avatar', authenticateToken, isSeller, uploadSellerAvatar);

/**
 * @swagger
 * /api/seller/withdrawal:
 *   post:
 *     summary: Process seller withdrawal
 *     tags: [Seller Withdrawal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 description: Withdrawal amount
 *     responses:
 *       200:
 *         description: Withdrawal processed successfully
 *       400:
 *         description: Invalid amount or insufficient balance
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/seller/withdrawal', authenticateToken, isSeller, processSellerWithdrawal);

/**
 * @swagger
 * /api/seller/bank-account:
 *   get:
 *     summary: Get seller bank account information
 *     tags: [Seller Bank Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bank account information retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/seller/bank-account', authenticateToken, isSeller, getSellerBankAccount);

/**
 * @swagger
 * /api/seller/bank-account:
 *   put:
 *     summary: Update seller bank account information
 *     tags: [Seller Bank Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bank_provider
 *               - bank_account
 *             properties:
 *               bank_provider:
 *                 type: string
 *                 enum: [mtn_money]
 *                 description: Bank provider
 *               bank_account:
 *                 type: string
 *                 description: Phone number or account number
 *     responses:
 *       200:
 *         description: Bank account updated successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/seller/bank-account', authenticateToken, isSeller, updateSellerBankAccount);

/**
 * @swagger
 * /api/seller/bank-account/verify:
 *   post:
 *     summary: Verify seller bank account
 *     tags: [Seller Bank Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bank account verified successfully
 *       400:
 *         description: No bank account configured
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/seller/bank-account/verify', authenticateToken, isSeller, verifySellerBankAccount);

module.exports = router;