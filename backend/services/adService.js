const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Sélectionner une publicité à afficher
const selectAd = async (placement, userContext = {}) => {
  try {
    const { userId, ip, userAgent, categories = [], location } = userContext;

    // Récupérer les publicités actives pour ce placement
    const activeAds = await prisma.ad.findMany({
      where: {
        placement: placement,
        is_active: true,
        campaign: {
          status: 'active',
          start_date: { lte: new Date() },
          end_date: { gte: new Date() }
        }
      },
      include: {
        campaign: {
          include: {
            shop: true
          }
        }
      }
    });

    // Filtrer les publicités dont le budget n'est pas épuisé
    const activeAdsWithBudget = activeAds.filter(ad => {
      return ad.campaign.spent_budget < ad.campaign.total_budget;
    });

    if (activeAds.length === 0) {
      return null;
    }

    // Filtrer par ciblage
    let eligibleAds = activeAds.filter(ad => {
      // Vérifier l'âge si spécifié
      if (ad.target_age_min && userContext.age && userContext.age < ad.target_age_min) {
        return false;
      }
      if (ad.target_age_max && userContext.age && userContext.age > ad.target_age_max) {
        return false;
      }

      // Vérifier la localisation si spécifiée
      if (ad.target_regions && location && !JSON.parse(ad.target_regions).includes(location)) {
        return false;
      }

      // Vérifier les catégories si spécifiées
      if (ad.target_categories && categories.length > 0) {
        const adCategories = JSON.parse(ad.target_categories);
        const hasMatchingCategory = categories.some(cat => adCategories.includes(cat));
        if (!hasMatchingCategory) {
          return false;
        }
      }

      return true;
    });

    if (eligibleAds.length === 0) {
      // Si aucun ciblage ne correspond, prendre une pub aléatoire
      eligibleAds = activeAds;
    }

    // Sélectionner une publicité (pondérée par le budget restant)
    const selectedAd = selectWeightedAd(eligibleAds);

    return selectedAd;

  } catch (error) {
    console.error('Erreur lors de la sélection de publicité:', error);
    return null;
  }
};

// Sélection pondérée basée sur le budget restant
const selectWeightedAd = (ads) => {
  if (ads.length === 0) return null;
  if (ads.length === 1) return ads[0];

  // Calculer les poids basés sur le budget restant
  const weightedAds = ads.map(ad => {
    const budgetRemaining = ad.campaign.total_budget - ad.campaign.spent_budget;
    const weight = Math.max(budgetRemaining / ad.campaign.total_budget, 0.1); // Minimum 10%
    return { ad, weight };
  });

  // Sélection aléatoire pondérée
  const totalWeight = weightedAds.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of weightedAds) {
    random -= item.weight;
    if (random <= 0) {
      return item.ad;
    }
  }

  return weightedAds[0].ad; // Fallback
};

// Obtenir les publicités pour un utilisateur spécifique
const getAdsForUser = async (userId, placement, limit = 5) => {
  try {
    // Vérifier que userId est valide
    if (!userId) {
      return [];
    }

    // Récupérer le contexte utilisateur
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        // Ajouter d'autres champs si nécessaire pour le ciblage
      }
    });

    if (!user) {
      return [];
    }

    const ads = [];
    for (let i = 0; i < limit; i++) {
      const ad = await selectAd(placement, { userId });
      if (ad && !ads.find(a => a.id === ad.id)) {
        ads.push(ad);
      }
    }

    return ads;

  } catch (error) {
    console.error('Erreur lors de la récupération des publicités:', error);
    return [];
  }
};

// Mettre à jour les statuts des campagnes automatiquement
const updateCampaignStatuses = async () => {
  try {
    const now = new Date();

    // Marquer les campagnes expirées
    await prisma.adCampaign.updateMany({
      where: {
        status: 'active',
        end_date: { lt: now }
      },
      data: {
        status: 'expired',
        last_status_change: now
      }
    });

    // Marquer les campagnes épuisées
    const campaignsToExpire = await prisma.adCampaign.findMany({
      where: {
        status: 'active'
      }
    });

    for (const campaign of campaignsToExpire) {
      if (campaign.spent_budget >= campaign.total_budget) {
        await prisma.adCampaign.update({
          where: { id: campaign.id },
          data: {
            status: 'expired',
            last_status_change: now
          }
        });
      }
    }

    // Activer les campagnes dont la date de début est atteinte
    await prisma.adCampaign.updateMany({
      where: {
        status: 'approved',
        start_date: { lte: now },
        end_date: { gte: now }
      },
      data: {
        status: 'active',
        last_status_change: now
      }
    });

    console.log('Statuts des campagnes mis à jour automatiquement');

  } catch (error) {
    console.error('Erreur lors de la mise à jour des statuts:', error);
  }
};

// Nettoyer les anciennes données de tracking (optionnel)
const cleanupOldTrackingData = async (daysOld = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deletedImpressions = await prisma.adImpression.deleteMany({
      where: { created_at: { lt: cutoffDate } }
    });

    const deletedClicks = await prisma.adClick.deleteMany({
      where: { created_at: { lt: cutoffDate } }
    });

    console.log(`Nettoyage: ${deletedImpressions.count} impressions et ${deletedClicks.count} clics supprimés`);

  } catch (error) {
    console.error('Erreur lors du nettoyage des données:', error);
  }
};

module.exports = {
  selectAd,
  getAdsForUser,
  updateCampaignStatuses,
  cleanupOldTrackingData
};