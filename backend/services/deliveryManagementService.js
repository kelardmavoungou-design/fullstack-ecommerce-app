const prisma = require('../config/prisma');
const crypto = require('crypto');
const { notifyDeliveryParticipants } = require('./websocketService');

// Générer un code de validation unique pour la livraison
const generateValidationCode = () => {
  return 'DEL' + crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Générer un UUID pour les références
const generateUUID = () => {
  return crypto.randomUUID();
};

// 1️⃣ Création d'une commande avec attribution automatique à un livreur
const createOrderWithDelivery = async (orderData) => {
  const { buyer_id, shop_id, items, shipping_address, delivery_latitude, delivery_longitude } = orderData;

  try {
    // Calculer le total de la commande
    let total = 0;
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.product_id }
      });
      if (!product) throw new Error(`Produit ${item.product_id} non trouvé`);
      total += parseFloat(product.price) * item.quantity;
    }

    // Créer la commande
    const order = await prisma.order.create({
      data: {
        buyer_id,
        shop_id,
        total,
        payment_method: 'mobile_money',
        shipping_address,
        delivery_latitude,
        delivery_longitude,
        status: 'paid' // On suppose que le paiement est déjà effectué
      }
    });

    // Créer les items de commande
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.product_id }
      });

      await prisma.orderItem.create({
        data: {
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: product.price
        }
      });
    }

    // Trouver un livreur disponible (le plus proche ou avec le moins de livraisons)
    const availableDeliveryPerson = await prisma.user.findFirst({
      where: {
        role_id: 4, // delivery role
        // Ici on pourrait ajouter des filtres de disponibilité
      },
      orderBy: {
        deliveries: {
          _count: 'asc' // Le livreur avec le moins de livraisons
        }
      }
    });

    if (!availableDeliveryPerson) {
      throw new Error('Aucun livreur disponible');
    }

    // Créer la livraison avec tous les produits à collecter
    const validationCode = generateValidationCode();
    const delivery = await prisma.delivery.create({
      data: {
        order_id: order.id,
        delivery_person_id: availableDeliveryPerson.id,
        status: 'en_attente',
        total_products: items.length,
        collected_products: 0,
        progress: 0,
        validation_code: validationCode,
        assigned_at: new Date()
      }
    });

    // Créer les entrées de collecte pour chaque produit
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.product_id },
        include: { shop: true }
      });

      await prisma.deliveryProductCollection.create({
        data: {
          delivery_id: delivery.id,
          product_id: item.product_id,
          shop_id: product.shop_id,
          status: 'pending'
        }
      });
    }

    // Notifier le livreur (ici on pourrait envoyer une notification push/email)
    console.log(`Nouvelle livraison #${delivery.id} assignée au livreur ${availableDeliveryPerson.full_name}`);

    return {
      success: true,
      order,
      delivery,
      deliveryPerson: availableDeliveryPerson,
      validationCode
    };

  } catch (error) {
    console.error('Erreur lors de la création de la commande avec livraison:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 2️⃣ Collecte des produits par le livreur
const collectProduct = async (deliveryId, productId, deliveryPersonId) => {
  try {
    // Vérifier que le livreur est bien assigné à cette livraison
    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        delivery_person_id: deliveryPersonId
      }
    });

    if (!delivery) {
      throw new Error('Livraison non trouvée ou non assignée à ce livreur');
    }

    // Marquer le produit comme collecté
    const collection = await prisma.deliveryProductCollection.updateMany({
      where: {
        delivery_id: deliveryId,
        product_id: productId
      },
      data: {
        status: 'collected',
        collected_at: new Date(),
        collected_by: deliveryPersonId
      }
    });

    if (collection.count === 0) {
      throw new Error('Produit non trouvé dans cette livraison');
    }

    // Recalculer la progression
    const totalCollections = await prisma.deliveryProductCollection.count({
      where: { delivery_id: deliveryId }
    });

    const collectedCount = await prisma.deliveryProductCollection.count({
      where: {
        delivery_id: deliveryId,
        status: 'collected'
      }
    });

    const progress = (collectedCount / totalCollections) * 100;

    // Mettre à jour la livraison
    let newStatus = delivery.status;
    if (collectedCount === totalCollections && delivery.status === 'collecte_en_cours') {
      newStatus = 'en_route';
    } else if (collectedCount > 0 && delivery.status === 'en_attente') {
      newStatus = 'collecte_en_cours';
    }

    await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        collected_products: collectedCount,
        progress: progress,
        status: newStatus,
        ...(newStatus === 'en_route' && { picked_up_at: new Date() })
      }
    });

    // Notifier le client et les admins
    const order = await prisma.order.findUnique({
      where: { id: delivery.order_id },
      include: { buyer: true }
    });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { shop: true }
    });

    console.log(`Produit ${productId} collecté - Progression: ${collectedCount}/${totalCollections} (${progress.toFixed(1)}%)`);

    // Envoyer notification WebSocket pour la collecte de produit
    notifyDeliveryParticipants(deliveryId, 'product-collected', {
      deliveryId,
      productName: product.name,
      progress: collectedCount,
      total: totalCollections,
      deliveryPersonName: delivery.delivery_person.full_name,
      shopName: product.shop.name
    });

    if (newStatus === 'en_route') {
      console.log(`Tous les produits collectés - Livraison #${deliveryId} en route vers ${order.buyer.full_name}`);

      // Notifier que la livraison est prête pour le départ
      notifyDeliveryParticipants(deliveryId, 'delivery-ready', {
        deliveryId,
        deliveryPersonName: delivery.delivery_person.full_name,
        totalProducts: totalCollections
      });
    }

    return {
      success: true,
      progress: progress,
      collectedCount,
      totalCount: totalCollections,
      status: newStatus
    };

  } catch (error) {
    console.error('Erreur lors de la collecte du produit:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 3️⃣ Démarrer le suivi GPS en temps réel
const startGPSTracking = async (deliveryId, deliveryPersonId) => {
  try {
    // Vérifier que la livraison est en cours
    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        delivery_person_id: deliveryPersonId,
        status: 'en_route'
      }
    });

    if (!delivery) {
      throw new Error('Livraison non trouvée ou pas en statut "en_route"');
    }

    // Activer le suivi GPS
    await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        is_gps_active: true
      }
    });

    console.log(`Suivi GPS activé pour la livraison #${deliveryId}`);
    return { success: true };

  } catch (error) {
    console.error('Erreur lors du démarrage du suivi GPS:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 4️⃣ Enregistrer une position GPS
const recordGPSPosition = async (deliveryId, orderId, deliveryPersonId, latitude, longitude, accuracy = null, speed = null, heading = null) => {
  try {
    // Créer l'entrée de suivi GPS
    const tracking = await prisma.deliveryTracking.create({
      data: {
        delivery_id: deliveryId,
        order_id: orderId,
        delivery_person_id: deliveryPersonId,
        latitude,
        longitude,
        accuracy,
        speed,
        heading
      }
    });

    console.log(`Position GPS enregistrée pour livraison #${deliveryId}: ${latitude}, ${longitude}`);
    return { success: true, tracking };

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement GPS:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 5️⃣ Valider la livraison avec QR code
const validateDelivery = async (deliveryId, validationCode, scannedBy) => {
  try {
    // Trouver la livraison
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          include: { buyer: true }
        }
      }
    });

    if (!delivery) {
      throw new Error('Livraison non trouvée');
    }

    // Vérifier le code de validation
    if (delivery.validation_code !== validationCode) {
      throw new Error('Code de validation incorrect');
    }

    // Vérifier que tous les produits ont été collectés
    if (delivery.collected_products !== delivery.total_products) {
      throw new Error('Tous les produits n\'ont pas été collectés');
    }

    // Marquer la livraison comme terminée
    await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: 'livré',
        delivered_at: new Date(),
        is_gps_active: false // Arrêter le suivi GPS
      }
    });

    // Mettre à jour le statut de la commande
    await prisma.order.update({
      where: { id: delivery.order_id },
      data: {
        status: 'delivered',
        is_delivered: true
      }
    });

    console.log(`Livraison #${deliveryId} validée avec succès pour ${delivery.order.buyer.full_name}`);

    // Notifier que la livraison est terminée
    notifyDeliveryParticipants(deliveryId, 'delivery-completed', {
      deliveryId,
      deliveryPersonName: delivery.delivery_person.full_name,
      buyerName: delivery.order.buyer.full_name
    });

    return {
      success: true,
      delivery,
      message: 'Livraison validée avec succès'
    };

  } catch (error) {
    console.error('Erreur lors de la validation de livraison:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Obtenir les détails complets d'une livraison
const getDeliveryDetails = async (deliveryId, userId, userRole) => {
  try {
    let delivery;

    if (userRole === 'delivery') {
      // Pour les livreurs, vérifier qu'ils sont assignés
      delivery = await prisma.delivery.findFirst({
        where: {
          id: deliveryId,
          delivery_person_id: userId
        },
        include: {
          order: {
            include: {
              buyer: true,
              items: {
                include: { product: true }
              }
            }
          },
          productCollections: {
            include: {
              product: true,
              shop: true,
              collector: true
            }
          },
          tracking: {
            orderBy: { timestamp: 'desc' },
            take: 10 // Dernières 10 positions
          },
          delivery_person: true
        }
      });
    } else {
      // Pour les admins ou autres rôles
      delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          order: {
            include: {
              buyer: true,
              items: {
                include: { product: true }
              }
            }
          },
          productCollections: {
            include: {
              product: true,
              shop: true,
              collector: true
            }
          },
          tracking: {
            orderBy: { timestamp: 'desc' },
            take: 10
          },
          delivery_person: true
        }
      });
    }

    if (!delivery) {
      throw new Error('Livraison non trouvée ou accès non autorisé');
    }

    return {
      success: true,
      delivery
    };

  } catch (error) {
    console.error('Erreur lors de la récupération des détails de livraison:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Obtenir les livraisons d'un livreur
const getDeliveriesForPerson = async (deliveryPersonId, status = null) => {
  try {
    const where = {
      delivery_person_id: deliveryPersonId,
      ...(status && { status })
    };

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        order: {
          include: {
            buyer: true,
            items: {
              include: { product: true }
            }
          }
        },
        productCollections: {
          include: {
            product: true,
            shop: true
          }
        }
      },
      orderBy: { assigned_at: 'desc' }
    });

    return {
      success: true,
      deliveries
    };

  } catch (error) {
    console.error('Erreur lors de la récupération des livraisons:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Admin functions for delivery management
const assignDeliveryToPerson = async (deliveryId, deliveryPersonId, adminId) => {
  try {
    // Vérifier que la livraison existe
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId }
    });

    if (!delivery) {
      throw new Error('Livraison non trouvée');
    }

    // Vérifier que le livreur existe et a le rôle delivery
    const deliveryPerson = await prisma.user.findFirst({
      where: {
        id: deliveryPersonId,
        role_id: 4 // delivery role
      }
    });

    if (!deliveryPerson) {
      throw new Error('Livreur non trouvé ou rôle invalide');
    }

    // Mettre à jour l'assignation
    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        delivery_person_id: deliveryPersonId,
        assigned_at: new Date(),
        status: 'assigned'
      },
      include: {
        order: {
          include: {
            buyer: true,
            items: {
              include: { product: true }
            }
          }
        },
        delivery_person: true
      }
    });

    console.log(`Livraison #${deliveryId} réassignée au livreur ${deliveryPerson.full_name} par admin ${adminId}`);

    return {
      success: true,
      delivery: updatedDelivery,
      message: `Livraison assignée à ${deliveryPerson.full_name}`
    };

  } catch (error) {
    console.error('Erreur lors de l\'assignation de livraison:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const getAllDeliveries = async (filters = {}) => {
  try {
    const { status, delivery_person_id, limit = 50, offset = 0 } = filters;

    const where = {};
    if (status) where.status = status;
    if (delivery_person_id) where.delivery_person_id = delivery_person_id;

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        order: {
          include: {
            buyer: true,
            shop: true,
            items: {
              include: { product: true }
            }
          }
        },
        delivery_person: true,
        productCollections: {
          include: {
            product: true,
            shop: true
          }
        }
      },
      orderBy: { assigned_at: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.delivery.count({ where });

    return {
      success: true,
      deliveries,
      total,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + deliveries.length < total
      }
    };

  } catch (error) {
    console.error('Erreur lors de la récupération des livraisons:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const getAvailableDeliveryPersonnel = async () => {
  try {
    const deliveryPersonnel = await prisma.user.findMany({
      where: {
        role_id: 4, // delivery role
        is_verified: true
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone_number: true,
        _count: {
          select: {
            deliveries: {
              where: {
                status: {
                  in: ['assigned', 'picked_up', 'in_transit']
                }
              }
            }
          }
        }
      },
      orderBy: {
        deliveries: {
          _count: 'asc' // Moins de livraisons actives en premier
        }
      }
    });

    // Calculer la charge de travail pour chaque livreur
    const personnelWithWorkload = deliveryPersonnel.map(person => ({
      id: person.id,
      full_name: person.full_name,
      email: person.email,
      phone_number: person.phone_number,
      active_deliveries: person._count.deliveries,
      availability: person._count.deliveries < 5 ? 'available' : person._count.deliveries < 10 ? 'busy' : 'overloaded'
    }));

    return {
      success: true,
      personnel: personnelWithWorkload
    };

  } catch (error) {
    console.error('Erreur lors de la récupération des livreurs:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const createManualDelivery = async (orderId, deliveryPersonId, adminId) => {
  try {
    // Vérifier que la commande existe
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } }
    });

    if (!order) {
      throw new Error('Commande non trouvée');
    }

    // Vérifier qu'il n'y a pas déjà une livraison pour cette commande
    const existingDelivery = await prisma.delivery.findFirst({
      where: { order_id: orderId }
    });

    if (existingDelivery) {
      throw new Error('Une livraison existe déjà pour cette commande');
    }

    // Créer la livraison manuellement
    const validationCode = generateValidationCode();
    const delivery = await prisma.delivery.create({
      data: {
        order_id: orderId,
        delivery_person_id: deliveryPersonId,
        status: 'assigned',
        total_products: order.items.length,
        collected_products: 0,
        progress: 0,
        validation_code: validationCode,
        assigned_at: new Date()
      },
      include: {
        order: {
          include: {
            buyer: true,
            items: { include: { product: true } }
          }
        },
        delivery_person: true
      }
    });

    // Créer les entrées de collecte pour chaque produit
    for (const item of order.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.product_id },
        include: { shop: true }
      });

      await prisma.deliveryProductCollection.create({
        data: {
          delivery_id: delivery.id,
          product_id: item.product_id,
          shop_id: product.shop_id,
          status: 'pending'
        }
      });
    }

    console.log(`Livraison manuelle créée #${delivery.id} pour commande #${orderId} par admin ${adminId}`);

    return {
      success: true,
      delivery,
      validationCode,
      message: 'Livraison créée avec succès'
    };

  } catch (error) {
    console.error('Erreur lors de la création de livraison manuelle:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const getDeliveryStats = async () => {
  try {
    const stats = await prisma.delivery.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const totalDeliveries = await prisma.delivery.count();
    const activeDeliveries = await prisma.delivery.count({
      where: {
        status: {
          in: ['assigned', 'picked_up', 'in_transit']
        }
      }
    });

    const deliveryPersonnelCount = await prisma.user.count({
      where: { role_id: 4 }
    });

    return {
      success: true,
      stats: {
        total_deliveries: totalDeliveries,
        active_deliveries: activeDeliveries,
        delivery_personnel: deliveryPersonnelCount,
        status_breakdown: stats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        }, {})
      }
    };

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  createOrderWithDelivery,
  collectProduct,
  startGPSTracking,
  recordGPSPosition,
  validateDelivery,
  getDeliveryDetails,
  getDeliveriesForPerson,
  generateValidationCode,
  // Admin functions
  assignDeliveryToPerson,
  getAllDeliveries,
  getAvailableDeliveryPersonnel,
  createManualDelivery,
  getDeliveryStats
};