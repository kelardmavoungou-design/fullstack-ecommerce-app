const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const otpGenerator = require('otp-generator');
const QRCode = require('qrcode');
const prisma = require('../config/prisma');
const { performBankTransfer, validatePhoneNumber } = require('./bankIntegrationService');

// Fonction pour appliquer la commission après paiement réussi
const applyCommission = async (orderId) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shop: { include: { seller: true } } }
    });

    if (!order || !order.shop || !order.shop.seller) {
      throw new Error('Commande ou vendeur non trouvé');
    }

    const seller = order.shop.seller;
    const amount = order.total;

    // Déterminer le taux de commission
    let tauxCommission;
    if (seller.total_sales < 5000) {
      tauxCommission = 0.15; // 15%
    } else if (seller.total_sales < 15000) {
      tauxCommission = 0.10; // 10%
    } else {
      tauxCommission = 0.05; // Taux personnalisé, par exemple 5%
    }

    const commission = amount * tauxCommission;
    const netVendeur = amount - commission;

    // Créditer le wallet du vendeur
    await prisma.user.update({
      where: { id: seller.id },
      data: {
        wallet_balance: { increment: netVendeur },
        total_sales: { increment: amount }
      }
    });

    // Créditer le wallet de la plateforme
    let platformWallet = await prisma.platformWallet.findFirst();
    if (!platformWallet) {
      platformWallet = await prisma.platformWallet.create({
        data: { balance: 0 }
      });
    }
    await prisma.platformWallet.update({
      where: { id: platformWallet.id },
      data: { balance: { increment: commission } }
    });

    console.log(`Commission appliquée: ${commission} FCFA pour la commande ${orderId}`);
    return { success: true, commission, netVendeur };
  } catch (error) {
    console.error('Erreur lors de l\'application de la commission:', error);
    return { success: false, error: error.message };
  }
};

// Traiter le paiement par Visa/Mastercard
const processCardPayment = async (orderId, paymentDetails) => {
  try {
    // Obtenir les détails de la commande
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        shop: true
      }
    });

    if (!order) {
      throw new Error('Commande non trouvée');
    }

    // Vérifier que la clé Stripe est configurée
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'your_stripe_secret_key') {
      throw new Error('Configuration Stripe manquante. Veuillez configurer STRIPE_SECRET_KEY dans le fichier .env');
    }

    // Créer l'intention de paiement avec Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Convertir en centimes
      currency: 'xaf', // Utiliser le Franc CFA
      payment_method: paymentDetails.paymentMethodId,
      confirm: true,
      description: `Paiement pour la commande #${order.id}`,
      metadata: {
        orderId: order.id.toString(),
        buyerId: order.buyer_id.toString(),
        shopId: order.shop_id.toString()
      }
    });

    // Créer l'enregistrement de paiement
    const payment = await prisma.payment.create({
      data: {
        order_id: orderId,
        amount: order.total,
        payment_method: 'card',
        transaction_id: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending'
      }
    });

    // Mettre à jour le statut de la commande si le paiement est réussi
    if (paymentIntent.status === 'succeeded') {
       await prisma.order.update({
         where: { id: orderId },
         data: { status: 'paid' }
       });

       // Appliquer la commission
       await applyCommission(orderId);
    }

    return {
      success: true,
      paymentIntent,
      payment
    };
  } catch (error) {
    console.error('Erreur de traitement du paiement par carte:', error);

    // Gérer les erreurs Stripe spécifiques
    if (error.type === 'StripeCardError') {
      return {
        success: false,
        error: `Erreur de carte: ${error.message}`
      };
    } else if (error.type === 'StripeInvalidRequestError') {
      return {
        success: false,
        error: 'Données de paiement invalides'
      };
    } else if (error.type === 'StripeAPIError') {
      return {
        success: false,
        error: 'Erreur du service de paiement'
      };
    } else if (error.type === 'StripeConnectionError') {
      return {
        success: false,
        error: 'Erreur de connexion au service de paiement'
      };
    } else if (error.type === 'StripeAuthenticationError') {
      return {
        success: false,
        error: 'Erreur d\'authentification du service de paiement'
      };
    }

    return {
      success: false,
      error: error.message || 'Erreur lors du paiement par carte'
    };
  }
};

