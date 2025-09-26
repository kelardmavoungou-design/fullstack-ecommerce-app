const axios = require('axios');
const crypto = require('crypto');

// Configuration MTN MoMo Disbursement Sandbox
const MTN_CONFIG = {
  baseUrl: 'https://sandbox.momodeveloper.mtn.com',
  subscriptionKey: 'b67be865614d4809ab5c14bf3c1fbe8b', // Primary Key pour Disbursement
  callbackUrl: 'http://localhost:4000/api/payments/mtn/disbursement/callback'
};

// Générer un UUID
const generateUUID = () => {
  return crypto.randomUUID();
};

// Étape 1: Créer un API User pour Disbursement
const createApiUser = async () => {
  try {
    const uuid = generateUUID();
    console.log('🔹 Étape 1: Création de l\'API User Disbursement...');
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

    console.log('✅ API User Disbursement créé avec succès!');
    console.log('UUID de l\'API User:', uuid);
    return uuid;

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'API User Disbursement:', error.response?.data || error.message);
    throw error;
  }
};

// Étape 2: Générer une API Key pour l'API User Disbursement
const generateApiKey = async (apiUserId) => {
  try {
    console.log('🔹 Étape 2: Génération de l\'API Key Disbursement...');

    const response = await axios.post(`${MTN_CONFIG.baseUrl}/v1_0/apiuser/${apiUserId}/apikey`, {}, {
      headers: {
        'Ocp-Apim-Subscription-Key': MTN_CONFIG.subscriptionKey
      }
    });

    const apiKey = response.data.apiKey;
    console.log('✅ API Key Disbursement générée avec succès!');
    console.log('API Key:', apiKey);
    return apiKey;

  } catch (error) {
    console.error('❌ Erreur lors de la génération de l\'API Key Disbursement:', error.response?.data || error.message);
    throw error;
  }
};

// Étape 3: Obtenir un Access Token OAuth 2.0 pour Disbursement
const getAccessToken = async (apiUserId, apiKey) => {
  try {
    console.log('🔹 Étape 3: Obtention du token d\'accès Disbursement...');

    const auth = Buffer.from(`${apiUserId}:${apiKey}`).toString('base64');

    const response = await axios.post(`${MTN_CONFIG.baseUrl}/disbursement/token/`, {}, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Ocp-Apim-Subscription-Key': MTN_CONFIG.subscriptionKey,
        'Content-Type': 'application/json'
      }
    });

    const accessToken = response.data.access_token;
    console.log('✅ Token d\'accès Disbursement obtenu avec succès!');
    console.log('Access Token:', accessToken);
    return accessToken;

  } catch (error) {
    console.error('❌ Erreur lors de l\'obtention du token Disbursement:', error.response?.data || error.message);
    throw error;
  }
};

// Étape 4: Tester un transfert d'argent (Transfer)
const testTransfer = async (accessToken) => {
  try {
    console.log('🔹 Étape 4: Test du transfert d\'argent...');

    const transactionId = generateUUID();
    const transferData = {
      amount: "500",
      currency: "EUR",
      externalId: "test_transfer_123",
      payee: {
        partyIdType: "MSISDN",
        partyId: "46733123453" // Numéro de test MTN
      },
      payerMessage: "Test transfert Disbursement",
      payeeNote: "Réception test"
    };

    const response = await axios.post(`${MTN_CONFIG.baseUrl}/disbursement/v1_0/transfer`, transferData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Reference-Id': transactionId,
        'X-Target-Environment': 'sandbox',
        'Ocp-Apim-Subscription-Key': MTN_CONFIG.subscriptionKey,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Transfert d\'argent créé avec succès!');
    console.log('Transaction ID:', transactionId);
    console.log('Status:', response.status);

    // Vérifier le statut après quelques secondes
    setTimeout(async () => {
      await checkTransferStatus(accessToken, transactionId);
    }, 5000);

    return transactionId;

  } catch (error) {
    console.error('❌ Erreur lors du test de transfert:', error.response?.data || error.message);
    throw error;
  }
};

// Vérifier le statut du transfert
const checkTransferStatus = async (accessToken, transactionId) => {
  try {
    console.log('🔹 Vérification du statut du transfert...');

    const response = await axios.get(`${MTN_CONFIG.baseUrl}/disbursement/v1_0/transfer/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Target-Environment': 'sandbox',
        'Ocp-Apim-Subscription-Key': MTN_CONFIG.subscriptionKey
      }
    });

    console.log('✅ Statut du transfert vérifié!');
    console.log('Status:', response.data.status);
    console.log('Transaction ID financier:', response.data.financialTransactionId || 'N/A');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du statut:', error.response?.data || error.message);
  }
};

// Fonction principale pour exécuter tout le flow Disbursement
const setupMtnMomoDisbursement = async () => {
  try {
    console.log('🚀 Démarrage de la configuration MTN MoMo Disbursement Sandbox...\n');

    // Étape 1: Créer API User
    const apiUserId = await createApiUser();
    console.log('');

    // Étape 2: Générer API Key
    const apiKey = await generateApiKey(apiUserId);
    console.log('');

    // Étape 3: Obtenir Access Token
    const accessToken = await getAccessToken(apiUserId, apiKey);
    console.log('');

    // Étape 4: Tester Transfer
    await testTransfer(accessToken);
    console.log('');

    console.log('🎉 Configuration MTN MoMo Disbursement terminée avec succès!');
    console.log('\n📝 Variables à ajouter dans votre .env pour Disbursement:');
    console.log(`MTN_DISBURSEMENT_API_KEY=${apiUserId}`);
    console.log(`MTN_DISBURSEMENT_API_SECRET=${apiKey}`);
    console.log(`MTN_DISBURSEMENT_SUBSCRIPTION_KEY=${MTN_CONFIG.subscriptionKey}`);
    console.log('MTN_DISBURSEMENT_ENVIRONMENT=sandbox');
    console.log(`MTN_DISBURSEMENT_CALLBACK_URL=${MTN_CONFIG.callbackUrl}`);

  } catch (error) {
    console.error('❌ Erreur lors de la configuration Disbursement:', error.message);
    process.exit(1);
  }
};

// Exécuter le script
if (require.main === module) {
  setupMtnMomoDisbursement();
}

module.exports = {
  setupMtnMomoDisbursement,
  createApiUser,
  generateApiKey,
  getAccessToken,
  testTransfer,
  checkTransferStatus
};