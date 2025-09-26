const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary,
  validateCart,
  syncCart,
  createOrder,
  getOrders,
  getOrderById,
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  addReview,
  getProductReviews,
  getShops,
  getBuyerStats,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/buyerController');
const { authenticateToken, isBuyer } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Product ID
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
 *         image:
 *           type: string
 *           description: Product image URL
 *         variants:
 *           type: object
 *           description: Product variants (JSON)
 *         shop_name:
 *           type: string
 *           description: Shop name
 *         shop_logo:
 *           type: string
 *           description: Shop logo URL
 *     CartItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Cart item ID
 *         product_id:
 *           type: integer
 *           description: Product ID
 *         quantity:
 *           type: integer
 *           description: Item quantity
 *         name:
 *           type: string
 *           description: Product name
 *         price:
 *           type: number
 *           format: decimal
 *           description: Product price
 *         image:
 *           type: string
 *           description: Product image URL
 *         stock:
 *           type: integer
 *           description: Product stock quantity
 *         shop_name:
 *           type: string
 *           description: Shop name
 *         itemTotal:
 *           type: number
 *           format: decimal
 *           description: Item total price
 *     Order:
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
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Order creation date
 *         shop_name:
 *           type: string
 *           description: Shop name
 *         shop_logo:
 *           type: string
 *           description: Shop logo URL
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *     OrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Order item ID
 *         product_id:
 *           type: integer
 *           description: Product ID
 *         quantity:
 *           type: integer
 *           description: Item quantity
 *         price:
 *           type: number
 *           format: decimal
 *           description: Item price
 *         name:
 *           type: string
 *           description: Product name
 *         image:
 *           type: string
 *           description: Product image URL
 *     WishlistItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Wishlist item ID
 *         product_id:
 *           type: integer
 *           description: Product ID
 *         name:
 *           type: string
 *           description: Product name
 *         price:
 *           type: number
 *           format: decimal
 *           description: Product price
 *         image:
 *           type: string
 *           description: Product image URL
 *         category:
 *           type: string
 *           description: Product category
 *         shop_name:
 *           type: string
 *           description: Shop name
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Wishlist item creation date
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Review ID
 *         buyer_id:
 *           type: integer
 *           description: Buyer ID
 *         product_id:
 *           type: integer
 *           description: Product ID
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Product rating
 *         comment:
 *           type: string
 *           description: Review comment
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Review creation date
 *         reviewer_name:
 *           type: string
 *           description: Reviewer name
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with filtering and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Product category filter
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
 *       500:
 *         description: Server error
 */
router.get('/products', getProducts);

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
router.get('/products/:id', getProductById);

/**
 * @swagger
 * /api/buyer/cart:
 *   get:
 *     summary: Get user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/buyer/cart', authenticateToken, isBuyer, getCart);

/**
 * @swagger
 * /api/buyer/cart:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: integer
 *                 description: Product ID
 *               quantity:
 *                 type: integer
 *                 default: 1
 *                 description: Item quantity
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 *       400:
 *         description: Not enough stock available
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.post('/buyer/cart', authenticateToken, isBuyer, addToCart);

/**
 * @swagger
 * /api/buyer/cart/{itemId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 description: New quantity
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *       400:
 *         description: Not enough stock available
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Server error
 */
router.put('/buyer/cart/:itemId', authenticateToken, isBuyer, updateCartItem);

/**
 * @swagger
 * /api/buyer/cart/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart item ID
 *     responses:
 *       200:
 *         description: Item removed from cart successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Server error
 */
router.delete('/buyer/cart/:itemId', authenticateToken, isBuyer, removeFromCart);

/**
 * @swagger
 * /api/buyer/cart:
 *   delete:
 *     summary: Clear entire cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Server error
 */
router.delete('/buyer/cart', authenticateToken, isBuyer, clearCart);

/**
 * @swagger
 * /api/buyer/cart/summary:
 *   get:
 *     summary: Get cart summary for checkout
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart summary retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/buyer/cart/summary', authenticateToken, isBuyer, getCartSummary);

/**
 * @swagger
 * /api/buyer/cart/validate:
 *   post:
 *     summary: Validate cart before checkout
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart validation completed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/buyer/cart/validate', authenticateToken, isBuyer, validateCart);

/**
 * @swagger
 * /api/buyer/cart/sync:
 *   post:
 *     summary: Sync local cart with server
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CartItem'
 *     responses:
 *       200:
 *         description: Cart synced successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/buyer/cart/sync', authenticateToken, isBuyer, syncCart);

/**
 * @swagger
 * /api/buyer/orders:
 *   post:
 *     summary: Create order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cartId
 *               - paymentMethod
 *               - shippingAddress
 *             properties:
 *               cartId:
 *                 type: integer
 *                 description: Cart ID
 *               paymentMethod:
 *                 type: string
 *                 enum: [mobile_money, cash_on_delivery]
 *                 description: Payment method
 *               shippingAddress:
 *                 type: string
 *                 description: Shipping address
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Not enough stock available
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart not found or empty
 *       500:
 *         description: Server error
 */
