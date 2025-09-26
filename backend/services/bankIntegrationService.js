const axios = require('axios');

// Configuration des APIs bancaires
const BANK_CONFIGS = {
  orange_money: {
    name: 'Orange Money',
    baseUrl: process.env.ORANGE_MONEY_API_URL || 'https://api.orange.com',
    clientId: process.env.ORANGE_MONEY_CLIENT_ID,
    clientSecret: process.env.ORANGE_MONEY_CLIENT_SECRET,
    merchantId: process.env.ORANGE_MONEY_MERCHANT_ID
  },
  mtn_money: {
    name: 'MTN Mobile Money',
    baseUrl: process.env.MTN_MONEY_API_URL || 'https://api.mtn.com',
    apiKey: process.env.MTN_MONEY_API_KEY,
    apiSecret: process.env.MTN_MONEY_API_SECRET,
    subscriptionKey: process.env.MTN_MONEY_SUBSCRIPTION_KEY
  },
  moov_money: {
    name: 'Moov Money',
    baseUrl: process.env.MOOV_MONEY_API_URL || 'https://api.moov-africa.com',
    apiKey: process.env.MOOV_MONEY_API_KEY,
    apiSecret: process.env.MOOV_MONEY_API_SECRET
  }
};

// Obtenir un token d'accès pour Orange Money
const getOrangeMoneyToken = async () => {
  try {
    const config = BANK_CONFIGS.orange_money;
    const response = await axios.post(`${config.baseUrl}/oauth/v3/token`, {
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Erreur lors de l\'obtention du token Orange Money:', error);
    throw new Error('Impossible d\'obtenir le token d\'accès Orange Money');
  }
};

// Obtenir un token d'accès pour MTN Money
const getMtnMoneyToken = async () => {
  try {
    const config = BANK_CONFIGS.mtn_money;
    const response = await axios.post(`${config.baseUrl}/collection/token/`, {}, {
      headers: {
        'Ocp-Apim-Subscription-Key': config.subscriptionKey,
        'Authorization': `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64')}`
      }
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Erreur lors de l\'obtention du token MTN Money:', error);
    throw new Error('Impossible d\'obtenir le token d\'accès MTN Money');
  }
};

// Effectuer un transfert Orange Money
const transferOrangeMoney = async (recipientPhone, amount, reference) => {
  try {
    const token = await getOrangeMoneyToken();
    const config = BANK_CONFIGS.orange_money;

    const response = await axios.post(`${config.baseUrl}/orange-money-webpay/dev/v1/webpayment`, {
      merchant_key: config.merchantId,
      currency: 'XAF',
      order_id: reference,
      amount: amount,
      return_url: `${process.env.FRONTEND_URL}/withdrawal/callback`,
      cancel_url: `${process.env.FRONTEND_URL}/withdrawal/cancel`,
      notif_url: `${process.env.BACKEND_URL}/api/webhooks/orange-money`,
      lang: 'fr',
      reference: reference
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      transactionId: response.data.pay_token,
      paymentUrl: response.data.payment_url,
      status: 'pending'
    };
  } catch (error) {
    console.error('Erreur lors du transfert Orange Money:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// Effectuer un transfert MTN Money
const transferMtnMoney = async (recipientPhone, amount, reference) => {
  try {
    const token = await getMtnMoneyToken();
    const config = BANK_CONFIGS.mtn_money;

    const response = await axios.post(`${config.baseUrl}/collection/v1_0/requesttopay`, {
      amount: amount.toString(),
      currency: 'XAF',
      externalId: reference,
      payer: {
        partyIdType: 'MSISDN',
        partyId: recipientPhone
      },
      payerMessage: `Retrait SOMBA - ${reference}`,
      payeeNote: 'Retrait depuis SOMBA'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Reference-Id': reference,
        'X-Target-Environment': 'sandbox', // ou 'production'
        'Ocp-Apim-Subscription-Key': config.subscriptionKey,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      transactionId: reference,
      status: 'pending'
    };
  } catch (error) {
    console.error('Erreur lors du transfert MTN Money:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// Effectuer un transfert Moov Money
const transferMoovMoney = async (recipientPhone, amount, reference) => {
  try {
    const config = BANK_CONFIGS.moov_money;

    const response = await axios.post(`${config.baseUrl}/v1/transfers`, {
      amount: amount,
      currency: 'XAF',
      recipient: recipientPhone,
      reference: reference,
      description: `Retrait SOMBA - ${reference}`
    }, {
      headers: {
        'Authorization': `Bearer ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      transactionId: response.data.transaction_id,
      status: 'pending'
    };
  } catch (error) {
    console.error('Erreur lors du transfert Moov Money:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// Fonction principale pour effectuer un transfert bancaire
const performBankTransfer = async (provider, recipientPhone, amount, reference) => {
  switch (provider) {
    case 'orange_money':
      return await transferOrangeMoney(recipientPhone, amount, reference);
    case 'mtn_money':
      return await transferMtnMoney(recipientPhone, amount, reference);
    case 'moov_money':
      return await transferMoovMoney(recipientPhone, amount, reference);
    default:
      return {
        success: false,
        error: 'Fournisseur bancaire non supporté'
      };
  }
};

// Vérifier le statut d'une transaction
const checkTransactionStatus = async (provider, transactionId) => {
  try {
    let response;

    switch (provider) {
      case 'orange_money':
        const orangeToken = await getOrangeMoneyToken();
        response = await axios.get(`${BANK_CONFIGS.orange_money.baseUrl}/orange-money-webpay/dev/v1/transaction/${transactionId}`, {
          headers: { 'Authorization': `Bearer ${orangeToken}` }
        });
        return response.data.status;

      case 'mtn_money':
        const mtnToken = await getMtnMoneyToken();
        response = await axios.get(`${BANK_CONFIGS.mtn_money.baseUrl}/collection/v1_0/requesttopay/${transactionId}`, {
          headers: {
            'Authorization': `Bearer ${mtnToken}`,
            'X-Target-Environment': 'sandbox',
            'Ocp-Apim-Subscription-Key': BANK_CONFIGS.mtn_money.subscriptionKey
          }
        });
        return response.data.status;

      case 'moov_money':
        response = await axios.get(`${BANK_CONFIGS.moov_money.baseUrl}/v1/transfers/${transactionId}`, {
          headers: {
            'Authorization': `Bearer ${Buffer.from(`${BANK_CONFIGS.moov_money.apiKey}:${BANK_CONFIGS.moov_money.apiSecret}`).toString('base64')}`
          }
        });
        return response.data.status;

      default:
        throw new Error('Fournisseur non supporté');
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error);
    return 'unknown';
  }
};

// Valider un numéro de téléphone selon le fournisseur
const validatePhoneNumber = (phoneNumber, provider) => {
  // Supprimer tous les caractères non numériques
  const cleanNumber = phoneNumber.replace(/\D/g, '');

  // Vérifier selon le fournisseur
  switch (provider) {
    case 'orange_money':
      // Orange Côte d'Ivoire: commence par 07 ou +22507
      return /^(\+225)?07\d{7}$/.test(phoneNumber);
    case 'mtn_money':
      // MTN Côte d'Ivoire: commence par 05, 06, 07 ou +22505, +22506, +22507
      return /^(\+225)?0[567]\d{7}$/.test(phoneNumber);
    case 'moov_money':
      // Moov Côte d'Ivoire: commence par 01, 02, 04 ou +22501, +22502, +22504
      return /^(\+225)?0[124]\d{7}$/.test(phoneNumber);
    default:
      return false;
  }
};

module.exports = {
  performBankTransfer,
  checkTransactionStatus,
  validatePhoneNumber,
  BANK_CONFIGS
};