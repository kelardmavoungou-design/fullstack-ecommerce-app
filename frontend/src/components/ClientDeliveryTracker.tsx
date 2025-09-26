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
  AlertCircle
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

interface ClientDeliveryTrackerProps {
  delivery: Delivery;
  userId: number;
}

export default function ClientDeliveryTracker({ delivery, userId }: ClientDeliveryTrackerProps) {
  const [deliveryLocation, setDeliveryLocation] = useState<{lat: number, lng: number} | null>(null);

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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Suivi de livraison</h1>
            <p className="text-gray-600">Suivez votre commande en temps réel</p>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </div>

      {/* Statut de la livraison */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Commande #{delivery.order.id}
            <Badge className={getStatusColor(delivery.status)}>
              {getStatusLabel(delivery.status)}
            </Badge>
          </CardTitle>
          <CardDescription>
            Commandée le {new Date(delivery.assigned_at).toLocaleDateString('fr-FR')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Adresse de livraison</h4>
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {delivery.order.shipping_address}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Progression</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Produits collectés</span>
                  <span>{delivery.collected_products}/{delivery.total_products}</span>
                </div>
                <Progress value={delivery.progress} className="h-2" />
                <p className="text-xs text-gray-500">
                  {delivery.progress.toFixed(1)}% terminé
                </p>
              </div>
            </div>
          </div>

          {/* Notifications temps réel */}
          {productProgress && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Package className="h-4 w-4" />
                <span className="text-sm font-medium">{productProgress.message}</span>
              </div>
            </div>
          )}

          {deliveryReady && (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <Truck className="h-4 w-4" />
                <span className="text-sm font-medium">{deliveryReady.message}</span>
              </div>
            </div>
          )}

          {deliveryCompleted && (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{deliveryCompleted.message}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Carte interactive */}
      {delivery.status === 'en_route' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Position du livreur en temps réel
            </CardTitle>
            <CardDescription>
              Suivez le trajet de votre livreur sur la carte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MapView
              deliveryPersonLocation={deliveryLocation || undefined}
              customerLocation={delivery.order.delivery_latitude && delivery.order.delivery_longitude ? {
                lat: delivery.order.delivery_latitude,
                lng: delivery.order.delivery_longitude
              } : undefined}
              shopLocations={[]} // Pas besoin d'afficher les boutiques pour le client
              height="400px"
              showRoute={false}
            />

            {deliveryLocation && delivery.order.delivery_latitude && delivery.order.delivery_longitude && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Navigation className="h-4 w-4" />
                    <span className="text-sm font-medium">Distance estimée</span>
                  </div>
                  <span className="text-sm font-bold text-blue-900">
                    {calculateDistance(
                      deliveryLocation.lat,
                      deliveryLocation.lng,
                      delivery.order.delivery_latitude,
                      delivery.order.delivery_longitude
                    ).toFixed(1)} km
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Position mise à jour: {new Date().toLocaleTimeString('fr-FR')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Produits commandés */}
      <Card>
        <CardHeader>
          <CardTitle>Produits commandés</CardTitle>
          <CardDescription>
            Liste des articles dans votre commande
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {delivery.order.items.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{item.product.name}</h4>
                  <p className="text-sm text-gray-500">Quantité: {item.quantity}</p>
                </div>
                <Badge variant="outline">
                  {delivery.productCollections.find(pc => pc.product_id === item.product.id)?.status === 'collected' ? 'Collecté' : 'En attente'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}