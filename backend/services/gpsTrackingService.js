const prisma = require('../config/prisma');

// Stockage temporaire des connexions WebSocket actives
// En production, utiliser Redis ou une base de données
const activeConnections = new Map(); // deliveryPersonId -> Set of WebSocket connections
const deliverySubscriptions = new Map(); // deliveryId -> Set of client connections (buyers/admins)

// Initialiser le suivi GPS pour une livraison
const initializeGPSTracking = (deliveryId, deliveryPersonId) => {
  if (!activeConnections.has(deliveryPersonId)) {
    activeConnections.set(deliveryPersonId, new Set());
  }

  if (!deliverySubscriptions.has(deliveryId)) {
    deliverySubscriptions.set(deliveryId, new Set());
  }

  console.log(`Suivi GPS initialisé pour livraison #${deliveryId}, livreur #${deliveryPersonId}`);
};

// Ajouter une connexion WebSocket pour un livreur
const addDeliveryPersonConnection = (deliveryPersonId, ws) => {
  if (!activeConnections.has(deliveryPersonId)) {
    activeConnections.set(deliveryPersonId, new Set());
  }

  activeConnections.get(deliveryPersonId).add(ws);

  // Gérer la fermeture de connexion
  ws.on('close', () => {
    removeDeliveryPersonConnection(deliveryPersonId, ws);
  });

  console.log(`Connexion WebSocket ajoutée pour livreur #${deliveryPersonId}`);
};

// Supprimer une connexion WebSocket pour un livreur
const removeDeliveryPersonConnection = (deliveryPersonId, ws) => {
  if (activeConnections.has(deliveryPersonId)) {
    activeConnections.get(deliveryPersonId).delete(ws);

    // Nettoyer si plus de connexions
    if (activeConnections.get(deliveryPersonId).size === 0) {
      activeConnections.delete(deliveryPersonId);
    }
  }
};

// Ajouter un client qui suit une livraison (acheteur/admin)
const subscribeToDelivery = (deliveryId, clientWs) => {
  if (!deliverySubscriptions.has(deliveryId)) {
    deliverySubscriptions.set(deliveryId, new Set());
  }

  deliverySubscriptions.get(deliveryId).add(clientWs);

  // Gérer la fermeture de connexion
  clientWs.on('close', () => {
    unsubscribeFromDelivery(deliveryId, clientWs);
  });

  console.log(`Client abonné au suivi de livraison #${deliveryId}`);
};

// Désabonner un client d'une livraison
const unsubscribeFromDelivery = (deliveryId, clientWs) => {
  if (deliverySubscriptions.has(deliveryId)) {
    deliverySubscriptions.get(deliveryId).delete(clientWs);

    // Nettoyer si plus d'abonnés
    if (deliverySubscriptions.get(deliveryId).size === 0) {
      deliverySubscriptions.delete(deliveryId);
    }
  }
};

// Recevoir et diffuser une position GPS
const handleGPSUpdate = async (deliveryId, deliveryPersonId, positionData) => {
  try {
    const { latitude, longitude, accuracy, speed, heading } = positionData;

    // Enregistrer la position en base de données
    const tracking = await prisma.deliveryTracking.create({
      data: {
        delivery_id: deliveryId,
        delivery_person_id: deliveryPersonId,
        latitude,
        longitude,
        accuracy,
        speed,
        heading
      }
    });

    // Préparer les données à diffuser
    const broadcastData = {
      type: 'gps_update',
      deliveryId,
      deliveryPersonId,
      position: {
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        timestamp: tracking.timestamp
      }
    };

    // Diffuser aux clients abonnés (acheteurs/admins)
    if (deliverySubscriptions.has(deliveryId)) {
      const subscribers = deliverySubscriptions.get(deliveryId);
      subscribers.forEach(clientWs => {
        if (clientWs.readyState === 1) { // OPEN
          clientWs.send(JSON.stringify(broadcastData));
        }
      });
    }

    // Diffuser au livreur (confirmation)
    if (activeConnections.has(deliveryPersonId)) {
      const deliveryConnections = activeConnections.get(deliveryPersonId);
      deliveryConnections.forEach(ws => {
        if (ws.readyState === 1) { // OPEN
          ws.send(JSON.stringify({
            type: 'gps_ack',
            deliveryId,
            message: 'Position reçue',
            timestamp: tracking.timestamp
          }));
        }
      });
    }

    console.log(`Position GPS diffusée: livraison #${deliveryId}, livreur #${deliveryPersonId} - ${latitude}, ${longitude}`);

    return { success: true, tracking };

  } catch (error) {
    console.error('Erreur lors du traitement GPS:', error);
    return { success: false, error: error.message };
  }
};

