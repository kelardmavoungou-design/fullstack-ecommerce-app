const axios = require('axios');
const crypto = require('crypto');
const prisma = require('../config/prisma');

// Configuration Airtel Money
const AIRTEL_CONFIG = {
  baseUrl: process.env.AIRTEL_MONEY_BASE_URL || 'https://openapi.airtel.africa',
  clientId: process.env.AIRTEL_MONEY_CLIENT_ID,
  clientSecret: process.env.AIRTEL_MONEY_CLIENT_SECRET,
  environment: process.env.AIRTEL_MONEY_ENVIRONMENT || 'sandbox',
  callbackUrl: process.env.AIRTEL_MONEY_CALLBACK_URL || `${process.env.BASE_URL}/api/payments/airtel/callback`,
  country: 'UG', // Ouganda par défaut
  currency: 'UGX' // Shilling ougandais
};

// Générer un ID de transaction unique
const generateTransactionId = () => {
  return `TXN_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};

// Obtenir le token d'accès Airtel Money
const getAccessToken = async () => {
  try {
    const auth = Buffer.from(`${AIRTEL_CONFIG.clientId}:${AIRTEL_CONFIG.clientSecret}`).toString('base64');

    const response = await axios.post(`${AIRTEL_CONFIG.baseUrl}/auth/oauth2/token`, {
      grant_type: 'client_credentials'
    }, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Erreur lors de l\'obtention du token Airtel Money:', error.response?.data || error.message);
    throw new Error('Impossible d\'obtenir le token d\'accès Airtel Money');
  }
};

// Créer une demande de paiement Airtel Money
const createPaymentRequest = async (orderId, phoneNumber, amount) => {
  try {
    const accessToken = await getAccessToken();
    const transactionId = generateTransactionId();

    // Nettoyer le numéro de téléphone (doit être au format international sans +)
    const cleanPhoneNumber = phoneNumber.replace(/^\+/, '').replace(/\s/g, '');

    const paymentData = {
      reference: transactionId,
      subscriber: {
        country: AIRTEL_CONFIG.country,
        currency: AIRTEL_CONFIG.currency,
        msisdn: cleanPhoneNumber
      },
      transaction: {
        amount: amount,
        country: AIRTEL_CONFIG.country,
        currency: AIRTEL_CONFIG.currency,
        id: transactionId
      }
    };

    console.log('📤 Airtel Money Request Data:', paymentData);

    const response = await axios.post(
      `${AIRTEL_CONFIG.baseUrl}/merchant/v1/payments/`,
      paymentData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('✅ Airtel Money Response:', response.status, response.data);

    // Sauvegarder la demande de paiement dans la base de données
    await prisma.airtelPayment.create({
      data: {
        transaction_id: transactionId,
        order_id: orderId,
        phone_number: phoneNumber,
        amount: amount,
        status: 'pending',
        currency: AIRTEL_CONFIG.currency
      }
    });

    return {
      success: true,
      transactionId,
      message: 'Demande de paiement Airtel Money créée avec succès. Veuillez approuver le paiement sur votre téléphone.'
    };

  } catch (error) {
    console.error('❌ Erreur Airtel Money:', error.response?.status, error.response?.data);

    // Gérer les erreurs spécifiques Airtel Money
    if (error.response?.status === 400) {
      return {
        success: false,
        error: 'Données de paiement invalides ou numéro de téléphone incorrect'
      };
    } else if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentification échouée'
      };
    } else if (error.response?.status === 403) {
      return {
        success: false,
        error: 'Accès refusé - vérifiez vos permissions'
      };
    } else if (error.response?.status === 500) {
      return {
        success: false,
        error: 'Erreur du serveur Airtel Money'
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || 'Erreur lors de la création de la demande de paiement'
    };
  }
};

// Vérifier le statut du paiement Airtel Money
const checkPaymentStatus = async (transactionId) => {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.get(
      `${AIRTEL_CONFIG.baseUrl}/merchant/v1/payments/${transactionId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    console.log('📊 Airtel Money Status Response:', response.data);

    const status = response.data.data?.transaction?.status || response.data.status;
    const airtelTransactionId = response.data.data?.transaction?.id || response.data.transaction?.id;

    // Mettre à jour le statut dans la base de données
    await prisma.airtelPayment.update({
      where: { transaction_id: transactionId },
      data: {
        status: status.toLowerCase(),
        airtel_transaction_id: airtelTransactionId,
        updated_at: new Date()
      }
    });

    return {
      success: true,
      status: status.toLowerCase(),
      airtelTransactionId
    };

  } catch (error) {
    console.error('❌ Erreur vérification statut Airtel Money:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Erreur lors de la vérification du statut'
    };
  }
};

// Traiter le callback Airtel Money
const handleCallback = async (callbackData) => {
  try {
    console.log('📞 Airtel Money Callback reçu:', callbackData);

    // La structure du callback peut varier selon la documentation
    const transactionId = callbackData.transaction?.id || callbackData.reference;
    const status = callbackData.transaction?.status || callbackData.status;

    if (!transactionId || !status) {
      throw new Error('Données de callback Airtel Money invalides');
    }

    // Trouver le paiement dans la base de données
    const payment = await prisma.airtelPayment.findUnique({
      where: { transaction_id: transactionId },
      include: { order: true }
    });

    if (!payment) {
      throw new Error('Paiement Airtel Money non trouvé');
    }

    // Mettre à jour le paiement dans la base de données
    await prisma.airtelPayment.update({
      where: { transaction_id: transactionId },
      data: {
        status: status.toLowerCase(),
        airtel_transaction_id: callbackData.transaction?.id || transactionId,
        updated_at: new Date()
      }
    });

    // Si le paiement est réussi, mettre à jour la commande
    if (status.toLowerCase() === 'success' || status.toLowerCase() === 'successful' || status.toLowerCase() === 'completed') {
      await prisma.order.update({
        where: { id: payment.order_id },
        data: { status: 'paid' }
      });

      // Créer l'enregistrement de paiement principal
      await prisma.payment.create({
        data: {
          order_id: payment.order_id,
          amount: payment.amount,
          payment_method: 'airtel_money',
          transaction_id: callbackData.transaction?.id || transactionId,
          status: 'completed'
        }
      });

      // Appliquer la commission
      const { applyCommission } = require('./paymentService');
      await applyCommission(payment.order_id);

      console.log('✅ Paiement Airtel Money traité avec succès');
    }

    return { success: true };

  } catch (error) {
    console.error('❌ Erreur traitement callback Airtel Money:', error);
    return { success: false, error: error.message };
  }
};

// Obtenir les détails du paiement Airtel Money
const getPaymentDetails = async (transactionId) => {
  try {
    const payment = await prisma.airtelPayment.findUnique({
      where: { transaction_id: transactionId },
      include: { order: true }
    });

    if (!payment) {
      throw new Error('Paiement Airtel Money non trouvé');
    }

    return {
      success: true,
      payment
    };

  } catch (error) {
    console.error('Erreur lors de l\'obtention des détails Airtel Money:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Obtenir l'historique des transactions
const getTransactionHistory = async (limit = 50, offset = 0) => {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.get(
      `${AIRTEL_CONFIG.baseUrl}/merchant/v1/payments?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    return {
      success: true,
      transactions: response.data.transactions || []
    };

  } catch (error) {
    console.error('Erreur lors de l\'obtention de l\'historique Airtel Money:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Erreur lors de l\'obtention de l\'historique'
    };
  }
};

module.exports = {
  createPaymentRequest,
  checkPaymentStatus,
  handleCallback,
  getPaymentDetails,
  getTransactionHistory,
  getAccessToken
};