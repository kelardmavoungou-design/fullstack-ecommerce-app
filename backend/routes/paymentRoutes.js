const express = require('express');
const router = express.Router();
const {
  processCardPaymentController,
  processMobileMoneyPaymentController,
  processCashPaymentController,
  verifyDeliveryCodeController,
  getPaymentStatusController,
  refundPaymentController,
  handleMtnMomoCallbackController,
  handleAirtelMoneyCallbackController,
  checkMtnMomoPaymentStatusController,
  checkAirtelMoneyPaymentStatusController
} = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     CardPayment:
 *       type: object
 *       required:
 *         - orderId
 *         - paymentMethodId
 *       properties:
 *         orderId:
 *           type: integer
 *           description: Order ID
 *         paymentMethodId:
 *           type: string
 *           description: Stripe payment method ID
 *     MobileMoneyPayment:
 *       type: object
 *       required:
 *         - orderId
 *         - phoneNumber
 *       properties:
 *         orderId:
 *           type: integer
 *           description: Order ID
 *         phoneNumber:
 *           type: string
 *           description: Mobile money phone number
 *     CashPayment:
 *       type: object
 *       required:
 *         - orderId
 *         - shippingAddress
 *       properties:
 *         orderId:
 *           type: integer
 *           description: Order ID
 *         shippingAddress:
 *           type: string
 *           description: Shipping address
 *     DeliveryCodeVerification:
 *       type: object
 *       required:
 *         - orderId
 *         - deliveryCode
 *       properties:
 *         orderId:
 *           type: integer
 *           description: Order ID
 *         deliveryCode:
 *           type: string
 *           description: Delivery verification code
 *     RefundPayment:
 *       type: object
 *       required:
 *         - paymentId
 *         - refundAmount
 *       properties:
 *         paymentId:
 *           type: integer
 *           description: Payment ID
 *         refundAmount:
 *           type: number
 *           format: decimal
 *           description: Refund amount
 */

/**
 * @swagger
 * /api/payments/card:
 *   post:
 *     summary: Process card payment (Visa/Mastercard)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CardPayment'
 *     responses:
 *       200:
 *         description: Card payment processed successfully
 *       400:
 *         description: Invalid input or payment failed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/payments/card', authenticateToken, processCardPaymentController);

/**
 * @swagger
 * /api/payments/mobile-money:
 *   post:
 *     summary: Process mobile money payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MobileMoneyPayment'
 *     responses:
 *       200:
 *         description: Mobile money payment processed successfully
 *       400:
 *         description: Invalid input or payment failed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/payments/mobile-money', authenticateToken, processMobileMoneyPaymentController);

/**
 * @swagger
 * /api/payments/cash:
 *   post:
 *     summary: Process cash on delivery payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CashPayment'
 *     responses:
 *       200:
 *         description: Cash payment processed successfully
 *       400:
 *         description: Invalid input or payment failed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/payments/cash', authenticateToken, processCashPaymentController);

/**
 * @swagger
 * /api/payments/verify-delivery:
 *   post:
 *     summary: Verify delivery code
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryCodeVerification'
 *     responses:
 *       200:
 *         description: Delivery code verified successfully
 *       400:
 *         description: Invalid delivery code
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/payments/verify-delivery', authenticateToken, verifyDeliveryCodeController);

/**
 * @swagger
 * /api/payments/{paymentId}:
 *   get:
 *     summary: Get payment status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *       400:
 *         description: Invalid payment ID
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/payments/:paymentId', authenticateToken, getPaymentStatusController);

/**
 * @swagger
 * /api/payments/refund:
 *   post:
 *     summary: Refund payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefundPayment'
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Invalid input or refund failed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/payments/refund', authenticateToken, refundPaymentController);

/**
 * @swagger
 * /api/payments/mtn/status/{referenceId}:
 *   get:
 *     summary: Check MTN MoMo payment status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: referenceId
 *         required: true
 *         schema:
 *           type: string
 *         description: MTN MoMo reference ID
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *       400:
 *         description: Invalid reference ID
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/payments/mtn/status/:referenceId', authenticateToken, checkMtnMomoPaymentStatusController);

/**
 * @swagger
 * /api/payments/airtel/status/{transactionId}:
 *   get:
 *     summary: Check Airtel Money payment status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Airtel Money transaction ID
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *       400:
 *         description: Invalid transaction ID
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/payments/airtel/status/:transactionId', authenticateToken, checkAirtelMoneyPaymentStatusController);

/**
 * @swagger
 * /api/payments/mtn/callback:
 *   post:
 *     summary: MTN MoMo payment callback
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               referenceId:
 *                 type: string
 *                 description: MTN MoMo reference ID
 *               status:
 *                 type: string
 *                 description: Payment status
 *     responses:
 *       200:
 *         description: Callback processed successfully
 *       400:
 *         description: Invalid callback data
 *       500:
 *         description: Server error
 */
router.post('/payments/mtn/callback', handleMtnMomoCallbackController);

/**
 * @swagger
 * /api/payments/airtel/callback:
 *   post:
 *     summary: Airtel Money payment callback
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transaction:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Airtel transaction ID
 *                   status:
 *                     type: string
 *                     description: Payment status
 *     responses:
 *       200:
 *         description: Callback processed successfully
 *       400:
 *         description: Invalid callback data
 *       500:
 *         description: Server error
 */
router.post('/payments/airtel/callback', handleAirtelMoneyCallbackController);

module.exports = router;