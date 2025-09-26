const axios = require('axios');
const crypto = require('crypto');
const prisma = require('../config/prisma');

// Configuration MTN MoMo Disbursement
const MTN_DISBURSEMENT_CONFIG = {
  baseUrl: process.env.MTN_DISBURSEMENT_BASE_URL || 'https://sandbox.momodeveloper.mtn.com',
  apiKey: process.env.MTN_DISBURSEMENT_API_KEY,
  apiSecret: process.env.MTN_DISBURSEMENT_API_SECRET,
  subscriptionKey: process.env.MTN_DISBURSEMENT_SUBSCRIPTION_KEY,
  targetEnvironment: process.env.MTN_DISBURSEMENT_ENVIRONMENT || 'sandbox',
  callbackUrl: process.env.MTN_DISBURSEMENT_CALLBACK_URL || `${process.env.BASE_URL}/api/payments/mtn/disbursement/callback`
};

// Générer un UUID pour les références
const generateUUID = () => {
  return crypto.randomUUID();
};

// Obtenir le token d'accès MTN MoMo Disbursement
const getDisbursementAccessToken = async () => {
  try {
    const auth = Buffer.from(`${MTN_DISBURSEMENT_CONFIG.apiKey}:${MTN_DISBURSEMENT_CONFIG.apiSecret}`).toString('base64');

    const response = await axios.post(`${MTN_DISBURSEMENT_CONFIG.baseUrl}/disbursement/token/`, {}, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Ocp-Apim-Subscription-Key': MTN_DISBURSEMENT_CONFIG.subscriptionKey,
        'Content-Type': 'application/json'
      }
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Erreur lors de l\'obtention du token MTN MoMo Disbursement:', error.response?.data || error.message);
    throw new Error('Impossible d\'obtenir le token d\'accès MTN MoMo Disbursement');
  }
};

// Transférer de l'argent (Disbursement Transfer)
const transferMoney = async (recipientPhoneNumber, amount, description = 'Transfert SOMBA') => {
  try {
    const accessToken = await getDisbursementAccessToken();
    const referenceId = generateUUID();

    const transferData = {
      amount: Math.round(amount).toString(),
      currency: 'EUR', // MTN MoMo utilise EUR en sandbox
      externalId: `transfer_${Date.now()}`,
      payee: {
        partyIdType: 'MSISDN',
        partyId: recipientPhoneNumber.replace(/^\+/, '') // Retirer le + si présent
      },
      payerMessage: description,
      payeeNote: 'Réception de fonds SOMBA'
    };

    const response = await axios.post(
      `${MTN_DISBURSEMENT_CONFIG.baseUrl}/disbursement/v1_0/transfer`,
      transferData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': MTN_DISBURSEMENT_CONFIG.targetEnvironment,
          'Ocp-Apim-Subscription-Key': MTN_DISBURSEMENT_CONFIG.subscriptionKey,
          'Content-Type': 'application/json'
        }
      }
    );

    // Sauvegarder le transfert dans la base de données
    await prisma.mtnDisbursement.create({
      data: {
        reference_id: referenceId,
        recipient_phone: recipientPhoneNumber,
        amount: amount,
        description: description,
        status: 'pending',
        currency: 'EUR',
        transfer_type: 'transfer'
      }
    });

    return {
      success: true,
      referenceId,
      message: 'Transfert MTN MoMo Disbursement initié avec succès'
    };

  } catch (error) {
    console.error('Erreur lors du transfert MTN MoMo Disbursement:', error.response?.data || error.message);

    // Gérer les erreurs spécifiques MTN MoMo
    if (error.response?.status === 409) {
      return {
        success: false,
        error: 'Un transfert existe déjà avec ces paramètres'
      };
    } else if (error.response?.status === 400) {
      return {
        success: false,
        error: 'Données de transfert invalides'
      };
    } else if (error.response?.status === 500) {
      return {
        success: false,
        error: 'Erreur interne du service MTN MoMo'
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || 'Erreur lors du transfert d\'argent'
    };
  }
};

// Vérifier le statut du transfert
const checkTransferStatus = async (referenceId) => {
  try {
    const accessToken = await getDisbursementAccessToken();

    const response = await axios.get(
      `${MTN_DISBURSEMENT_CONFIG.baseUrl}/disbursement/v1_0/transfer/${referenceId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Target-Environment': MTN_DISBURSEMENT_CONFIG.targetEnvironment,
          'Ocp-Apim-Subscription-Key': MTN_DISBURSEMENT_CONFIG.subscriptionKey
        }
      }
    );

    const status = response.data.status;
    const financialTransactionId = response.data.financialTransactionId;

    // Mettre à jour le statut dans la base de données
    await prisma.mtnDisbursement.update({
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
    console.error('Erreur lors de la vérification du transfert MTN MoMo:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Erreur lors de la vérification du transfert'
    };
  }
};

// Traiter le callback MTN MoMo Disbursement
const handleDisbursementCallback = async (callbackData) => {
  try {
    const { referenceId, status } = callbackData;

    // Mettre à jour le transfert dans la base de données
    const disbursement = await prisma.mtnDisbursement.update({
      where: { reference_id: referenceId },
      data: {
        status: status.toLowerCase(),
        updated_at: new Date()
      },
      include: { order: true }
    });

    return { success: true };

  } catch (error) {
    console.error('Erreur lors du traitement du callback MTN MoMo Disbursement:', error);
    return { success: false, error: error.message };
  }
};

// Obtenir les détails du transfert
const getTransferDetails = async (referenceId) => {
  try {
    const transfer = await prisma.mtnDisbursement.findUnique({
      where: { reference_id: referenceId }
    });

    if (!transfer) {
      throw new Error('Transfert MTN MoMo Disbursement non trouvé');
    }

    return {
      success: true,
      transfer
    };

  } catch (error) {
    console.error('Erreur lors de l\'obtention des détails du transfert:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Transfert pour remboursement
const refundPayment = async (orderId, refundAmount, reason = 'Remboursement') => {
  try {
    // Récupérer les détails de la commande pour obtenir le numéro du destinataire
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true }
    });

    if (!order) {
      throw new Error('Commande non trouvée');
    }

    const result = await transferMoney(
      order.buyer.phone_number,
      refundAmount,
      `${reason} - Commande #${orderId}`
    );

    if (result.success) {
      // Créer un enregistrement de remboursement
      await prisma.refund.create({
        data: {
          order_id: orderId,
          amount: refundAmount,
          reason: reason,
          status: 'processed',
          disbursement_reference: result.referenceId
        }
      });
    }

    return result;

  } catch (error) {
    console.error('Erreur lors du remboursement:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Transfert de commission à un vendeur/partenaire
const payCommission = async (sellerId, commissionAmount, description = 'Commission vendeur') => {
  try {
    // Récupérer les détails du vendeur
    const seller = await prisma.user.findUnique({
      where: { id: sellerId }
    });

    if (!seller) {
      throw new Error('Vendeur non trouvé');
    }

    const result = await transferMoney(
      seller.phone_number,
      commissionAmount,
      description
    );

    if (result.success) {
      // Créer un enregistrement de commission
      await prisma.commission.create({
        data: {
          seller_id: sellerId,
          amount: commissionAmount,
          description: description,
          status: 'paid',
          disbursement_reference: result.referenceId
        }
      });
    }

    return result;

  } catch (error) {
    console.error('Erreur lors du paiement de commission:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  transferMoney,
  checkTransferStatus,
  handleDisbursementCallback,
  getTransferDetails,
  refundPayment,
  payCommission,
  getDisbursementAccessToken
};