import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Truck,
  MapPin,
  Package,
  CheckCircle,
  Clock,
  Navigation,
  Phone,
  User,
  AlertCircle,
  Wifi,
  WifiOff,
  Car,
  Timer,
  Route
} from "lucide-react";
import MapView from "./MapView";
import useWebSocket from "../hooks/useWebSocket";

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

interface UberStyleTrackerProps {
  delivery: Delivery;
  userId: number;
}

export default function UberStyleTracker({ delivery, userId }: UberStyleTrackerProps) {
  const [deliveryLocation, setDeliveryLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // WebSocket pour recevoir les mises à jour temps réel
  const {
    isConnected,
    deliveryLocation: wsDeliveryLocation,
    deliveryStatus,
    productProgress,
    deliveryReady,
    deliveryCompleted,
    joinDelivery
  } = useWebSocket(userId, 'client');

  // Rejoindre la livraison au montage
  useEffect(() => {
    if (delivery?.id) {
      joinDelivery(delivery.id);
    }
  }, [delivery?.id, joinDelivery]);

  // Mettre à jour la position du livreur depuis WebSocket
  useEffect(() => {
    if (wsDeliveryLocation) {
      setDeliveryLocation(wsDeliveryLocation);
    }
  }, [wsDeliveryLocation]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'collecte_en_cours': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'en_route': return 'bg-green-100 text-green-800 border-green-200';
      case 'livré': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_attente': return 'Commande confirmée';
      case 'collecte_en_cours': return 'Préparation en cours';
      case 'en_route': return 'En route vers vous';
      case 'livré': return 'Livré';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'en_attente': return <Clock className="h-5 w-5" />;
      case 'collecte_en_cours': return <Package className="h-5 w-5" />;
      case 'en_route': return <Truck className="h-5 w-5" />;
      case 'livré': return <CheckCircle className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  // Calculer la distance entre deux points GPS
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

  if (!delivery) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune livraison active</h3>
              <p className="text-gray-500">Vous n'avez pas de livraison en cours.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-4">

        {/* Header avec statut */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${getStatusColor(delivery.status)}`}>
                  {getStatusIcon(delivery.status)}
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-900">Livraison #{delivery.order.id}</h2>
                  <p className="text-sm text-gray-600">{getStatusLabel(delivery.status)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <Wifi className="h-4 w-4" />
                    <span className="text-xs font-medium">En ligne</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-xs font-medium">Hors ligne</span>
                  </div>
                )}
              </div>
            </div>

            {/* Barre de progression */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progression</span>
                <span className="font-semibold">{delivery.collected_products}/{delivery.total_products}</span>
              </div>
              <Progress value={delivery.progress} className="h-2" />
              <p className="text-xs text-gray-500 text-center">
                {delivery.progress.toFixed(1)}% terminé
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Carte interactive (seulement si en route) */}
        {delivery.status === 'en_route' && (
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                <MapView
                  deliveryPersonLocation={deliveryLocation || undefined}
                  customerLocation={delivery.order.delivery_latitude && delivery.order.delivery_longitude ? {
                    lat: delivery.order.delivery_latitude,
                    lng: delivery.order.delivery_longitude
                  } : undefined}
                  shopLocations={[]} // Pas besoin d'afficher les boutiques pour le client
                  height="300px"
                  showRoute={false}
                />

                {/* Overlay avec ETA */}
                {deliveryLocation && delivery.order.delivery_latitude && delivery.order.delivery_longitude && (
                  <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Car className="h-5 w-5 text-blue-400" />
                        <span className="font-medium">Livreur en approche</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {calculateDistance(
                            deliveryLocation.lat,
                            deliveryLocation.lng,
                            delivery.order.delivery_latitude,
                            delivery.order.delivery_longitude
                          ).toFixed(1)} km
                        </div>
                        <div className="text-xs text-gray-300">Distance restante</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications temps réel */}
        <div className="space-y-3">
          {productProgress && (
            <Card className="border-l-4 border-l-blue-500 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">Mise à jour</p>
                    <p className="text-sm text-blue-700">{productProgress.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {deliveryReady && (
            <Card className="border-l-4 border-l-green-500 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Truck className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-900">En route !</p>
                    <p className="text-sm text-green-700">{deliveryReady.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {deliveryCompleted && (
            <Card className="border-l-4 border-l-purple-500 bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-purple-900">Livraison terminée !</p>
                    <p className="text-sm text-purple-700">{deliveryCompleted.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Détails de la livraison */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Détails de la livraison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Adresse */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Adresse de livraison</p>
                <p className="text-sm text-gray-600">{delivery.order.shipping_address}</p>
              </div>
            </div>

            {/* Livreur */}
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Livreur</p>
                <p className="text-sm text-gray-600">En cours d'assignation</p>
              </div>
            </div>

            {/* Produits */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Produits commandés</h4>
              <div className="space-y-2">
                {delivery.order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-xs text-gray-500">Quantité: {item.quantity}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {delivery.productCollections.find(pc => pc.product_id === item.product.id)?.status === 'collected' ? 'Prêt' : 'En préparation'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bouton d'urgence */}
        <Card className="border-0 shadow-lg bg-red-50 border-red-200">
          <CardContent className="p-4">
            <Button variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-100">
              <Phone className="h-4 w-4 mr-2" />
              Contacter le support
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}