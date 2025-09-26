import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Truck,
  Package,
  CheckCircle,
  Clock,
  QrCode,
  Phone,
  Store,
  User,
  Calendar,
  AlertCircle,
  Smartphone,
  RefreshCw,
  X
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import useWebSocket from "../hooks/useWebSocket";
import { LogOut } from "lucide-react";

interface Delivery {
  id: number;
  status: string;
  total_products: number;
  collected_products: number;
  progress: number;
  validation_code: string;
  assigned_at: string;
  picked_up_at?: string;
  delivered_at?: string;
  is_gps_active: boolean;
  order: {
    id: number;
    buyer: {
      full_name: string;
      phone_number: string;
    };
    shipping_address: string;
    delivery_latitude?: number;
    delivery_longitude?: number;
    items: Array<{
      product: {
        id: number;
        name: string;
        image?: string;
      };
      quantity: number;
    }>;
  };
  productCollections: Array<{
    id: number;
    product_id: number;
    shop_id: number;
    status: string;
    collected_at?: string;
    product: {
      id: number;
      name: string;
      image?: string;
    };
    shop: {
      id: number;
      name: string;
      address?: string;
      latitude?: number;
      longitude?: number;
    };
  }>;
}

export default function DeliveryDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isScanning, setIsScanning] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [cameraError, setCameraError] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket pour communication temps réel
  const {
    isConnected,
    deliveryLocation,
    deliveryStatus,
    productProgress,
    deliveryReady,
    deliveryCompleted,
    joinDelivery,
    updateLocation,
    updateDeliveryStatus,
    notifyProductCollected,
    notifyDeliveryReady,
    notifyDeliveryCompleted
  } = useWebSocket(user?.id, 'delivery');

  // Simuler le chargement des livraisons (remplacer par des appels API réels)
  useEffect(() => {
    loadDeliveries();
  }, []);


  const loadDeliveries = async () => {
    // Simulation de données - remplacer par un appel API réel
    const mockDeliveries: Delivery[] = [
      {
        id: 1,
        status: 'en_attente',
        total_products: 3,
        collected_products: 0,
        progress: 0,
        validation_code: 'DEL123ABC',
        assigned_at: new Date().toISOString(),
        is_gps_active: false,
        order: {
          id: 101,
          buyer: {
            full_name: 'Jean Dupont',
            phone_number: '+22501020304'
          },
          shipping_address: 'Abidjan, Plateau - Rue des Jardins',
          delivery_latitude: 5.3167,
          delivery_longitude: -4.0333,
          items: [
            { product: { id: 1, name: 'iPhone 15', image: '/api/placeholder/100/100' }, quantity: 1 },
            { product: { id: 2, name: 'MacBook Pro', image: '/api/placeholder/100/100' }, quantity: 1 },
            { product: { id: 3, name: 'AirPods', image: '/api/placeholder/100/100' }, quantity: 1 }
          ]
        },
        productCollections: [
          {
            id: 1,
            product_id: 1,
            shop_id: 1,
            status: 'pending',
            product: { id: 1, name: 'iPhone 15', image: '/api/placeholder/100/100' },
            shop: { id: 1, name: 'Tech Store Abidjan', address: 'Plateau, Abidjan', latitude: 5.3200, longitude: -4.0300 }
          },
          {
            id: 2,
            product_id: 2,
            shop_id: 2,
            status: 'pending',
            product: { id: 2, name: 'MacBook Pro', image: '/api/placeholder/100/100' },
            shop: { id: 2, name: 'Apple Store', address: 'Marcory, Abidjan', latitude: 5.3100, longitude: -4.0200 }
          },
          {
            id: 3,
            product_id: 3,
            shop_id: 1,
            status: 'pending',
            product: { id: 3, name: 'AirPods', image: '/api/placeholder/100/100' },
            shop: { id: 1, name: 'Tech Store Abidjan', address: 'Plateau, Abidjan', latitude: 5.3200, longitude: -4.0300 }
          }
        ]
      }
    ];

    setDeliveries(mockDeliveries);
    if (mockDeliveries.length > 0) {
      setSelectedDelivery(mockDeliveries[0]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'collecte_en_cours': return 'bg-blue-100 text-blue-800';
      case 'en_route': return 'bg-green-100 text-green-800';
      case 'livré': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_attente': return 'En attente';
      case 'collecte_en_cours': return 'Collecte en cours';
      case 'en_route': return 'En route';
      case 'livré': return 'Livré';
      default: return status;
    }
  };

  const handleCollectProduct = async (collectionId: number, productId: number) => {
    if (!selectedDelivery) return;

    // Trouver le produit collecté
    const collection = selectedDelivery.productCollections.find(c => c.id === collectionId);
    if (!collection) return;

    // Simulation de la collecte
    setSelectedDelivery(prev => {
      if (!prev) return prev;

      const updatedCollections = prev.productCollections.map(collection =>
        collection.id === collectionId
          ? { ...collection, status: 'collected', collected_at: new Date().toISOString() }
          : collection
      );

      const collectedCount = updatedCollections.filter(c => c.status === 'collected').length;
      const progress = (collectedCount / prev.total_products) * 100;

      let newStatus = prev.status;
      if (collectedCount === prev.total_products && prev.status === 'collecte_en_cours') {
        newStatus = 'en_route';
      } else if (collectedCount > 0 && prev.status === 'en_attente') {
        newStatus = 'collecte_en_cours';
      }

      return {
        ...prev,
        productCollections: updatedCollections,
        collected_products: collectedCount,
        progress,
        status: newStatus,
        ...(newStatus === 'en_route' && { picked_up_at: new Date().toISOString() })
      };
    });

    // Notifier via WebSocket
    if (selectedDelivery) {
      notifyProductCollected(selectedDelivery.id, collection.product.name, selectedDelivery.collected_products + 1, selectedDelivery.total_products);

      // Si tous les produits sont collectés, notifier que la livraison est prête
      const newCollectedCount = selectedDelivery.collected_products + 1;
      if (newCollectedCount === selectedDelivery.total_products) {
        setTimeout(() => {
          notifyDeliveryReady(selectedDelivery.id);
          updateDeliveryStatus(selectedDelivery.id, 'en_route', 100, 'Tous les produits collectés, livraison prête');
        }, 1000);
      }
    }

    // Ici, faire un appel API réel pour collecter le produit
    console.log(`Produit ${productId} collecté pour livraison ${selectedDelivery.id}`);
  };

  const handleStartDelivery = () => {
    if (!selectedDelivery) return;

    // Rejoindre la livraison via WebSocket
    joinDelivery(selectedDelivery.id);

    setSelectedDelivery(prev => prev ? { ...prev, is_gps_active: true } : prev);

    // Démarrer le suivi GPS temps réel
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          setCurrentLocation(newLocation);

          // Envoyer la position via WebSocket
          updateLocation(selectedDelivery.id, newLocation.lat, newLocation.lng);

          console.log('Position GPS envoyée:', newLocation);
        },
        (error) => {
          console.error('Erreur GPS:', error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: 27000
        }
      );

      // Arrêter automatiquement après 2 heures
      setTimeout(() => {
        navigator.geolocation.clearWatch(watchId);
        setSelectedDelivery(prev => prev ? { ...prev, is_gps_active: false } : prev);
        console.log('GPS arrêté automatiquement');
      }, 2 * 60 * 60 * 1000); // 2 heures
    }
  };

  const handleValidateDelivery = async (scanData: any) => {
    if (!selectedDelivery) return;
    setIsScanning(false);
    try {
      // Vérifier que le code scanné correspond au code de validation de la livraison
      if (scanData.validationCode !== selectedDelivery.validation_code) {
        toast.error("Code de validation incorrect. Veuillez vérifier le QR code du client.");
        return;
      }

      // Vérifier que l'orderId correspond (si présent dans les données scannées)
      if (scanData.orderId && scanData.orderId !== selectedDelivery.order.id) {
        toast.error("QR code ne correspond pas à cette livraison.");
        return;
      }

      // Appel API pour valider la livraison (mettre à jour le statut)
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/delivery/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}` // Ajouter le token d'authentification
        },
        body: JSON.stringify({
          deliveryId: selectedDelivery.id,
          status: 'delivered',
          notes: `Livraison validée via QR code. Code scanné: ${scanData.validationCode}`
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSelectedDelivery(prev => prev ? {
          ...prev,
          status: 'livré',
          delivered_at: new Date().toISOString(),
          is_gps_active: false
        } : prev);
        notifyDeliveryCompleted(selectedDelivery.id);
        toast.success("Livraison validée avec succès !");

        // Afficher les informations du client scanné
        if (scanData.buyerName) {
          console.log(`Livraison validée pour ${scanData.buyerName} (${scanData.buyerPhone || 'N/A'})`);
        }
      } else {
        toast.error(data.message || "Échec de la validation de livraison.");
      }
    } catch (e) {
      console.error('Erreur validation livraison:', e);
      toast.error("Erreur réseau lors de la validation.");
    }
  };

  // Fonction pour calculer la distance entre deux points GPS
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

  // Fonctions pour le scanner QR intégré
  const startCamera = async () => {
    console.log('Démarrage de la caméra intégrée...');
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      console.log('Stream caméra obtenu:', stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        videoRef.current.onloadedmetadata = async () => {
          console.log('Vidéo chargée, démarrage du scan');
          try {
            await videoRef.current!.play();
            scanIntervalRef.current = setInterval(captureFrame, 500);
          } catch (playError) {
            console.error('Erreur play vidéo:', playError);
            setCameraError("Impossible de démarrer la vidéo");
          }
        };
      }
    } catch (error: any) {
      console.error('Erreur caméra:', error);
      setCameraError("Impossible d'accéder à la caméra");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code && code.data) {
      console.log('QR code détecté:', code.data);
      stopCamera();
      handleValidateDelivery({
        validationCode: code.data,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Démarrer la caméra quand on passe en mode scan
  useEffect(() => {
    if (isScanning) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isScanning]);

  if (!selectedDelivery) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Truck className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune livraison assignée</h3>
              <p className="text-gray-500">Vous n'avez pas de livraison en cours.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-4">
            {isConnected ? (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Connecté</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium">Déconnecté</span>
              </div>
            )}
            <Button
              onClick={() => {
                logout();
                navigate('/');
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="collection">Collecte</TabsTrigger>
          <TabsTrigger value="delivery">Livraison</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        {/* Onglet Aperçu */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Livraisons aujourd'hui</p>
                    <p className="text-2xl font-bold">{deliveries.length}</p>
                  </div>
                  <Truck className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">En cours</p>
                    <p className="text-2xl font-bold">
                      {deliveries.filter(d => d.status !== 'livré').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Terminées</p>
                    <p className="text-2xl font-bold">
                      {deliveries.filter(d => d.status === 'livré').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">GPS Actif</p>
                    <p className="text-2xl font-bold">
                      {deliveries.filter(d => d.is_gps_active).length}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Livraison actuelle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Livraison #{selectedDelivery.id}
                <Badge className={getStatusColor(selectedDelivery.status)}>
                  {getStatusLabel(selectedDelivery.status)}
                </Badge>
              </CardTitle>
              <CardDescription>
                Assignée le {new Date(selectedDelivery.assigned_at).toLocaleDateString('fr-FR')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Client</h4>
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {selectedDelivery.order.buyer.full_name}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selectedDelivery.order.buyer.phone_number}
                    </p>
                    <p className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {selectedDelivery.order.shipping_address}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Progression</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Produits collectés</span>
                      <span>{selectedDelivery.collected_products}/{selectedDelivery.total_products}</span>
                    </div>
                    <Progress value={selectedDelivery.progress} className="h-2" />
                    <p className="text-xs text-gray-500">
                      {selectedDelivery.progress.toFixed(1)}% terminé
                    </p>
                  </div>
                </div>
              </div>

              {selectedDelivery.is_gps_active && currentLocation && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Truck className="h-4 w-4" />
                    <span className="text-sm font-medium">GPS actif</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Position: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Collecte */}
        <TabsContent value="collection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Collecte des produits</CardTitle>
              <CardDescription>
                Récupérez les produits dans les boutiques selon l'ordre optimal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedDelivery.productCollections.map((collection, index) => (
                  <div key={collection.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{collection.product.name}</h4>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Store className="h-3 w-3" />
                            {collection.shop.name}
                          </p>
                        </div>
                      </div>
                      <Badge variant={collection.status === 'collected' ? 'default' : 'secondary'}>
                        {collection.status === 'collected' ? 'Collecté' : 'En attente'}
                      </Badge>
                    </div>

                    {collection.shop.address && (
                      <p className="text-sm text-gray-500 mb-3">
                        📍 {collection.shop.address}
                      </p>
                    )}

                    {collection.status !== 'collected' ? (
                      <Button
                        onClick={() => handleCollectProduct(collection.id, collection.product_id)}
                        className="w-full"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marquer comme collecté
                      </Button>
                    ) : (
                      <div className="text-green-600 text-sm flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Collecté le {new Date(collection.collected_at!).toLocaleString('fr-FR')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Onglet Livraison */}
        <TabsContent value="delivery" className="space-y-6">
          {selectedDelivery.status === 'en_route' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Livraison en cours
                </CardTitle>
                <CardDescription>
                  Suivez votre trajet vers le client en temps réel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <Truck className="h-5 w-5" />
                    <span className="font-medium">Navigation active</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Tous les produits ont été collectés. Rendez-vous chez le client.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Destination</h4>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {selectedDelivery.order.buyer.full_name}
                      </p>
                      <p className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {selectedDelivery.order.shipping_address}
                      </p>
                    </div>
                  </div>

                  {currentLocation && (
                    <div>
                      <h4 className="font-medium mb-2">Votre position</h4>
                      <div className="space-y-1 text-sm">
                        <p>📍 {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</p>
                        <p className="text-xs text-gray-500">Mise à jour en temps réel</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : selectedDelivery.status === 'collecte_en_cours' && selectedDelivery.collected_products === selectedDelivery.total_products ? (
            <Card>
              <CardHeader>
                <CardTitle>Prêt pour la livraison</CardTitle>
                <CardDescription>
                  Tous les produits ont été collectés, vous pouvez démarrer la livraison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleStartDelivery} className="w-full" size="lg">
                  <Truck className="h-5 w-5 mr-2" />
                  Démarrer la livraison
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Clock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Collecte en cours
                  </h3>
                  <p className="text-gray-500">
                    Récupérez tous les produits avant de pouvoir démarrer la livraison.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Validation */}
        <TabsContent value="validation" className="space-y-6">
          {selectedDelivery.status === 'en_route' ? (
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <QrCode className="h-6 w-6" />
                  Validation de livraison
                </CardTitle>
                <CardDescription>
                  Scannez le QR code du client ou saisissez le code manuellement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isScanning ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Scanner QR Code</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsScanning(false)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Fermer
                      </Button>
                    </div>

                    {cameraError ? (
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-red-600">{cameraError}</p>
                        <Button
                          onClick={startCamera}
                          className="mt-2"
                          variant="outline"
                        >
                          Réessayer
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-64 bg-black rounded-lg"
                          />
                          <canvas ref={canvasRef} className="hidden" />

                          {/* Overlay de ciblage */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                              <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-white"></div>
                              <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-white"></div>
                              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 border-white"></div>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-white"></div>
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">
                            Positionnez le QR code dans le cadre
                          </p>
                          <div className="flex justify-center">
                            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Code attendu */}
                    <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
                      <p className="text-sm text-blue-700 mb-2">Code de validation attendu</p>
                      <p className="text-2xl font-mono font-bold text-blue-900">{selectedDelivery.validation_code}</p>
                    </div>

                    {/* Options de validation */}
                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          console.log('Bouton Scanner QR Code cliqué - ouverture directe');
                          setIsScanning(true);
                        }}
                        className="w-full"
                        size="lg"
                      >
                        <QrCode className="h-5 w-5 mr-2" />
                        Scanner QR Code
                      </Button>

                      <div className="text-center">
                        <span className="text-sm text-gray-500">ou</span>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => {
                          handleValidateDelivery({
                            validationCode: selectedDelivery.validation_code,
                            timestamp: new Date().toISOString()
                          });
                        }}
                        className="w-full"
                        size="lg"
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Validation Manuelle
                      </Button>
                    </div>

                    {/* Instructions */}
                    <div className="text-xs text-gray-600 space-y-1">
                      <p className="font-medium">Instructions :</p>
                      <p>1. Demandez au client de présenter son QR code</p>
                      <p>2. Scannez le code ou cliquez sur "Validation Manuelle"</p>
                      <p>3. La livraison sera validée automatiquement</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertCircle className="h-16 w-16 mx-auto text-yellow-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Validation non disponible
                  </h3>
                  <p className="text-gray-500">
                    Démarrez d'abord la livraison pour pouvoir valider l'arrivée.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

        </TabsContent>
      </Tabs>
    </div>
  );
}