// Obtenir l'historique des positions pour une livraison
const getDeliveryGPSTracking = async (deliveryId, limit = 50) => {
  try {
    const tracking = await prisma.deliveryTracking.findMany({
      where: { delivery_id: deliveryId },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    return {
      success: true,
      tracking: tracking.reverse() // Plus ancien au plus récent
    };

  } catch (error) {
    console.error('Erreur lors de la récupération du suivi GPS:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Obtenir la dernière position connue d'une livraison
const getLastKnownPosition = async (deliveryId) => {
  try {
    const lastPosition = await prisma.deliveryTracking.findFirst({
      where: { delivery_id: deliveryId },
      orderBy: { timestamp: 'desc' }
    });

    if (!lastPosition) {
      return {
        success: true,
        position: null,
        message: 'Aucune position GPS enregistrée'
      };
    }

    return {
      success: true,
      position: {
        latitude: lastPosition.latitude,
        longitude: lastPosition.longitude,
        accuracy: lastPosition.accuracy,
        speed: lastPosition.speed,
        heading: lastPosition.heading,
        timestamp: lastPosition.timestamp
      }
    };

  } catch (error) {
    console.error('Erreur lors de la récupération de la dernière position:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Calculer la distance entre deux points GPS (formule de Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance en km
  return distance;
};

// Estimer le temps d'arrivée basé sur la position actuelle et la destination
const estimateTimeOfArrival = async (deliveryId) => {
  try {
    // Obtenir la dernière position du livreur
    const lastPosition = await getLastKnownPosition(deliveryId);
    if (!lastPosition.success || !lastPosition.position) {
      return { success: false, error: 'Aucune position GPS disponible' };
    }

    // Obtenir la destination (coordonnées de livraison)
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true }
    });

    if (!delivery || !delivery.order.delivery_latitude || !delivery.order.delivery_longitude) {
      return { success: false, error: 'Coordonnées de destination non disponibles' };
    }

    const distance = calculateDistance(
      lastPosition.position.latitude,
      lastPosition.position.longitude,
      delivery.order.delivery_latitude,
      delivery.order.delivery_longitude
    );

    // Estimation simple: 30 km/h en moyenne
    const averageSpeed = 30; // km/h
    const timeInHours = distance / averageSpeed;
    const timeInMinutes = Math.round(timeInHours * 60);

    return {
      success: true,
      distance: Math.round(distance * 100) / 100, // 2 décimales
      estimatedTime: timeInMinutes,
      unit: 'minutes'
    };

  } catch (error) {
    console.error('Erreur lors de l\'estimation du temps d\'arrivée:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Nettoyer les connexions inactives (appel périodique recommandé)
const cleanupInactiveConnections = () => {
  console.log('Nettoyage des connexions WebSocket inactives...');

  // Vérifier les connexions de livreurs
  for (const [deliveryPersonId, connections] of activeConnections.entries()) {
    const activeConnectionsSet = new Set();
    for (const ws of connections) {
      if (ws.readyState === 1) { // OPEN
        activeConnectionsSet.add(ws);
      }
    }

    if (activeConnectionsSet.size === 0) {
      activeConnections.delete(deliveryPersonId);
    } else {
      activeConnections.set(deliveryPersonId, activeConnectionsSet);
    }
  }

  // Vérifier les abonnements clients
  for (const [deliveryId, subscribers] of deliverySubscriptions.entries()) {
    const activeSubscribers = new Set();
    for (const ws of subscribers) {
      if (ws.readyState === 1) { // OPEN
        activeSubscribers.add(ws);
      }
    }

    if (activeSubscribers.size === 0) {
      deliverySubscriptions.delete(deliveryId);
    } else {
      deliverySubscriptions.set(deliveryId, activeSubscribers);
    }
  }

  console.log(`Nettoyage terminé. Livreurs actifs: ${activeConnections.size}, Abonnements actifs: ${deliverySubscriptions.size}`);
};

// Obtenir les statistiques de suivi GPS
const getGPSTrackingStats = () => {
  return {
    activeDeliveryPersons: activeConnections.size,
    activeSubscriptions: deliverySubscriptions.size,
    totalConnections: Array.from(activeConnections.values()).reduce((sum, set) => sum + set.size, 0) +
                      Array.from(deliverySubscriptions.values()).reduce((sum, set) => sum + set.size, 0)
  };
};

module.exports = {
  initializeGPSTracking,
  addDeliveryPersonConnection,
  removeDeliveryPersonConnection,
  subscribeToDelivery,
  unsubscribeFromDelivery,
  handleGPSUpdate,
  getDeliveryGPSTracking,
  getLastKnownPosition,
  estimateTimeOfArrival,
  calculateDistance,
  cleanupInactiveConnections,
  getGPSTrackingStats
};