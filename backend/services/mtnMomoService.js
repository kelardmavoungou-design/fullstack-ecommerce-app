const axios = require('axios');
const crypto = require('crypto');
const prisma = require('../config/prisma');

// Configuration MTN MoMo
const MTN_CONFIG = {
  baseUrl: process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com',
  apiKey: process.env.MTN_MOMO_API_KEY,
  apiSecret: process.env.MTN_MOMO_API_SECRET,
  subscriptionKey: process.env.MTN_MOMO_SUBSCRIPTION_KEY,
  targetEnvironment: process.env.MTN_MOMO_ENVIRONMENT || 'sandbox',
  callbackUrl: process.env.MTN_MOMO_CALLBACK_URL || `${process.env.BASE_URL}/api/payments/mtn/callback`
};

// Générer un UUID pour les références
const generateUUID = () => {
  return crypto.randomUUID();
};

// Obtenir le token d'accès MTN MoMo
const getAccessToken = async () => {
  try {
    const auth = Buffer.from(`${MTN_CONFIG.apiKey}:${MTN_CONFIG.apiSecret}`).toString('base64');

    const response = await axios.post(`${MTN_CONFIG.baseUrl}/collection/token/`, {}, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Ocp-Apim-Subscription-Key': MTN_CONFIG.subscriptionKey,
        'Content-Type': 'application/json'
      }
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Erreur lors de l\'obtention du token MTN MoMo:', error.response?.data || error.message);
    throw new Error('Impossible d\'obtenir le token d\'accès MTN MoMo');
  }
};

// Créer une demande de paiement MTN MoMo
const createPaymentRequest = async (orderId, phoneNumber, amount) => {
  try {
    const accessToken = await getAccessToken();
    const referenceId = generateUUID();

    const paymentData = {
      amount: Math.round(amount).toString(),
      currency: 'EUR', // MTN MoMo utilise EUR en sandbox
      externalId: orderId.toString(),
      payer: {
        partyIdType: 'MSISDN',
        partyId: phoneNumber.replace(/^\+/, '') // Retirer le + si présent
      },
      payerMessage: `Paiement commande #${orderId}`,
      payeeNote: 'Paiement SOMBA'
    };

    const response = await axios.post(
      `${MTN_CONFIG.baseUrl}/collection/v1_0/requesttopay`,
      paymentData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': MTN_CONFIG.targetEnvironment,
          'Ocp-Apim-Subscription-Key': MTN_CONFIG.subscriptionKey,
          'Content-Type': 'application/json'
        }
      }
    );

    // Sauvegarder la demande de paiement dans la base de données
    await prisma.mtnPayment.create({
      data: {
        reference_id: referenceId,
        order_id: orderId,
        phone_number: phoneNumber,
        amount: amount,
        status: 'pending',
        currency: 'EUR'
      }
    });

    return {
      success: true,
      referenceId,
      message: 'Demande de paiement MTN MoMo créée avec succès'
    };

  } catch (error) {
    console.error('Erreur lors de la création de la demande de paiement MTN MoMo:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Message:', error.message);

    // Gérer les erreurs spécifiques MTN MoMo
    if (error.response?.status === 409) {
      return {
        success: false,
        error: 'Une demande de paiement existe déjà pour cette commande'
      };
    } else if (error.response?.status === 400) {
      return {
        success: false,
        error: `Données de paiement invalides: ${JSON.stringify(error.response?.data)}`
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || 'Erreur lors de la création de la demande de paiement'
    };
  }
};

// Vérifier le statut du paiement MTN MoMo
const checkPaymentStatus = async (referenceId) => {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.get(
      `${MTN_CONFIG.baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Target-Environment': MTN_CONFIG.targetEnvironment,
          'Ocp-Apim-Subscription-Key': MTN_CONFIG.subscriptionKey
        }
      }
    );

    const status = response.data.status;
    const financialTransactionId = response.data.financialTransactionId;

    // Mettre à jour le statut dans la base de données
    await prisma.mtnPayment.update({
      where: { reference_id: referenceId },
      data: {
        status: status.toLowerCase(),
        transaction_id: financialTransactionId,
        updated_at: new Date()
      }
    });

    return {
      success: true,
      status: status.toLowerCase(),
      transactionId: financialTransactionId
    };

  } catch (error) {
    console.error('Erreur lors de la vérification du statut MTN MoMo:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Erreur lors de la vérification du statut'
    };
  }
};

// Traiter le callback MTN MoMo
const handleCallback = async (callbackData) => {
  try {
    const { referenceId, status } = callbackData;

    // Mettre à jour le paiement dans la base de données
    const payment = await prisma.mtnPayment.update({
      where: { reference_id: referenceId },
      data: {
        status: status.toLowerCase(),
        updated_at: new Date()
      },
      include: { order: true }
    });

    // Si le paiement est réussi, mettre à jour la commande
    if (status.toLowerCase() === 'successful' || status.toLowerCase() === 'success') {
      await prisma.order.update({
        where: { id: payment.order_id },
        data: { status: 'paid' }
      });

      // Créer l'enregistrement de paiement principal
      await prisma.payment.create({
        data: {
          order_id: payment.order_id,
          amount: payment.amount,
          payment_method: 'mtn_momo',
          transaction_id: payment.transaction_id || referenceId,
          status: 'completed'
        }
      });

      // Appliquer la commission
      const { applyCommission } = require('./paymentService');
      await applyCommission(payment.order_id);
    }

    return { success: true };

  } catch (error) {
    console.error('Erreur lors du traitement du callback MTN MoMo:', error);
    return { success: false, error: error.message };
  }
};

// Obtenir les détails du paiement MTN MoMo
const getPaymentDetails = async (referenceId) => {
  try {
    const payment = await prisma.mtnPayment.findUnique({
      where: { reference_id: referenceId },
      include: { order: true }
    });

    if (!payment) {
      throw new Error('Paiement MTN MoMo non trouvé');
    }

    return {
      success: true,
      payment
    };

  } catch (error) {
    console.error('Erreur lors de l\'obtention des détails MTN MoMo:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  createPaymentRequest,
  checkPaymentStatus,
  handleCallback,
  getPaymentDetails,
  getAccessToken
};