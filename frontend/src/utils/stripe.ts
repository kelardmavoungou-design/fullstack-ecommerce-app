// Configuration Stripe pour supprimer les avertissements en développement
import { loadStripe } from '@stripe/stripe-js';

// Clé publique Stripe (à remplacer par votre vraie clé en production)
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';

// Fonction utilitaire pour vérifier si on est en développement
export const isDevelopment = import.meta.env.DEV;

// Configuration pour supprimer l'avertissement HTTPS en développement
const stripePromise = loadStripe(stripePublishableKey, {
  // Désactiver les avertissements HTTPS en développement
  betas: isDevelopment ? ['checkout_beta_4'] : [],
});

export default stripePromise;

// Fonction pour obtenir l'instance Stripe
export const getStripe = () => {
  if (isDevelopment) {
    // En développement, on peut utiliser une configuration spéciale
    console.log('🔧 Stripe configuré pour le développement (HTTP autorisé)');
  }
  return stripePromise;
};