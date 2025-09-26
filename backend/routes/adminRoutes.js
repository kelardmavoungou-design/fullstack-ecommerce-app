const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getShops,
  getShopById,
  updateShop,
  deleteShop,
  certifyShop,
  getReports,
  getReportById,
  updateReportStatus,
  getPlatformStats,
  updatePlatformStats
} = require('../controllers/adminController');

// Import campaign management functions from adCampaignController
const {
  approveCampaign,
  rejectCampaign,
  getPendingCampaigns
} = require('../controllers/adCampaignController');

// Import delivery management functions
const {
  assignDeliveryToPerson,
  getAllDeliveries,
  getAvailableDeliveryPersonnel,
  createManualDelivery,
  getDeliveryStats
} = require('../services/deliveryManagementService');

const { authenticateToken, isSuperAdmin } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardStats:
 *       type: object
 *       properties:
 *         users:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 description: User role
 *               count:
 *                 type: integer
 *                 description: Number of users with this role
 *         shops:
 *           type: object
 *           properties:
 *             total_shops:
 *               type: integer
 *               description: Total number of shops
 *             active_shops:
 *               type: integer
 *               description: Number of active shops
 *         products:
 *           type: object
 *           properties:
 *             total_products:
 *               type: integer
 *               description: Total number of products
 *             total_stock:
 *               type: integer
 *               description: Total stock across all products
 *         orders:
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
 *               total_amount:
 *                 type: number
 *                 format: decimal
 *                 description: Total amount of orders with this status
 *         ads:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: Ad status
 *               count:
 *                 type: integer
 *                 description: Number of ads with this status
 *               total_budget:
 *                 type: number
 *                 format: decimal
 *                 description: Total budget of ads with this status
 *         recent_users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *         recent_shops:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Shop'
 *         recent_orders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SellerOrder'
 *         pending_ads:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Ad'
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
 *               orders:
 *                 type: integer
 *                 description: Number of orders for the month
 *         platform_stats:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date
 *               total_users:
 *                 type: integer
 *                 description: Total users on this date
 *               total_orders:
 *                 type: integer
 *                 description: Total orders on this date
 *               total_sales:
 *                 type: number
 *                 format: decimal
 *                 description: Total sales on this date
 *               total_ads:
 *                 type: integer
 *                 description: Total ads on this date
 *     AdminUser:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: User ID
 *         full_name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           description: User's email
 *         phone_number:
 *           type: string
 *           description: User's phone number
 *         is_verified:
 *           type: boolean
 *           description: User verification status
 *         role:
 *           type: string
 *           description: User role
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: User creation date
 *         shops:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Shop'
 *     AdminShop:
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
 *         seller_name:
 *           type: string
 *           description: Seller name
 *         seller_email:
 *           type: string
 *           description: Seller email
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
 *     Report:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Report ID
 *         reported_by:
 *           type: integer
 *           description: User ID who reported
 *         target_type:
 *           type: string
 *           enum: [user, shop, product]
 *           description: Type of target being reported
 *         target_id:
 *           type: integer
 *           description: ID of target being reported
 *         reason:
 *           type: string
 *           description: Reason for report
 *         status:
 *           type: string
 *           enum: [open, closed]
 *           description: Report status
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Report creation date
 *         reporter_name:
 *           type: string
 *           description: Name of user who reported
 *         reporter_email:
 *           type: string
 *           description: Email of user who reported
 *         target:
 *           type: object
 *           description: Target details (varies by target_type)
 *     PlatformStats:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           description: Date
 *         total_users:
 *           type: integer
 *           description: Total users on this date
 *         total_orders:
 *           type: integer
 *           description: Total orders on this date
 *         total_sales:
 *           type: number
 *           format: decimal
 *           description: Total sales on this date
 *         total_ads:
 *           type: integer
 *           description: Total ads on this date
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics (SuperAdmin only)
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/admin/dashboard', authenticateToken, isSuperAdmin, getDashboardStats);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (SuperAdmin only)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [buyer, seller, superadmin]
 *         description: User role filter
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: User verification status filter
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
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/admin/users', authenticateToken, isSuperAdmin, getUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details by ID (SuperAdmin only)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/admin/users/:id', authenticateToken, isSuperAdmin, getUserById);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user (SuperAdmin only)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email
 *               phone_number:
 *                 type: string
 *                 description: User's phone number
 *               is_verified:
 *                 type: boolean
 *                 description: User verification status
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 *       409:
 *         description: Email or phone number already in use
 *       500:
 *         description: Server error
 */