// Traiter le paiement par Mobile Money (MTN MoMo ou Airtel Money)
const processMobileMoneyPayment = async (orderId, paymentDetails) => {
  try {
    // Obtenir les détails de la commande
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        shop: true
      }
    });

    if (!order) {
      throw new Error('Commande non trouvée');
    }

    const { phoneNumber, provider } = paymentDetails;

    if (!phoneNumber) {
      throw new Error('Numéro de téléphone requis pour le paiement mobile money');
    }

    if (!provider || !['mtn', 'airtel'].includes(provider.toLowerCase())) {
      throw new Error('Fournisseur mobile money invalide. Utilisez "mtn" ou "airtel"');
    }

    let paymentResult;

    if (provider.toLowerCase() === 'mtn') {
      // Utiliser MTN MoMo
      const { createPaymentRequest } = require('./mtnMomoService');
      paymentResult = await createPaymentRequest(orderId, phoneNumber, order.total);

      if (paymentResult.success) {
        // Créer l'enregistrement de paiement principal
        const payment = await prisma.payment.create({
          data: {
            order_id: orderId,
            amount: order.total,
            payment_method: 'mtn_momo',
            transaction_id: paymentResult.referenceId,
            status: 'pending'
          }
        });

        return {
          success: true,
          payment,
          provider: 'mtn',
          referenceId: paymentResult.referenceId,
          message: 'Demande de paiement MTN MoMo créée. Veuillez approuver le paiement sur votre téléphone.'
        };
      }
    } else if (provider.toLowerCase() === 'airtel') {
      // Utiliser Airtel Money
      const { createPaymentRequest } = require('./airtelMoneyService');
      paymentResult = await createPaymentRequest(orderId, phoneNumber, order.total);

      if (paymentResult.success) {
        // Créer l'enregistrement de paiement principal
        const payment = await prisma.payment.create({
          data: {
            order_id: orderId,
            amount: order.total,
            payment_method: 'airtel_money',
            transaction_id: paymentResult.transactionId,
            status: 'pending'
          }
        });

        return {
          success: true,
          payment,
          provider: 'airtel',
          transactionId: paymentResult.transactionId,
          message: 'Demande de paiement Airtel Money créée. Veuillez approuver le paiement sur votre téléphone.'
        };
      }
    }

    // Si on arrive ici, c'est qu'il y a eu une erreur
    return {
      success: false,
      error: paymentResult?.error || 'Erreur lors de la création de la demande de paiement'
    };

  } catch (error) {
    console.error('Erreur de traitement du paiement mobile money:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Traiter le paiement en espèces à la livraison
const processCashPayment = async (orderId, paymentDetails) => {
  try {
    // Obtenir les détails de la commande
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        shop: true
      }
    });

    if (!order) {
      throw new Error('Commande non trouvée');
    }

    // Générer le code de livraison
    const deliveryCode = otpGenerator.generate(6, { upperCase: false, specialChars: false });

    // Générer le code QR pour le code de livraison
    const qrCodeDataURL = await QRCode.toDataURL(deliveryCode);

    // Créer l'enregistrement de paiement
    const payment = await prisma.payment.create({
      data: {
        order_id: orderId,
        amount: order.total,
        payment_method: 'cash',
        status: 'pending'
      }
    });

    // Mettre à jour la commande avec le code de livraison
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'pending',
        delivery_code: deliveryCode
      }
    });

    // Envoyer le code de livraison à l'acheteur par SMS
    const { sendDeliveryCodeSMS } = require('./notificationService');
    await sendDeliveryCodeSMS(order.buyer.phone_number, deliveryCode, {
      id: order.id,
      total: order.total
    });

    return {
      success: true,
      payment,
      deliveryCode,
      qrCodeDataURL,
      message: 'Commande passée avec succès. Veuillez payer en espèces à la livraison.'
    };
  } catch (error) {
    console.error('Erreur de traitement du paiement en espèces:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Vérifier le code de livraison
const verifyDeliveryCode = async (orderId, deliveryCode) => {
  try {
    // Obtenir les détails de la commande
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error('Commande non trouvée');
    }

    if (order.delivery_code !== deliveryCode) {
      throw new Error('Code de livraison invalide');
    }

    // Mettre à jour le statut de la commande et du paiement
    await prisma.order.update({
      where: { id: orderId },
      data: {
        is_delivered: true,
        status: 'delivered'
      }
    });

    // Mettre à jour le statut du paiement
    await prisma.payment.updateMany({
      where: { order_id: orderId },
      data: { status: 'completed' }
    });

    // Appliquer la commission
    await applyCommission(orderId);

    return {
      success: true,
      message: 'Livraison vérifiée avec succès'
    };
  } catch (error) {
    console.error('Erreur de vérification du code de livraison:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Obtenir le statut du paiement
const getPaymentStatus = async (paymentId) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: true
      }
    });

    if (!payment) {
      throw new Error('Paiement non trouvé');
    }

    return {
      success: true,
      payment
    };
  } catch (error) {
    console.error('Erreur d\'obtention du statut du paiement:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Rembourser le paiement
const refundPayment = async (paymentId, refundAmount) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: true
      }
    });

    if (!payment) {
      throw new Error('Paiement non trouvé');
    }

    if (payment.status !== 'completed') {
      throw new Error('Le paiement ne peut pas être remboursé');
    }

    let refundResult;

    if (payment.payment_method === 'card') {
      // Traiter le remboursement avec Stripe
      refundResult = await stripe.refunds.create({
        payment_intent: payment.transaction_id,
        amount: Math.round(refundAmount * 100), // Convertir en centimes
        reason: 'requested_by_customer'
      });
    } else if (payment.payment_method === 'mobile_money') {
      // Dans une implémentation réelle, vous intégreriez avec l'API MTN Mobile Money pour les remboursements
      // Pour l'instant, nous allons simuler le processus de remboursement
      refundResult = {
        id: `MM_REFUND_${Date.now()}`,
        status: 'succeeded'
      };
    } else if (payment.payment_method === 'cash') {
      // Pour les paiements en espèces, le remboursement serait traité manuellement
      refundResult = {
        id: `CASH_REFUND_${Date.now()}`,
        status: 'succeeded'
      };
    }

    // Mettre à jour le statut du paiement
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'refunded' }
    });

    return {
      success: true,
      refundResult
    };
  } catch (error) {
    console.error('Erreur de remboursement du paiement:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Traiter le retrait du vendeur avec vraie intégration bancaire
const processSellerWithdrawal = async (sellerId, amount, withdrawalRate = 0.02) => {
  try {
    const seller = await prisma.user.findUnique({
      where: { id: sellerId }
    });

    if (!seller) {
      throw new Error('Vendeur non trouvé');
    }

    // Vérifier que le compte bancaire est configuré et vérifié
    if (!seller.bank_provider || !seller.bank_account || !seller.bank_verified) {
      throw new Error('Compte bancaire non configuré ou non vérifié. Veuillez configurer votre compte bancaire dans les paramètres.');
    }

    // Valider le numéro de téléphone selon le fournisseur
    if (!validatePhoneNumber(seller.bank_account, seller.bank_provider)) {
      throw new Error('Numéro de téléphone invalide pour ce fournisseur bancaire');
    }

    if (seller.wallet_balance < amount) {
      throw new Error('Solde insuffisant');
    }

    // Calculer la commission de retrait (2%)
    const withdrawalCommission = amount * withdrawalRate;
    const finalAmount = amount - withdrawalCommission;

    // Générer une référence unique pour la transaction
    const reference = `WD_${sellerId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Démarrer la transaction
    const result = await prisma.$transaction(async (tx) => {
      // Déduire du portefeuille vendeur
      await tx.user.update({
        where: { id: sellerId },
        data: { wallet_balance: { decrement: amount } }
      });

      // Créditer le portefeuille plateforme
      let platformWallet = await tx.platformWallet.findFirst();
      if (!platformWallet) {
        platformWallet = await tx.platformWallet.create({
          data: { balance: 0 }
        });
      }
      await tx.platformWallet.update({
        where: { id: platformWallet.id },
        data: { balance: { increment: withdrawalCommission } }
      });

      return { platformWallet };
    });

    // Effectuer le transfert bancaire réel
    const bankTransfer = await performBankTransfer(
      seller.bank_provider,
      seller.bank_account,
      finalAmount,
      reference
    );

    if (!bankTransfer.success) {
      // En cas d'échec du transfert bancaire, rembourser le vendeur
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: sellerId },
          data: { wallet_balance: { increment: amount } }
        });

        await tx.platformWallet.update({
          where: { id: result.platformWallet.id },
          data: { balance: { decrement: withdrawalCommission } }
        });
      });

      throw new Error(`Échec du transfert bancaire: ${bankTransfer.error}`);
    }

    console.log(`Retrait réussi: ${finalAmount} FCFA envoyé à ${seller.bank_account} via ${seller.bank_provider}`);

    return {
      success: true,
      message: `Retrait initié avec succès. ${finalAmount} FCFA seront envoyés à votre compte ${seller.bank_provider}`,
      finalAmount,
      commission: withdrawalCommission,
      transactionId: bankTransfer.transactionId,
      reference
    };
  } catch (error) {
    console.error('Erreur lors du retrait vendeur:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Vérifier le statut d'un paiement MTN MoMo
const checkMtnMomoPaymentStatus = async (referenceId) => {
  try {
    const { checkPaymentStatus } = require('./mtnMomoService');
    return await checkPaymentStatus(referenceId);
  } catch (error) {
    console.error('Erreur lors de la vérification du statut MTN MoMo:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Vérifier le statut d'un paiement Airtel Money
const checkAirtelMoneyPaymentStatus = async (transactionId) => {
  try {
    const { checkPaymentStatus } = require('./airtelMoneyService');
    return await checkPaymentStatus(transactionId);
  } catch (error) {
    console.error('Erreur lors de la vérification du statut Airtel Money:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Traiter le callback MTN MoMo
const handleMtnMomoCallback = async (callbackData) => {
  try {
    const { handleCallback } = require('./mtnMomoService');
    return await handleCallback(callbackData);
  } catch (error) {
    console.error('Erreur lors du traitement du callback MTN MoMo:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Traiter le callback Airtel Money
const handleAirtelMoneyCallback = async (callbackData) => {
  try {
    const { handleCallback } = require('./airtelMoneyService');
    return await handleCallback(callbackData);
  } catch (error) {
    console.error('Erreur lors du traitement du callback Airtel Money:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  processCardPayment,
  processMobileMoneyPayment,
  processCashPayment,
  verifyDeliveryCode,
  getPaymentStatus,
  refundPayment,
  processSellerWithdrawal,
  checkMtnMomoPaymentStatus,
  checkAirtelMoneyPaymentStatus,
  handleMtnMomoCallback,
  handleAirtelMoneyCallback
};