const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { authenticateToken } = require('../middleware/auth');

// Middleware pour vérifier que l'utilisateur est un livreur
const requireDelivery = (req, res, next) => {
  if (req.user.role !== 'delivery') {
    return res.status(403).json({ message: 'Accès réservé aux livreurs' });
  }
  next();
};

router.get('/assigned', authenticateToken, requireDelivery, deliveryController.getAssignedDeliveries);
router.get('/:deliveryId', authenticateToken, requireDelivery, deliveryController.getDeliveryDetails);
router.put('/status', authenticateToken, requireDelivery, deliveryController.updateDeliveryStatus);

module.exports = router;