router.post('/buyer/orders', authenticateToken, isBuyer, createOrder);

/**
 * @swagger
 * /api/buyer/orders:
 *   get:
 *     summary: Get user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       500:
 *         description: Server error
 */
router.get('/buyer/orders', authenticateToken, isBuyer, getOrders);

/**
 * @swagger
 * /api/buyer/orders/{id}:
 *   get:
 *     summary: Get order details by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get('/buyer/orders/:id', authenticateToken, isBuyer, getOrderById);

/**
 * @swagger
 * /api/buyer/wishlist:
 *   post:
 *     summary: Add product to wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: integer
 *                 description: Product ID
 *     responses:
 *       201:
 *         description: Product added to wishlist successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       409:
 *         description: Product already in wishlist
 *       500:
 *         description: Server error
 */
router.post('/buyer/wishlist', authenticateToken, isBuyer, addToWishlist);

/**
 * @swagger
 * /api/buyer/wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/buyer/wishlist', authenticateToken, isBuyer, getWishlist);

/**
 * @swagger
 * /api/buyer/wishlist/{productId}:
 *   delete:
 *     summary: Remove product from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product removed from wishlist successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found in wishlist
 *       500:
 *         description: Server error
 */
router.delete('/buyer/wishlist/:productId', authenticateToken, isBuyer, removeFromWishlist);

/**
 * @swagger
 * /api/buyer/products/{productId}/reviews:
 *   post:
 *     summary: Add product review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Product rating
 *               comment:
 *                 type: string
 *                 description: Review comment
 *     responses:
 *       201:
 *         description: Review added successfully
 *       400:
 *         description: Invalid rating
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       409:
 *         description: You have already reviewed this product
 *       500:
 *         description: Server error
 */
router.post('/buyer/products/:productId/reviews', authenticateToken, isBuyer, addReview);

/**
 * @swagger
 * /api/products/{productId}/reviews:
 *   get:
 *     summary: Get product reviews
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
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
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Product reviews retrieved successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.get('/products/:productId/reviews', getProductReviews);

/**
 * @swagger
 * /api/shops:
 *   get:
 *     summary: Get all active shops
 *     tags: [Shops]
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
 *         description: Search term for shop name or description
 *     responses:
 *       200:
 *         description: Shops retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/shops', getShops);

/**
 * @swagger
 * /api/buyer/stats:
 *   get:
 *     summary: Get buyer statistics
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Buyer statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/buyer/stats', authenticateToken, isBuyer, getBuyerStats);

/**
 * @swagger
 * /api/buyer/addresses:
 *   get:
 *     summary: Get user's addresses
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/buyer/addresses', authenticateToken, isBuyer, getAddresses);

/**
 * @swagger
 * /api/buyer/addresses:
 *   post:
 *     summary: Add new address
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - label
 *               - fullAddress
 *             properties:
 *               label:
 *                 type: string
 *                 description: Address label
 *               fullAddress:
 *                 type: string
 *                 description: Full address
 *               isDefault:
 *                 type: boolean
 *                 description: Whether this is the default address
 *     responses:
 *       201:
 *         description: Address added successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/buyer/addresses', authenticateToken, isBuyer, addAddress);

/**
 * @swagger
 * /api/buyer/addresses/{id}:
 *   put:
 *     summary: Update address
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Address ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 description: Address label
 *               fullAddress:
 *                 type: string
 *                 description: Full address
 *               isDefault:
 *                 type: boolean
 *                 description: Whether this is the default address
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.put('/buyer/addresses/:id', authenticateToken, isBuyer, updateAddress);

/**
 * @swagger
 * /api/buyer/addresses/{id}:
 *   delete:
 *     summary: Delete address
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.delete('/buyer/addresses/:id', authenticateToken, isBuyer, deleteAddress);

/**
 * @swagger
 * /api/buyer/notifications:
 *   get:
 *     summary: Get user's notifications
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/buyer/notifications', authenticateToken, isBuyer, getNotifications);

/**
 * @swagger
 * /api/buyer/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.put('/buyer/notifications/:id/read', authenticateToken, isBuyer, markNotificationRead);

/**
 * @swagger
 * /api/buyer/notifications/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/buyer/notifications/mark-all-read', authenticateToken, isBuyer, markAllNotificationsRead);

module.exports = router;