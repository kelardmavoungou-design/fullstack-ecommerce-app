const axios = require('axios');
const crypto = require('crypto');

// Configuration MTN MoMo Sandbox
const MTN_CONFIG = {
  baseUrl: 'https://sandbox.momodeveloper.mtn.com',
  subscriptionKey: '1a4ec41e815e4ef794f54d6e716d095d', // Primary Key
  callbackUrl: 'http://localhost:4000/api/payments/mtn/callback'
};

// Générer un UUID
const generateUUID = () => {
  return crypto.randomUUID();
};

// Étape 1: Créer un API User
const createApiUser = async () => {
  try {
    const uuid = generateUUID();
    console.log('🔹 Étape 1: Création de l\'API User...');
    console.log('UUID généré:', uuid);

    const response = await axios.post(`${MTN_CONFIG.baseUrl}/v1_0/apiuser`, {
      providerCallbackHost: MTN_CONFIG.callbackUrl
    }, {
      headers: {
        'Ocp-Apim-Subscription-Key': MTN_CONFIG.subscriptionKey,
        'X-Reference-Id': uuid,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ API User créé avec succès!');
    console.log('UUID de l\'API User:', uuid);
    return uuid;

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'API User:', error.response?.data || error.message);
    throw error;
  }
};

// Étape 2: Générer une API Key pour l'API User
const generateApiKey = async (apiUserId) => {
  try {
    console.log('🔹 Étape 2: Génération de l\'API Key...');

    const response = await axios.post(`${MTN_CONFIG.baseUrl}/v1_0/apiuser/${apiUserId}/apikey`, {}, {
      headers: {
        'Ocp-Apim-Subscription-Key': MTN_CONFIG.subscriptionKey
      }
    });

    const apiKey = response.data.apiKey;
    console.log('✅ API Key générée avec succès!');
    console.log('API Key:', apiKey);
    return apiKey;

  } catch (error) {
    console.error('❌ Erreur lors de la génération de l\'API Key:', error.response?.data || error.message);
    throw error;
  }
};

// Étape 3: Obtenir un Access Token OAuth 2.0
const getAccessToken = async (apiUserId, apiKey) => {
  try {
    console.log('🔹 Étape 3: Obtention du token d\'accès...');

    const auth = Buffer.from(`${apiUserId}:${apiKey}`).toString('base64');

    const response = await axios.post(`${MTN_CONFIG.baseUrl}/collection/token/`, {}, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Ocp-Apim-Subscription-Key': MTN_CONFIG.subscriptionKey,
        'Content-Type': 'application/json'
      }
    });

    const accessToken = response.data.access_token;
    console.log('✅ Token d\'accès obtenu avec succès!');
    console.log('Access Token:', accessToken);
    return accessToken;

  } catch (error) {
    console.error('❌ Erreur lors de l\'obtention du token:', error.response?.data || error.message);
    throw error;
  }
};

// Étape 4: Tester un paiement (RequestToPay)
const testRequestToPay = async (accessToken) => {
  try {
    console.log('🔹 Étape 4: Test du paiement RequestToPay...');

    const transactionId = generateUUID();
    const paymentData = {
      amount: "1000",
      currency: "EUR",
      externalId: "123456",
      payer: {
        partyIdType: "MSISDN",
        partyId: "46733123453" // Numéro de test MTN
      },
      payerMessage: "Paiement test",
      payeeNote: "Achat produit"
    };

    const response = await axios.post(`${MTN_CONFIG.baseUrl}/collection/v1_0/requesttopay`, paymentData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Reference-Id': transactionId,
        'X-Target-Environment': 'sandbox',
        'Ocp-Apim-Subscription-Key': MTN_CONFIG.subscriptionKey,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Demande de paiement créée avec succès!');
    console.log('Transaction ID:', transactionId);
    console.log('Status:', response.status);

    // Vérifier le statut après quelques secondes
    setTimeout(async () => {
      await checkPaymentStatus(accessToken, transactionId);
    }, 5000);

    return transactionId;

  } catch (error) {
    console.error('❌ Erreur lors du test RequestToPay:', error.response?.data || error.message);
    throw error;
  }
};

// Vérifier le statut du paiement
const checkPaymentStatus = async (accessToken, transactionId) => {
  try {
    console.log('🔹 Vérification du statut du paiement...');

    const response = await axios.get(`${MTN_CONFIG.baseUrl}/collection/v1_0/requesttopay/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Target-Environment': 'sandbox',
        'Ocp-Apim-Subscription-Key': MTN_CONFIG.subscriptionKey
      }
    });

    console.log('✅ Statut du paiement vérifié!');
    console.log('Status:', response.data.status);
    console.log('Transaction ID financier:', response.data.financialTransactionId || 'N/A');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du statut:', error.response?.data || error.message);
  }
};

// Fonction principale pour exécuter tout le flow
const setupMtnMomo = async () => {
  try {
    console.log('🚀 Démarrage de la configuration MTN MoMo Sandbox...\n');

    // Étape 1: Créer API User
    const apiUserId = await createApiUser();
    console.log('');

    // Étape 2: Générer API Key
    const apiKey = await generateApiKey(apiUserId);
    console.log('');

    // Étape 3: Obtenir Access Token
    const accessToken = await getAccessToken(apiUserId, apiKey);
    console.log('');

    // Étape 4: Tester RequestToPay
    await testRequestToPay(accessToken);
    console.log('');

    console.log('🎉 Configuration MTN MoMo terminée avec succès!');
    console.log('\n📝 Variables à ajouter dans votre .env:');
    console.log(`MTN_MOMO_API_KEY=${apiUserId}`);
    console.log(`MTN_MOMO_API_SECRET=${apiKey}`);
    console.log(`MTN_MOMO_SUBSCRIPTION_KEY=${MTN_CONFIG.subscriptionKey}`);
    console.log('MTN_MOMO_ENVIRONMENT=sandbox');
    console.log(`MTN_MOMO_CALLBACK_URL=${MTN_CONFIG.callbackUrl}`);

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error.message);
    process.exit(1);
  }
};

// Exécuter le script
if (require.main === module) {
  setupMtnMomo();
}

module.exports = {
  setupMtnMomo,
  createApiUser,
  generateApiKey,
  getAccessToken,
  testRequestToPay,
  checkPaymentStatus
};