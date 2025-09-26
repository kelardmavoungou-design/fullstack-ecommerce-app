const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

// Configuration Multer pour l'upload d'images de campagne
const campaignStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const fs = require('fs');
    const uploadDir = path.join(__dirname, '..', 'uploads', 'campaigns');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'campaign_' + uniqueSuffix + path.extname(file.originalname));
  }
});

const campaignUpload = multer({
  storage: campaignStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// Check if there's any router-level middleware
console.log('adCampaignRoutes: Router created, checking for middleware...');

// Add router-level middleware to check for issues
router.use((req, res, next) => {
  console.log(`adCampaignRoutes: ${req.method} ${req.path} - checking router middleware`);
  next();
});
const {
  getUserShops,
  getUserProducts,
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  updateCampaignStatus,
  approveCampaign,
  rejectCampaign,
  getPendingCampaigns,
  createAd,
  getAds,
  updateAd,
  deleteAd,
  trackImpression,
  trackClick,
  getCampaignStats,
  serveAd,
  serveAds,
  uploadImage
} = require('../controllers/adCampaignController');

/**
 * @swagger
 * components:
 *   schemas:
 *     AdCampaign:
 *       type: object
 *       required:
 *         - shop_id
 *         - title
 *         - budget_type
 *         - total_budget
 *         - start_date
 *         - end_date
 *       properties:
 *         id:
 *           type: integer
 *           description: Campaign ID
 *         shop_id:
 *           type: integer
 *           description: Shop ID
 *         title:
 *           type: string
 *           description: Campaign title
 *         description:
 *           type: string
 *           description: Campaign description
 *         status:
 *           type: string
 *           enum: [draft, pending, active, paused, completed, expired, cancelled]
 *         budget_type:
 *           type: string
 *           enum: [total, daily]
 *         total_budget:
 *           type: number
 *           format: decimal
 *         daily_budget:
 *           type: number
 *           format: decimal
 *         spent_budget:
 *           type: number
 *           format: decimal
 *         start_date:
 *           type: string
 *           format: date-time
 *         end_date:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/ad-campaigns:
 *   post:
 *     summary: Create a new advertising campaign
 *     tags: [Advertising]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shop_id
 *               - title
 *               - budget_type
 *               - total_budget
 *               - start_date
 *               - end_date
 *             properties:
 *               shop_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               budget_type:
 *                 type: string
 *                 enum: [total, daily]
 *               total_budget:
 *                 type: number
 *               daily_budget:
 *                 type: number
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post('/', authenticateToken, createCampaign);

/**
 * @swagger
 * /api/ad-campaigns:
 *   get:
 *     summary: Get all campaigns for the authenticated seller
 *     tags: [Advertising]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by campaign status
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
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Campaigns retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, getCampaigns);

/**
 * @swagger
 * /api/ad-campaigns/user/shops:
 *   get:
 *     summary: Get user's shops for campaign creation
 *     tags: [Advertising]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shops retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/user/shops', authenticateToken, getUserShops);

/**
 * @swagger
 * /api/ad-campaigns/user/products:
 *   get:
 *     summary: Get user's products for campaign creation
 *     tags: [Advertising]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/user/products', authenticateToken, getUserProducts);

/**
 * @swagger
 * /api/ad-campaigns/serve:
 *   get:
 *     summary: Serve a single ad for display
 *     tags: [Advertising]
 *     parameters:
 *       - in: query
 *         name: placement
 *         required: true
 *         schema:
 *           type: string
 *           enum: [home, sidebar, product_page, search_results, category_page]
 *         description: Ad placement location
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: User ID for targeting
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         description: User categories (comma-separated)
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: User location
 *       - in: query
 *         name: age
 *         schema:
 *           type: integer
 *         description: User age
 *     responses:
 *       200:
 *         description: Ad served successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.get('/serve', (req, res, next) => {
  console.log('Serve route middleware hit');
  next();
}, serveAd);

/**
 * @swagger
 * /api/ad-campaigns/serve/multiple:
 *   get:
 *     summary: Serve multiple ads for display
 *     tags: [Advertising]
 *     parameters:
 *       - in: query
 *         name: placement
 *         required: true
 *         schema:
 *           type: string
 *           enum: [home, sidebar, product_page, search_results, category_page]
 *         description: Ad placement location
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: User ID for targeting
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 3
 *         description: Maximum number of ads to serve
 *     responses:
 *       200:
 *         description: Ads served successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.get('/serve/multiple', serveAds);

/**
 * @swagger
 * /api/ad-campaigns/{id}:
 *   get:
 *     summary: Get a specific campaign
 *     tags: [Advertising]
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
 *         description: Campaign retrieved successfully
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateToken, getCampaign);

/**
 * @swagger
 * /api/ad-campaigns/{id}:
 *   put:
 *     summary: Update a campaign
 *     tags: [Advertising]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               total_budget:
 *                 type: number
 *               daily_budget:
 *                 type: number
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticateToken, updateCampaign);

/**
 * @swagger
 * /api/ad-campaigns/{id}:
 *   delete:
 *     summary: Delete a campaign
 *     tags: [Advertising]
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
 *         description: Campaign deleted successfully
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateToken, deleteCampaign);

/**
 * @swagger
 * /api/ad-campaigns/{id}/status:
 *   put:
 *     summary: Update campaign status
 *     tags: [Advertising]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, pending, active, paused, completed, expired, cancelled]
 *     responses:
 *       200:
 *         description: Campaign status updated successfully
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Server error
 */
router.put('/:id/status', authenticateToken, updateCampaignStatus);

/**
 * @swagger
 * /api/ad-campaigns/{campaignId}/ads:
 *   post:
 *     summary: Create an ad in a campaign
 *     tags: [Advertising]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
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
 *             required:
 *               - title
 *               - content
 *               - target_url
 *               - placement
 *               - cost_model
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *               target_url:
 *                 type: string
 *               target_age_min:
 *                 type: integer
 *               target_age_max:
 *                 type: integer
 *               target_regions:
 *                 type: array
 *                 items:
 *                   type: string
 *               target_categories:
 *                 type: array
 *                 items:
 *                   type: string
 *               placement:
 *                 type: string
 *                 enum: [home, sidebar, product_page, search_results, category_page]
 *               cost_model:
 *                 type: string
 *                 enum: [cpc, cpm, cpa]
 *               cost_per_click:
 *                 type: number
 *               cost_per_impression:
 *                 type: number
 *     responses:
 *       201:
 *         description: Ad created successfully
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Server error
 */
router.post('/:campaignId/ads', authenticateToken, createAd);

/**
 * @swagger
 * /api/ad-campaigns/{campaignId}/ads:
 *   get:
 *     summary: Get all ads in a campaign
 *     tags: [Advertising]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Ads retrieved successfully
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Server error
 */
router.get('/:campaignId/ads', authenticateToken, getAds);

/**
 * @swagger
 * /api/ad-campaigns/ads/{id}:
 *   put:
 *     summary: Update an ad
 *     tags: [Advertising]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ad ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *               target_url:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected, active, paused, completed, expired]
 *     responses:
 *       200:
 *         description: Ad updated successfully
 *       404:
 *         description: Ad not found
 *       500:
 *         description: Server error
 */
router.put('/ads/:id', authenticateToken, updateAd);

/**
 * @swagger
 * /api/ad-campaigns/ads/{id}:
 *   delete:
 *     summary: Delete an ad
 *     tags: [Advertising]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ad ID
 *     responses:
 *       200:
 *         description: Ad deleted successfully
 *       404:
 *         description: Ad not found
 *       500:
 *         description: Server error
 */
router.delete('/ads/:id', authenticateToken, deleteAd);

/**
 * @swagger
 * /api/ad-campaigns/pending:
 *   get:
 *     summary: Get all pending campaigns for Super Admin validation
 *     tags: [Advertising]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending campaigns retrieved successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/pending', authenticateToken, getPendingCampaigns);

/**
 * @swagger
 * /api/ad-campaigns/{id}/approve:
 *   put:
 *     summary: Approve a campaign (Super Admin only)
 *     tags: [Advertising]
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
 *       403:
 *         description: Access denied
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Server error
 */
router.put('/:id/approve', authenticateToken, approveCampaign);

/**
 * @swagger
 * /api/ad-campaigns/{id}/reject:
 *   put:
 *     summary: Reject a campaign (Super Admin only)
 *     tags: [Advertising]
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
 *       required: false
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
 *       403:
 *         description: Access denied
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Server error
 */
router.put('/:id/reject', authenticateToken, rejectCampaign);

/**
 * @swagger
 * /api/ad-campaigns/track/impression:
 *   post:
 *     summary: Track an ad impression
 *     tags: [Advertising]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaign_id
 *               - ad_id
 *               - ip_address
 *             properties:
 *               campaign_id:
 *                 type: integer
 *               ad_id:
 *                 type: integer
 *               user_id:
 *                 type: integer
 *               ip_address:
 *                 type: string
 *               user_agent:
 *                 type: string
 *               placement:
 *                 type: string
 *                 enum: [home, sidebar, product_page, search_results, category_page]
 *     responses:
 *       200:
 *         description: Impression tracked successfully
 *       404:
 *         description: Ad not found
 *       500:
 *         description: Server error
 */
router.post('/track/impression', trackImpression);

/**
 * @swagger
 * /api/ad-campaigns/track/click:
 *   post:
 *     summary: Track an ad click and deduct budget
 *     tags: [Advertising]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaign_id
 *               - ad_id
 *               - ip_address
 *             properties:
 *               campaign_id:
 *                 type: integer
 *               ad_id:
 *                 type: integer
 *               user_id:
 *                 type: integer
 *               ip_address:
 *                 type: string
 *               user_agent:
 *                 type: string
 *               placement:
 *                 type: string
 *                 enum: [home, sidebar, product_page, search_results, category_page]
 *     responses:
 *       200:
 *         description: Click tracked and budget deducted
 *       400:
 *         description: Insufficient budget or invalid request
 *       404:
 *         description: Ad not found
 *       500:
 *         description: Server error
 */
router.post('/track/click', trackClick);

/**
 * @swagger
 * /api/ad-campaigns/{id}/stats:
 *   get:
 *     summary: Get campaign statistics
 *     tags: [Advertising]
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
 *         description: Campaign statistics retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Server error
 */
router.get('/:id/stats', authenticateToken, getCampaignStats);

/**
 * @swagger
 * /api/ad-campaigns/upload-image:
 *   post:
 *     summary: Upload an image for campaign creative
 *     tags: [Advertising]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: Invalid file or no file provided
 *       500:
 *         description: Server error
 */
router.post('/upload-image', authenticateToken, campaignUpload.single('image'), uploadImage);

// Temporary test route
router.get('/test', (req, res) => {
  console.log('Ad campaign test route hit');
  res.json({ message: 'Ad campaign routes working' });
});

module.exports = router;