router.put('/admin/users/:id', authenticateToken, isSuperAdmin, updateUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user (SuperAdmin only)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/admin/users/:id', authenticateToken, isSuperAdmin, deleteUser);

/**
 * @swagger
 * /api/admin/shops:
 *   get:
 *     summary: Get all shops (SuperAdmin only)
 *     tags: [Admin Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Shop active status filter
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: integer
 *         description: Seller ID filter
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
 *         description: Shops retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/admin/shops', authenticateToken, isSuperAdmin, getShops);

/**
 * @swagger
 * /api/admin/shops/{id}:
 *   get:
 *     summary: Get shop details by ID (SuperAdmin only)
 *     tags: [Admin Shops]
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
 *       403:
 *         description: Access denied
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */
router.get('/admin/shops/:id', authenticateToken, isSuperAdmin, getShopById);

/**
 * @swagger
 * /api/admin/shops/{id}:
 *   put:
 *     summary: Update shop (SuperAdmin only)
 *     tags: [Admin Shops]
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
 *       403:
 *         description: Access denied
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */
router.put('/admin/shops/:id', authenticateToken, isSuperAdmin, updateShop);

/**
 * @swagger
 * /api/admin/shops/{id}:
 *   delete:
 *     summary: Delete shop (SuperAdmin only)
 *     tags: [Admin Shops]
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */
router.delete('/admin/shops/:id', authenticateToken, isSuperAdmin, deleteShop);

/**
 * @swagger
 * /api/admin/shops/{id}/certify:
 *   put:
 *     summary: Certify or uncertify a shop
 *     tags: [Admin Shops]
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
 *             required:
 *               - certified
 *             properties:
 *               certified:
 *                 type: boolean
 *                 description: Whether to certify (true) or uncertify (false) the shop
 *     responses:
 *       200:
 *         description: Shop certification status updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */
router.put('/admin/shops/:id/certify', authenticateToken, isSuperAdmin, certifyShop);

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     summary: Get all reports (SuperAdmin only)
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed]
 *         description: Report status filter
 *       - in: query
 *         name: targetType
 *         schema:
 *           type: string
 *           enum: [user, shop, product]
 *         description: Target type filter
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
 *         description: Reports retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/admin/reports', authenticateToken, isSuperAdmin, getReports);

/**
 * @swagger
 * /api/admin/reports/{id}:
 *   get:
 *     summary: Get report details by ID (SuperAdmin only)
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */
router.get('/admin/reports/:id', authenticateToken, isSuperAdmin, getReportById);

/**
 * @swagger
 * /api/admin/reports/{id}:
 *   put:
 *     summary: Update report status (SuperAdmin only)
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
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
 *                 enum: [open, closed]
 *                 description: Report status
 *     responses:
 *       200:
 *         description: Report status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */
router.put('/admin/reports/:id', authenticateToken, isSuperAdmin, updateReportStatus);

/**
 * @swagger
 * /api/admin/platform-stats:
 *   get:
 *     summary: Get platform statistics (SuperAdmin only)
 *     tags: [Admin Platform Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *     responses:
 *       200:
 *         description: Platform statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/admin/platform-stats', authenticateToken, isSuperAdmin, getPlatformStats);

/**
 * @swagger
 * /api/admin/platform-stats:
 *   put:
 *     summary: Update platform statistics (SuperAdmin only)
 *     tags: [Admin Platform Stats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - total_users
 *               - total_orders
 *               - total_sales
 *               - total_ads
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date
 *               total_users:
 *                 type: integer
 *                 description: Total users on this date
 *               total_orders:
 *                 type: integer
 *                 description: Total orders on this date
 *               total_sales:
 *                 type: number
 *                 format: decimal
 *                 description: Total sales on this date
 *               total_ads:
 *                 type: integer
 *                 description: Total ads on this date
 *     responses:
 *       200:
 *         description: Platform statistics updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.put('/admin/platform-stats', authenticateToken, isSuperAdmin, updatePlatformStats);

/**
 * @swagger
 * /api/admin/campaigns/pending:
 *   get:
 *     summary: Get all pending campaigns (SuperAdmin only)
 *     tags: [Admin Campaigns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending campaigns retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/admin/campaigns/pending', authenticateToken, isSuperAdmin, getPendingCampaigns);

/**
 * @swagger
 * /api/admin/campaigns/{id}/approve:
 *   put:
 *     summary: Approve a campaign (SuperAdmin only)
 *     tags: [Admin Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign approved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Server error
 */
