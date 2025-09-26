const { PrismaClient } = require('@prisma/client');
const { selectAd, getAdsForUser } = require('../services/adService');
const prisma = new PrismaClient();

// Obtenir les boutiques de l'utilisateur pour créer des campagnes
const getUserShops = async (req, res) => {
  try {
    const userId = req.user.id;

    const shops = await prisma.shop.findMany({
      where: {
        seller_id: userId,
        is_active: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ shops });

  } catch (error) {
    console.error('Erreur lors de la récupération des boutiques:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Obtenir les produits de l'utilisateur pour créer des campagnes
const getUserProducts = async (req, res) => {
  try {
    const userId = req.user.id;

    const products = await prisma.product.findMany({
      where: {
        shop: {
          seller_id: userId
        },
        is_active: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        category: true,
        shop: {
          select: {
            name: true
          }
        },
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    // Formater les produits pour inclure le nom de la boutique
    const formattedProducts = products.map(product => ({
      ...product,
      boutique: product.shop?.name || 'Boutique inconnue'
    }));

    res.json({ products: formattedProducts });

  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Créer une nouvelle campagne publicitaire
const createCampaign = async (req, res) => {
  try {
    const { shop_id, title, description, budget_type, total_budget, daily_budget, start_date, end_date } = req.body;
    const userId = req.user.id;

    // Vérifier que l'utilisateur possède la boutique
    const shop = await prisma.shop.findFirst({
      where: {
        id: parseInt(shop_id),
        seller_id: userId
      }
    });

    if (!shop) {
      return res.status(403).json({ message: 'Vous n\'avez pas accès à cette boutique' });
    }

    // Créer la campagne avec statut en attente de validation
    const campaign = await prisma.adCampaign.create({
      data: {
        shop_id: parseInt(shop_id),
        title,
        description,
        budget_type,
        total_budget: parseFloat(total_budget),
        daily_budget: daily_budget ? parseFloat(daily_budget) : null,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        status: 'pending',
        submitted_at: new Date()
      }
    });

    res.status(201).json({
      message: 'Campagne créée avec succès',
      campaign
    });

  } catch (error) {
    console.error('Erreur lors de la création de la campagne:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Obtenir toutes les campagnes d'un vendeur
const getCampaigns = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const where = {
      shop: {
        seller_id: userId
      }
    };

    if (status) {
      where.status = status;
    }

    const campaigns = await prisma.adCampaign.findMany({
      where,
      include: {
        shop: {
          select: { name: true }
        },
        ads: {
          select: {
            id: true,
            title: true,
            status: true,
            impressions: {
              select: { id: true }
            },
            clicks: {
              select: { id: true, cost: true }
            }
          }
        },
        _count: {
          select: {
            impressions: true,
            clicks: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    // Calculer les statistiques pour chaque campagne
    const campaignsWithStats = campaigns.map(campaign => {
      const totalImpressions = campaign.ads.reduce((sum, ad) => sum + ad.impressions.length, 0);
      const totalClicks = campaign.ads.reduce((sum, ad) => sum + ad.clicks.length, 0);
      const totalSpent = campaign.ads.reduce((sum, ad) =>
        sum + ad.clicks.reduce((clickSum, click) => clickSum + parseFloat(click.cost), 0), 0
      );

      return {
        ...campaign,
        stats: {
          impressions: totalImpressions,
          clicks: totalClicks,
          ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0,
          spent: totalSpent.toFixed(2),
          remaining: (parseFloat(campaign.total_budget) - totalSpent).toFixed(2)
        }
      };
    });

    res.json({
      campaigns: campaignsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des campagnes:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Obtenir une campagne spécifique
const getCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const campaign = await prisma.adCampaign.findFirst({
      where: {
        id: parseInt(id),
        shop: {
          seller_id: userId
        }
      },
      include: {
        shop: {
          select: { name: true }
        },
        ads: {
          include: {
            impressions: {
              select: { id: true, created_at: true }
            },
            clicks: {
              select: { id: true, cost: true, created_at: true }
            }
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    // Calculer les statistiques détaillées
    const stats = {
      totalImpressions: campaign.ads.reduce((sum, ad) => sum + ad.impressions.length, 0),
      totalClicks: campaign.ads.reduce((sum, ad) => sum + ad.clicks.length, 0),
      totalSpent: campaign.ads.reduce((sum, ad) =>
        sum + ad.clicks.reduce((clickSum, click) => clickSum + parseFloat(click.cost), 0), 0
      ),
      ctr: 0,
      dailyStats: []
    };

    stats.ctr = stats.totalImpressions > 0 ? ((stats.totalClicks / stats.totalImpressions) * 100) : 0;

    res.json({ campaign, stats });

  } catch (error) {
    console.error('Erreur lors de la récupération de la campagne:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Mettre à jour une campagne
const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // Vérifier que la campagne appartient à l'utilisateur
    const campaign = await prisma.adCampaign.findFirst({
      where: {
        id: parseInt(id),
        shop: {
          seller_id: userId
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    // Empêcher la modification de certains champs si la campagne est active
    if (campaign.status === 'active' && (updateData.total_budget || updateData.daily_budget)) {
      return res.status(400).json({ message: 'Impossible de modifier le budget d\'une campagne active' });
    }

    const updatedCampaign = await prisma.adCampaign.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        updated_at: new Date()
      }
    });

    res.json({
      message: 'Campagne mise à jour avec succès',
      campaign: updatedCampaign
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la campagne:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Supprimer une campagne
const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier que la campagne appartient à l'utilisateur
    const campaign = await prisma.adCampaign.findFirst({
      where: {
        id: parseInt(id),
        shop: {
          seller_id: userId
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    // Empêcher la suppression d'une campagne active
    if (campaign.status === 'active') {
      return res.status(400).json({ message: 'Impossible de supprimer une campagne active' });
    }

    await prisma.adCampaign.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Campagne supprimée avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression de la campagne:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Changer le statut d'une campagne
const updateCampaignStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Vérifier que la campagne appartient à l'utilisateur
    const campaign = await prisma.adCampaign.findFirst({
      where: {
        id: parseInt(id),
        shop: {
          seller_id: userId
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    // Validation des transitions de statut
    const validStatuses = ['draft', 'pending', 'active', 'paused', 'completed', 'expired', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    // Logique métier pour les transitions
    if (status === 'active' && campaign.status !== 'pending') {
      return res.status(400).json({ message: 'La campagne doit être en attente pour être activée' });
    }

    const updatedCampaign = await prisma.adCampaign.update({
      where: { id: parseInt(id) },
      data: {
        status,
        updated_at: new Date()
      }
    });

    res.json({
      message: 'Statut de la campagne mis à jour',
      campaign: updatedCampaign
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Créer une publicité dans une campagne
const createAd = async (req, res) => {
  try {
    const { campaign_id, title, content, image, target_url, target_age_min, target_age_max, target_regions, target_categories, placement, cost_model, cost_per_click, cost_per_impression } = req.body;
    const userId = req.user.id;

    // Vérifier que la campagne appartient à l'utilisateur
    const campaign = await prisma.adCampaign.findFirst({
      where: {
        id: parseInt(campaign_id),
        shop: {
          seller_id: userId
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    const ad = await prisma.ad.create({
      data: {
        campaign_id: parseInt(campaign_id),
        title,
        content,
        image,
        target_url,
        target_age_min: target_age_min ? parseInt(target_age_min) : 18,
        target_age_max: target_age_max ? parseInt(target_age_max) : 65,
        target_regions: target_regions ? JSON.stringify(target_regions) : null,
        target_categories: target_categories ? JSON.stringify(target_categories) : null,
        placement,
        cost_model,
        cost_per_click: cost_per_click ? parseFloat(cost_per_click) : null,
        cost_per_impression: cost_per_impression ? parseFloat(cost_per_impression) : null,
        status: 'pending'
      }
    });

    res.status(201).json({
      message: 'Publicité créée avec succès',
      ad
    });

  } catch (error) {
    console.error('Erreur lors de la création de la publicité:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Obtenir les publicités d'une campagne
const getAds = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user.id;

    // Vérifier que la campagne appartient à l'utilisateur
    const campaign = await prisma.adCampaign.findFirst({
      where: {
        id: parseInt(campaignId),
        shop: {
          seller_id: userId
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    const ads = await prisma.ad.findMany({
      where: { campaign_id: parseInt(campaignId) },
      include: {
        _count: {
          select: {
            impressions: true,
            clicks: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ ads });

  } catch (error) {
    console.error('Erreur lors de la récupération des publicités:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Mettre à jour une publicité
const updateAd = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // Vérifier que la publicité appartient à l'utilisateur
    const ad = await prisma.ad.findFirst({
      where: {
        id: parseInt(id),
        campaign: {
          shop: {
            seller_id: userId
          }
        }
      }
    });

    if (!ad) {
      return res.status(404).json({ message: 'Publicité non trouvée' });
    }

    const updatedAd = await prisma.ad.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({
      message: 'Publicité mise à jour avec succès',
      ad: updatedAd
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la publicité:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Supprimer une publicité
const deleteAd = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier que la publicité appartient à l'utilisateur
    const ad = await prisma.ad.findFirst({
      where: {
        id: parseInt(id),
        campaign: {
          shop: {
            seller_id: userId
          }
        }
      }
    });

    if (!ad) {
      return res.status(404).json({ message: 'Publicité non trouvée' });
    }

    await prisma.ad.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Publicité supprimée avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression de la publicité:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Approuver une campagne (Super Admin uniquement)
const approveCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier que l'utilisateur est un superadmin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user || user.role.name !== 'superadmin') {
      return res.status(403).json({ message: 'Accès refusé. Droits superadmin requis.' });
    }

    // Vérifier que la campagne existe et est en attente
    const campaign = await prisma.adCampaign.findUnique({
      where: { id: parseInt(id) }
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    if (campaign.status !== 'pending') {
      return res.status(400).json({ message: 'La campagne n\'est pas en attente de validation' });
    }

    // Approuver la campagne
    const updatedCampaign = await prisma.adCampaign.update({
      where: { id: parseInt(id) },
      data: {
        status: 'active',
        approved_by: userId,
        approved_at: new Date(),
        last_status_change: new Date()
      }
    });

    // Créer une notification pour le vendeur
    await prisma.notification.create({
      data: {
        user_id: campaign.shop.seller_id,
        message: `Votre campagne "${campaign.title}" a été approuvée et est maintenant active.`,
        is_read: false
      }
    });

    res.json({
      message: 'Campagne approuvée avec succès',
      campaign: updatedCampaign
    });

  } catch (error) {
    console.error('Erreur lors de l\'approbation de la campagne:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Rejeter une campagne (Super Admin uniquement)
const rejectCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const userId = req.user.id;

    // Vérifier que l'utilisateur est un superadmin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user || user.role.name !== 'superadmin') {
      return res.status(403).json({ message: 'Accès refusé. Droits superadmin requis.' });
    }

    // Vérifier que la campagne existe et est en attente
    const campaign = await prisma.adCampaign.findUnique({
      where: { id: parseInt(id) }
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    if (campaign.status !== 'pending') {
      return res.status(400).json({ message: 'La campagne n\'est pas en attente de validation' });
    }

    // Rejeter la campagne
    const updatedCampaign = await prisma.adCampaign.update({
      where: { id: parseInt(id) },
      data: {
        status: 'cancelled',
        approved_by: userId,
        approved_at: new Date(),
        rejection_reason: rejection_reason || 'Campagne rejetée par l\'administrateur',
        last_status_change: new Date()
      }
    });

    // Créer une notification pour le vendeur
    await prisma.notification.create({
      data: {
        user_id: campaign.shop.seller_id,
        message: `Votre campagne "${campaign.title}" a été rejetée. Raison: ${rejection_reason || 'Non spécifiée'}`,
        is_read: false
      }
    });

    res.json({
      message: 'Campagne rejetée avec succès',
      campaign: updatedCampaign
    });

  } catch (error) {
    console.error('Erreur lors du rejet de la campagne:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Obtenir les campagnes en attente de validation (Super Admin uniquement)
const getPendingCampaigns = async (req, res) => {
  try {
    const userId = req.user.id;

    // Vérifier que l'utilisateur est un superadmin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user || user.role.name !== 'superadmin') {
      return res.status(403).json({ message: 'Accès refusé. Droits superadmin requis.' });
    }

    const campaigns = await prisma.adCampaign.findMany({
      where: { status: 'pending' },
      include: {
        shop: {
          select: { name: true, seller: { select: { full_name: true, email: true } } }
        }
      },
      orderBy: { submitted_at: 'asc' }
    });

    res.json({ campaigns });

  } catch (error) {
    console.error('Erreur lors de la récupération des campagnes en attente:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Enregistrer une impression publicitaire
const trackImpression = async (req, res) => {
  try {
    const { campaign_id, ad_id, user_id, ip_address, user_agent, placement } = req.body;

    // Vérifier que la campagne et l'ad existent et sont actifs
    const ad = await prisma.ad.findFirst({
      where: {
        id: parseInt(ad_id),
        campaign_id: parseInt(campaign_id),
        campaign: {
          status: 'active',
          start_date: { lte: new Date() },
          end_date: { gte: new Date() }
        },
        is_active: true
      }
    });

    if (!ad) {
      return res.status(404).json({ message: 'Publicité non trouvée ou inactive' });
    }

    // Créer l'impression
    const impression = await prisma.adImpression.create({
      data: {
        campaign_id: parseInt(campaign_id),
        ad_id: parseInt(ad_id),
        user_id: user_id ? parseInt(user_id) : null,
        ip_address,
        user_agent,
        placement: placement || ad.placement || 'home'
      }
    });

    res.json({ message: 'Impression enregistrée', impression });

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'impression:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Enregistrer un clic publicitaire avec déduction du budget
const trackClick = async (req, res) => {
  try {
    const { campaign_id, ad_id, user_id, ip_address, user_agent, placement } = req.body;

    // Vérifier que la campagne et l'ad existent et sont actifs
    const ad = await prisma.ad.findFirst({
      where: {
        id: parseInt(ad_id),
        campaign_id: parseInt(campaign_id),
        campaign: {
          status: 'active',
          start_date: { lte: new Date() },
          end_date: { gte: new Date() }
        },
        is_active: true
      },
      include: {
        campaign: true
      }
    });

    if (!ad) {
      return res.status(404).json({ message: 'Publicité non trouvée ou inactive' });
    }

    // Vérifier le budget disponible
    const campaign = ad.campaign;
    const cost = ad.cost_per_click || ad.campaign.total_budget * 0.01; // 1% du budget total par défaut

    if (campaign.spent_budget + cost > campaign.total_budget) {
      return res.status(400).json({ message: 'Budget insuffisant' });
    }

    // Anti-fraud: Vérifier les clics récents depuis cette IP
    const recentClicks = await prisma.adClick.count({
      where: {
        ip_address,
        campaign_id: parseInt(campaign_id),
        created_at: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes
        }
      }
    });

    const isSuspicious = recentClicks >= 3;
    const fraudReason = isSuspicious ? 'Trop de clics depuis cette IP dans les 5 dernières minutes' : null;

    // Créer le clic
    const click = await prisma.adClick.create({
      data: {
        campaign_id: parseInt(campaign_id),
        ad_id: parseInt(ad_id),
        user_id: user_id ? parseInt(user_id) : null,
        ip_address,
        user_agent,
        placement: placement || ad.placement || 'home',
        cost,
        is_suspicious: isSuspicious,
        fraud_reason: fraudReason
      }
    });

    // Déduire le budget si ce n'est pas suspect
    if (!isSuspicious) {
      await prisma.adCampaign.update({
        where: { id: parseInt(campaign_id) },
        data: {
          spent_budget: { increment: cost }
        }
      });

      // Vérifier si le budget est épuisé
      const updatedCampaign = await prisma.adCampaign.findUnique({
        where: { id: parseInt(campaign_id) }
      });

      if (updatedCampaign.spent_budget >= updatedCampaign.total_budget) {
        await prisma.adCampaign.update({
          where: { id: parseInt(campaign_id) },
          data: {
            status: 'expired',
            last_status_change: new Date()
          }
        });
      }
    }

    res.json({
      message: 'Clic enregistré',
      click,
      cost_deducted: isSuspicious ? 0 : cost,
      is_suspicious
    });

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du clic:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Obtenir les statistiques d'une campagne
const getCampaignStats = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const campaign = await prisma.adCampaign.findFirst({
      where: {
        id: parseInt(id),
        shop: { seller_id: userId }
      },
      include: {
        ads: {
          include: {
            impressions: {
              select: { id: true, created_at: true }
            },
            clicks: {
              select: { id: true, cost: true, created_at: true, is_suspicious: true }
            }
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    // Calculer les statistiques
    const stats = {
      totalImpressions: 0,
      totalClicks: 0,
      totalSpent: 0,
      suspiciousClicks: 0,
      ctr: 0,
      dailyStats: []
    };

    campaign.ads.forEach(ad => {
      stats.totalImpressions += ad.impressions.length;
      stats.totalClicks += ad.clicks.length;
      stats.suspiciousClicks += ad.clicks.filter(c => c.is_suspicious).length;
      stats.totalSpent += ad.clicks.reduce((sum, c) => sum + parseFloat(c.cost), 0);
    });

    stats.ctr = stats.totalImpressions > 0 ? ((stats.totalClicks / stats.totalImpressions) * 100) : 0;

    res.json({ stats });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Servir une publicité pour affichage
const serveAd = async (req, res) => {
  try {
    console.log('ServeAd called with query:', req.query);
    const { placement, user_id, categories, location, age } = req.query;

    if (!placement) {
      return res.status(400).json({ message: 'Placement requis' });
    }

    const userContext = {
      userId: user_id ? parseInt(user_id) : null,
      categories: categories ? categories.split(',') : [],
      location,
      age: age ? parseInt(age) : null,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    const ad = await selectAd(placement, userContext);

    if (!ad) {
      return res.json({ ad: null, message: 'Aucune publicité disponible' });
    }

    // Enregistrer l'impression automatiquement
    try {
      await prisma.adImpression.create({
        data: {
          campaign_id: ad.campaign_id,
          ad_id: ad.id,
          user_id: userContext.userId,
          ip_address: userContext.ip,
          user_agent: userContext.userAgent,
          placement: ad.placement || 'home'
        }
      });
    } catch (impressionError) {
      console.error('Erreur lors de l\'enregistrement de l\'impression:', impressionError);
      // Ne pas bloquer l'affichage de la pub si l'impression échoue
    }

    res.json({
      ad: {
        id: ad.id,
        campaign_id: ad.campaign_id,
        title: ad.title,
        content: ad.content,
        image: ad.image,
        target_url: ad.target_url,
        placement: ad.placement
      }
    });

  } catch (error) {
    console.error('Erreur lors du service de publicité:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Servir plusieurs publicités
const serveAds = async (req, res) => {
  try {
    const { placement, user_id, limit = 3 } = req.query;

    if (!placement) {
      return res.status(400).json({ message: 'Placement requis' });
    }

    const userContext = {
      userId: user_id ? parseInt(user_id) : null,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    const ads = await getAdsForUser(userContext.userId, placement, parseInt(limit));

    // Enregistrer les impressions pour toutes les pubs
    for (const ad of ads) {
      try {
        await prisma.adImpression.create({
          data: {
            campaign_id: ad.campaign_id,
            ad_id: ad.id,
            user_id: userContext.userId,
            ip_address: userContext.ip,
            user_agent: userContext.userAgent,
            placement: ad.placement || 'home'
          }
        });
      } catch (impressionError) {
        console.error('Erreur lors de l\'enregistrement de l\'impression:', impressionError);
      }
    }

    const formattedAds = ads.map(ad => ({
      id: ad.id,
      campaign_id: ad.campaign_id,
      title: ad.title,
      content: ad.content,
      image: ad.image,
      target_url: ad.target_url,
      placement: ad.placement
    }));

    res.json({ ads: formattedAds });

  } catch (error) {
    console.error('Erreur lors du service des publicités:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

// Upload d'image pour les campagnes publicitaires
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    // Construire l'URL de l'image
    const imageUrl = `http://localhost:4000/uploads/campaigns/${req.file.filename}`;

    res.json({
      message: 'Image uploadée avec succès',
      image_url: imageUrl,
      filename: req.file.filename
    });

  } catch (error) {
    console.error('Erreur lors de l\'upload d\'image:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de l\'upload' });
  }
};

module.exports = {
  getUserShops,
  getUserProducts,
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  updateCampaignStatus,
  approveCampaign,
  rejectCampaign,
  getPendingCampaigns,
  createAd,
  getAds,
  updateAd,
  deleteAd,
  trackImpression,
  trackClick,
  getCampaignStats,
  serveAd,
  serveAds,
  uploadImage
};