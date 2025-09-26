const {
  processCardPayment,
  processMobileMoneyPayment,
  processCashPayment,
  verifyDeliveryCode,
  getPaymentStatus,
  refundPayment,
  checkMtnMomoPaymentStatus,
  checkAirtelMoneyPaymentStatus,
  handleMtnMomoCallback,
  handleAirtelMoneyCallback
} = require('../services/paymentService');

// Traiter le paiement par carte
const processCardPaymentController = async (req, res) => {
  try {
    const { orderId, paymentMethodId } = req.body;
    const userId = req.user.id;

    if (!orderId || !paymentMethodId) {
      return res.status(400).json({ message: 'L\'ID de commande et l\'ID de méthode de paiement sont requis' });
    }

    const result = await processCardPayment(orderId, { paymentMethodId });

    if (result.success) {
      res.status(200).json({
        message: 'Paiement par carte traité avec succès',
        paymentIntent: result.paymentIntent,
        payment: result.payment
      });
    } else {
      res.status(400).json({ message: result.error });
    }
  } catch (error) {
    console.error('Erreur de traitement du paiement par carte:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Traiter le paiement par mobile money
const processMobileMoneyPaymentController = async (req, res) => {
  try {
    const { orderId, phoneNumber, provider } = req.body;
    const userId = req.user.id;

    if (!orderId || !phoneNumber) {
      return res.status(400).json({ message: 'L\'ID de commande et le numéro de téléphone sont requis' });
    }

    if (!provider || !['mtn', 'airtel'].includes(provider.toLowerCase())) {
      return res.status(400).json({ message: 'Fournisseur mobile money invalide. Utilisez "mtn" ou "airtel"' });
    }

    const result = await processMobileMoneyPayment(orderId, { phoneNumber, provider });

    if (result.success) {
      res.status(200).json({
        message: result.message,
        payment: result.payment,
        provider: result.provider,
        referenceId: result.referenceId,
        transactionId: result.transactionId
      });
    } else {
      res.status(400).json({ message: result.error });
    }
  } catch (error) {
    console.error('Erreur de traitement du paiement par mobile money:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Traiter le paiement en espèces
const processCashPaymentController = async (req, res) => {
  try {
    const { orderId, shippingAddress } = req.body;
    const userId = req.user.id;

    if (!orderId || !shippingAddress) {
      return res.status(400).json({ message: 'L\'ID de commande et l\'adresse de livraison sont requis' });
    }

    const result = await processCashPayment(orderId, { shippingAddress });

    if (result.success) {
      res.status(200).json({
        message: result.message,
        payment: result.payment,
        deliveryCode: result.deliveryCode,
        qrCodeDataURL: result.qrCodeDataURL
      });
    } else {
      res.status(400).json({ message: result.error });
    }
  } catch (error) {
    console.error('Erreur de traitement du paiement en espèces:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Vérifier le code de livraison
const verifyDeliveryCodeController = async (req, res) => {
  try {
    const { orderId, deliveryCode } = req.body;
    const userId = req.user.id;

    if (!orderId || !deliveryCode) {
      return res.status(400).json({ message: 'L\'ID de commande et le code de livraison sont requis' });
    }

    const result = await verifyDeliveryCode(orderId, deliveryCode);

    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(400).json({ message: result.error });
    }
  } catch (error) {
    console.error('Erreur de vérification du code de livraison:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Obtenir le statut du paiement
const getPaymentStatusController = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    if (!paymentId) {
      return res.status(400).json({ message: 'L\'ID de paiement est requis' });
    }

    const result = await getPaymentStatus(paymentId);

    if (result.success) {
      res.status(200).json({ payment: result.payment });
    } else {
      res.status(400).json({ message: result.error });
    }
  } catch (error) {
    console.error('Erreur d\'obtention du statut du paiement:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Rembourser le paiement
const refundPaymentController = async (req, res) => {
  try {
    const { paymentId, refundAmount } = req.body;
    const userId = req.user.id;

    if (!paymentId || !refundAmount) {
      return res.status(400).json({ message: 'L\'ID de paiement et le montant de remboursement sont requis' });
    }

    const result = await refundPayment(paymentId, refundAmount);

    if (result.success) {
      res.status(200).json({
        message: 'Remboursement traité avec succès',
        refundResult: result.refundResult
      });
    } else {
      res.status(400).json({ message: result.error });
    }
  } catch (error) {
    console.error('Erreur de remboursement du paiement:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Vérifier le statut du paiement MTN MoMo
const checkMtnMomoPaymentStatusController = async (req, res) => {
  try {
    const { referenceId } = req.params;
    const userId = req.user.id;

    if (!referenceId) {
      return res.status(400).json({ message: 'L\'ID de référence MTN MoMo est requis' });
    }

    const result = await checkMtnMomoPaymentStatus(referenceId);

    if (result.success) {
      res.status(200).json({
        message: 'Statut du paiement MTN MoMo récupéré avec succès',
        status: result.status,
        transactionId: result.transactionId
      });
    } else {
      res.status(400).json({ message: result.error });
    }
  } catch (error) {
    console.error('Erreur de vérification du statut MTN MoMo:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Vérifier le statut du paiement Airtel Money
const checkAirtelMoneyPaymentStatusController = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    if (!transactionId) {
      return res.status(400).json({ message: 'L\'ID de transaction Airtel Money est requis' });
    }

    const result = await checkAirtelMoneyPaymentStatus(transactionId);

    if (result.success) {
      res.status(200).json({
        message: 'Statut du paiement Airtel Money récupéré avec succès',
        status: result.status,
        airtelTransactionId: result.airtelTransactionId
      });
    } else {
      res.status(400).json({ message: result.error });
    }
  } catch (error) {
    console.error('Erreur de vérification du statut Airtel Money:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Traiter le callback MTN MoMo
const handleMtnMomoCallbackController = async (req, res) => {
  try {
    const callbackData = req.body;

    if (!callbackData || !callbackData.referenceId || !callbackData.status) {
      return res.status(400).json({ message: 'Données de callback MTN MoMo invalides' });
    }

    const result = await handleMtnMomoCallback(callbackData);

    if (result.success) {
      res.status(200).json({ message: 'Callback MTN MoMo traité avec succès' });
    } else {
      res.status(400).json({ message: result.error });
    }
  } catch (error) {
    console.error('Erreur de traitement du callback MTN MoMo:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Traiter le callback Airtel Money
const handleAirtelMoneyCallbackController = async (req, res) => {
  try {
    const callbackData = req.body;

    if (!callbackData || !callbackData.transaction) {
      return res.status(400).json({ message: 'Données de callback Airtel Money invalides' });
    }

    const result = await handleAirtelMoneyCallback(callbackData);

    if (result.success) {
      res.status(200).json({ message: 'Callback Airtel Money traité avec succès' });
    } else {
      res.status(400).json({ message: result.error });
    }
  } catch (error) {
    console.error('Erreur de traitement du callback Airtel Money:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

module.exports = {
  processCardPaymentController,
  processMobileMoneyPaymentController,
  processCashPaymentController,
  verifyDeliveryCodeController,
  getPaymentStatusController,
  refundPaymentController,
  checkMtnMomoPaymentStatusController,
  checkAirtelMoneyPaymentStatusController,
  handleMtnMomoCallbackController,
  handleAirtelMoneyCallbackController
};