router.put('/admin/campaigns/:id/approve', authenticateToken, isSuperAdmin, approveCampaign);

/**
 * @swagger
 * /api/admin/campaigns/{id}/reject:
 *   put:
 *     summary: Reject a campaign (SuperAdmin only)
 *     tags: [Admin Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rejection_reason:
 *                 type: string
 *                 description: Reason for rejection
 *     responses:
 *       200:
 *         description: Campaign rejected successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Server error
 */
router.put('/admin/campaigns/:id/reject', authenticateToken, isSuperAdmin, rejectCampaign);

/**
 * @swagger
 * /api/admin/deliveries:
 *   get:
 *     summary: Get all deliveries (SuperAdmin only)
 *     tags: [Admin Deliveries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [assigned, picked_up, in_transit, delivered, failed]
 *         description: Delivery status filter
 *       - in: query
 *         name: delivery_person_id
 *         schema:
 *           type: integer
 *         description: Delivery person ID filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of items per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: Deliveries retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/admin/deliveries', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const { status, delivery_person_id, limit = 50, offset = 0 } = req.query;
    const result = await getAllDeliveries({ status, delivery_person_id, limit, offset });

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({ message: result.error });
    }
  } catch (error) {
    console.error('Error getting deliveries:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des livraisons' });
  }
});

/**
 * @swagger
 * /api/admin/deliveries/{id}/assign:
 *   put:
 *     summary: Assign delivery to a delivery person (SuperAdmin only)
 *     tags: [Admin Deliveries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Delivery ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - delivery_person_id
 *             properties:
 *               delivery_person_id:
 *                 type: integer
 *                 description: ID of the delivery person to assign
 *     responses:
 *       200:
 *         description: Delivery assigned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Delivery or delivery person not found
 *       500:
 *         description: Server error
 */
router.put('/admin/deliveries/:id/assign', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_person_id } = req.body;
    const adminId = req.user.id;

    const result = await assignDeliveryToPerson(parseInt(id), delivery_person_id, adminId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ message: result.error });
    }
  } catch (error) {
    console.error('Error assigning delivery:', error);
    res.status(500).json({ message: 'Erreur lors de l\'assignation de la livraison' });
  }
});

/**
 * @swagger
 * /api/admin/delivery-personnel:
 *   get:
 *     summary: Get all available delivery personnel (SuperAdmin only)
 *     tags: [Admin Deliveries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Delivery personnel retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/admin/delivery-personnel', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const result = await getAvailableDeliveryPersonnel();

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({ message: result.error });
    }
  } catch (error) {
    console.error('Error getting delivery personnel:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du personnel de livraison' });
  }
});

/**
 * @swagger
 * /api/admin/deliveries/create:
 *   post:
 *     summary: Create a manual delivery (SuperAdmin only)
 *     tags: [Admin Deliveries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *               - delivery_person_id
 *             properties:
 *               order_id:
 *                 type: integer
 *                 description: ID of the order
 *               delivery_person_id:
 *                 type: integer
 *                 description: ID of the delivery person
 *     responses:
 *       201:
 *         description: Delivery created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post('/admin/deliveries/create', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const { order_id, delivery_person_id } = req.body;
    const adminId = req.user.id;

    const result = await createManualDelivery(order_id, delivery_person_id, adminId);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json({ message: result.error });
    }
  } catch (error) {
    console.error('Error creating delivery:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la livraison' });
  }
});

/**
 * @swagger
 * /api/admin/deliveries/stats:
 *   get:
 *     summary: Get delivery statistics (SuperAdmin only)
 *     tags: [Admin Deliveries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Delivery statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/admin/deliveries/stats', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const result = await getDeliveryStats();

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({ message: result.error });
    }
  } catch (error) {
    console.error('Error getting delivery stats:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques de livraison' });
  }
});

module.exports = router;