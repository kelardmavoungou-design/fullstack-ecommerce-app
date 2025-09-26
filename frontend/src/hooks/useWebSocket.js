import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const useWebSocket = (userId, userType) => {
  const [isConnected, setIsConnected] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [productProgress, setProductProgress] = useState(null);
  const [deliveryReady, setDeliveryReady] = useState(false);
  const [deliveryCompleted, setDeliveryCompleted] = useState(false);

  // États pour les notifications admin
  const [adminProductCollected, setAdminProductCollected] = useState(null);
  const [adminDeliveryReady, setAdminDeliveryReady] = useState(null);
  const [adminDeliveryCompleted, setAdminDeliveryCompleted] = useState(null);

  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId || !userType) return;

    console.log('useWebSocket: Connecting to WebSocket server...');

    // Connexion au serveur WebSocket avec gestion d'erreur améliorée
    const socket = io('http://localhost:4000', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: false,
      upgrade: true
    });

    socketRef.current = socket;

    // Authentification
    socket.emit('authenticate', { userId, userType });

    socket.on('authenticated', (data) => {
      console.log('useWebSocket: Authenticated successfully', data);
      setIsConnected(true);
    });

    // Écoute des événements de livraison
    socket.on('delivery-location-update', (data) => {
      console.log('useWebSocket: Delivery location update', data);
      setDeliveryLocation(data);
    });

    socket.on('delivery-status-update', (data) => {
      console.log('useWebSocket: Delivery status update', data);
      setDeliveryStatus(data);
    });

    socket.on('product-collected', (data) => {
      console.log('useWebSocket: Product collected', data);
      setProductProgress(data);
    });

    socket.on('delivery-ready', (data) => {
      console.log('useWebSocket: Delivery ready', data);
      setDeliveryReady(true);
    });

    socket.on('delivery-completed', (data) => {
      console.log('useWebSocket: Delivery completed', data);
      setDeliveryCompleted(true);
    });

    // Événements pour les admins
    socket.on('admin-product-collected', (data) => {
      console.log('useWebSocket: Admin - Product collected', data);
      setAdminProductCollected(data);
    });

    socket.on('admin-delivery-ready', (data) => {
      console.log('useWebSocket: Admin - Delivery ready', data);
      setAdminDeliveryReady(data);
    });

    socket.on('admin-delivery-completed', (data) => {
      console.log('useWebSocket: Admin - Delivery completed', data);
      setAdminDeliveryCompleted(data);
    });

    socket.on('connect', () => {
      console.log('useWebSocket: Connected to server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('useWebSocket: Disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      // Réduire la verbosité des erreurs de connexion en développement
      if (process.env.NODE_ENV === 'development') {
        console.warn('useWebSocket: Connection error (tentative de reconnexion...)');
      }
      setIsConnected(false);
    });

    // Nettoyage
    return () => {
      console.log('useWebSocket: Cleaning up connection');
      socket.disconnect();
      setIsConnected(false);
    };
  }, [userId, userType]);

  // Fonctions pour envoyer des événements
  const joinDelivery = (deliveryId) => {
    if (socketRef.current && isConnected) {
      console.log('useWebSocket: Joining delivery', deliveryId);
      socketRef.current.emit('join-delivery', { deliveryId, userType });
    }
  };

  const updateLocation = (deliveryId, latitude, longitude) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('update-location', {
        deliveryId,
        latitude,
        longitude,
        userType
      });
    }
  };

  const updateDeliveryStatus = (deliveryId, status, progress, message) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('update-delivery-status', {
        deliveryId,
        status,
        progress,
        message
      });
    }
  };

  const notifyProductCollected = (deliveryId, productName, progress, total) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('product-collected', {
        deliveryId,
        productName,
        progress,
        total
      });
    }
  };

  const notifyDeliveryReady = (deliveryId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('delivery-ready', { deliveryId });
    }
  };

  const notifyDeliveryCompleted = (deliveryId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('delivery-completed', { deliveryId });
    }
  };

  return {
    // État
    isConnected,
    deliveryLocation,
    deliveryStatus,
    productProgress,
    deliveryReady,
    deliveryCompleted,

    // États admin
    adminProductCollected,
    adminDeliveryReady,
    adminDeliveryCompleted,

    // Actions
    joinDelivery,
    updateLocation,
    updateDeliveryStatus,
    notifyProductCollected,
    notifyDeliveryReady,
    notifyDeliveryCompleted,

    // Socket direct (pour usage avancé)
    socket: socketRef.current
  };
};

export default useWebSocket;