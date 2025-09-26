const { Server } = require('socket.io');

// Stockage des connexions actives
const activeConnections = new Map(); // userId -> socket
const deliveryConnections = new Map(); // deliveryId -> { clientSocket, deliverySocket }
const adminConnections = new Map(); // adminId -> socket

let io;

const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    allowEIO3: true
  });

  io.on('connection', (socket) => {
    console.log('🔌 Nouvelle connexion WebSocket:', socket.id);

    // Authentification de l'utilisateur
    socket.on('authenticate', (data) => {
      const { userId, userType } = data;
      console.log(`👤 Utilisateur ${userId} (${userType}) authentifié`);

      // Stocker la connexion
      activeConnections.set(userId, socket);
      socket.userId = userId;
      socket.userType = userType;

      // Stocker les connexions admin séparément
      if (userType === 'superadmin') {
        adminConnections.set(userId, socket);
        console.log(`👑 Admin ${userId} connecté pour notifications temps réel`);
      }

      socket.emit('authenticated', { success: true });
    });

    // Rejoindre une livraison (pour les clients et livreurs)
    socket.on('join-delivery', (data) => {
      const { deliveryId, userType } = data;
      console.log(`📦 ${userType} rejoint la livraison ${deliveryId}`);

      if (!deliveryConnections.has(deliveryId)) {
        deliveryConnections.set(deliveryId, {});
      }

      const deliveryRoom = deliveryConnections.get(deliveryId);
      deliveryRoom[userType] = socket;

      socket.deliveryId = deliveryId;
      socket.join(`delivery-${deliveryId}`);
    });

    // Mise à jour de position GPS
    socket.on('update-location', (data) => {
      const { deliveryId, latitude, longitude, userType } = data;

      console.log(`📍 Position mise à jour pour livraison ${deliveryId}: ${latitude}, ${longitude} (${userType})`);

      // Sauvegarder en base de données (optionnel pour historique)
      // TODO: Sauvegarder la position GPS

      // Diffuser la position aux autres participants
      const deliveryRoom = deliveryConnections.get(deliveryId);
      if (deliveryRoom) {
        // Envoyer au client si c'est le livreur qui bouge
        if (userType === 'delivery' && deliveryRoom.client) {
          deliveryRoom.client.emit('delivery-location-update', {
            latitude,
            longitude,
            timestamp: new Date().toISOString()
          });
        }

        // Envoyer au livreur si c'est le client qui bouge (optionnel)
        if (userType === 'client' && deliveryRoom.delivery) {
          deliveryRoom.delivery.emit('client-location-update', {
            latitude,
            longitude,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    // Mise à jour du statut de livraison
    socket.on('update-delivery-status', (data) => {
      const { deliveryId, status, progress, message } = data;

      console.log(`📊 Statut livraison ${deliveryId} mis à jour: ${status}`);

      // Diffuser le changement de statut
      io.to(`delivery-${deliveryId}`).emit('delivery-status-update', {
        deliveryId,
        status,
        progress,
        message,
        timestamp: new Date().toISOString()
      });
    });

    // Notification de progression de collecte
    socket.on('product-collected', (data) => {
      const { deliveryId, productName, progress, total, deliveryPersonName, shopName } = data;

      console.log(`✅ Produit collecté: ${productName} (${progress}/${total})`);

      // Notifier le client de la progression
      const deliveryRoom = deliveryConnections.get(deliveryId);
      if (deliveryRoom && deliveryRoom.client) {
        deliveryRoom.client.emit('product-collected', {
          productName,
          progress,
          total,
          message: `Produit "${productName}" récupéré (${progress}/${total})`
        });
      }

      // Notifier tous les admins connectés
      adminConnections.forEach((adminSocket, adminId) => {
        adminSocket.emit('admin-product-collected', {
          deliveryId,
          productName,
          progress,
          total,
          deliveryPersonName,
          shopName,
          message: `${deliveryPersonName} a collecté "${productName}" chez ${shopName} (${progress}/${total})`,
          timestamp: new Date().toISOString()
        });
      });
    });

    // Livraison prête pour départ
    socket.on('delivery-ready', (data) => {
      const { deliveryId, deliveryPersonName, totalProducts } = data;

      console.log(`🚚 Livraison ${deliveryId} prête pour départ`);

      const deliveryRoom = deliveryConnections.get(deliveryId);
      if (deliveryRoom && deliveryRoom.client) {
        deliveryRoom.client.emit('delivery-ready', {
          message: 'Tous vos produits ont été collectés. Le livreur est en route !'
        });
      }

      // Notifier tous les admins connectés
      adminConnections.forEach((adminSocket, adminId) => {
        adminSocket.emit('admin-delivery-ready', {
          deliveryId,
          deliveryPersonName,
          totalProducts,
          message: `${deliveryPersonName} a collecté tous les produits (${totalProducts}) et est prêt pour la livraison`,
          timestamp: new Date().toISOString()
        });
      });
    });

    // Livraison terminée
    socket.on('delivery-completed', (data) => {
      const { deliveryId, deliveryPersonName, buyerName } = data;

      console.log(`✅ Livraison ${deliveryId} terminée`);

      io.to(`delivery-${deliveryId}`).emit('delivery-completed', {
        message: 'Livraison terminée avec succès !'
      });

      // Notifier tous les admins connectés
      adminConnections.forEach((adminSocket, adminId) => {
        adminSocket.emit('admin-delivery-completed', {
          deliveryId,
          deliveryPersonName,
          buyerName,
          message: `Livraison #${deliveryId} terminée - ${deliveryPersonName} a livré à ${buyerName}`,
          timestamp: new Date().toISOString()
        });
      });

      // Nettoyer les connexions
      deliveryConnections.delete(deliveryId);
    });

    // Déconnexion
    socket.on('disconnect', () => {
      console.log('🔌 Déconnexion WebSocket:', socket.id);

      // Nettoyer les connexions actives
      if (socket.userId) {
        activeConnections.delete(socket.userId);

        // Nettoyer les connexions admin
        if (socket.userType === 'superadmin') {
          adminConnections.delete(socket.userId);
          console.log(`👑 Admin ${socket.userId} déconnecté`);
        }
      }

      // Nettoyer les connexions de livraison
      if (socket.deliveryId) {
        const deliveryRoom = deliveryConnections.get(socket.deliveryId);
        if (deliveryRoom) {
          if (deliveryRoom.client === socket) {
            deliveryRoom.client = null;
          }
          if (deliveryRoom.delivery === socket) {
            deliveryRoom.delivery = null;
          }

          // Supprimer la room si vide
          if (!deliveryRoom.client && !deliveryRoom.delivery) {
            deliveryConnections.delete(socket.deliveryId);
          }
        }
      }
    });
  });

  console.log('🚀 WebSocket server initialized');
  return io;
};

// Fonctions utilitaires pour envoyer des notifications
const notifyUser = (userId, event, data) => {
  const socket = activeConnections.get(userId);
  if (socket) {
    socket.emit(event, data);
    return true;
  }
  return false;
};

const notifyDeliveryParticipants = (deliveryId, event, data) => {
  io.to(`delivery-${deliveryId}`).emit(event, data);
  return true;
};

const getActiveConnections = () => {
  return {
    total: activeConnections.size,
    deliveries: deliveryConnections.size
  };
};

module.exports = {
  initializeWebSocket,
  notifyUser,
  notifyDeliveryParticipants,
  getActiveConnections
};