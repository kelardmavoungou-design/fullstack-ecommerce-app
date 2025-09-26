import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  deliveryPersonLocation?: { lat: number; lng: number };
  customerLocation?: { lat: number; lng: number };
  shopLocations?: Array<{
    id: number;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    collected?: boolean;
  }>;
  height?: string;
  showRoute?: boolean;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

export default function MapView({
  deliveryPersonLocation,
  customerLocation,
  shopLocations = [],
  height = "400px",
  showRoute = true,
  onLocationUpdate
}: MapViewProps) {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([5.3167, -4.0333]); // Abidjan par défaut
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [eta, setEta] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [routePoints, setRoutePoints] = useState<Array<[number, number]>>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Position de test pour vérifier que la carte fonctionne
  useEffect(() => {
    // Position de test à Abidjan (Côte d'Ivoire)
    const testLocation = { lat: 5.3167, lng: -4.0333 };
    console.log('MapView: Position de test:', testLocation);
    setCurrentLocation(testLocation);
  }, []);

  // Calculer le centre de la carte basé sur tous les points
  useEffect(() => {
    const allLocations = [
      deliveryPersonLocation,
      customerLocation,
      ...shopLocations.map(shop => shop.latitude && shop.longitude ? { lat: shop.latitude, lng: shop.longitude } : null).filter(Boolean)
    ].filter(Boolean) as Array<{ lat: number; lng: number }>;

    if (allLocations.length > 0) {
      const avgLat = allLocations.reduce((sum, loc) => sum + loc.lat, 0) / allLocations.length;
      const avgLng = allLocations.reduce((sum, loc) => sum + loc.lng, 0) / allLocations.length;
      setMapCenter([avgLat, avgLng]);
    }
  }, [deliveryPersonLocation, customerLocation, shopLocations]);

  // Fonction pour obtenir la position GPS
  const getCurrentPosition = () => {
    console.log('MapView: Demande de position GPS');

    if (!navigator.geolocation) {
      setGpsError('Géolocalisation non supportée par ce navigateur');
      return;
    }

    setGpsError(null);
    setIsGpsActive(true);

    // Essayer d'abord getCurrentPosition pour une position immédiate
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('MapView: Position immédiate reçue:', position.coords);
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(newLocation);
        if (onLocationUpdate) {
          onLocationUpdate(newLocation);
        }
      },
      (error) => {
        console.error('MapView: Erreur position immédiate:', error);
        setGpsError(`Erreur GPS: ${error.message}`);
        setIsGpsActive(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // Puis démarrer le suivi continu
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        console.log('MapView: Position continue reçue:', position.coords);
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(newLocation);
        setGpsError(null);
        if (onLocationUpdate) {
          onLocationUpdate(newLocation);
        }
      },
      (error) => {
        console.error('MapView: Erreur suivi continu:', error);
        setGpsError(`Erreur GPS continue: ${error.message}`);
        setIsGpsActive(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 27000
      }
    );

    // Nettoyer après 5 minutes (éviter la batterie)
    setTimeout(() => {
      navigator.geolocation.clearWatch(watchId);
      setIsGpsActive(false);
      console.log('MapView: Arrêt automatique du GPS après 5 minutes');
    }, 5 * 60 * 1000);

    return watchId;
  };

  // Géolocalisation automatique au montage si onLocationUpdate est fourni
  useEffect(() => {
    if (onLocationUpdate) {
      console.log('MapView: Démarrage automatique du GPS');
      getCurrentPosition();
    }
  }, [onLocationUpdate]);

  // Créer des icônes personnalisées
  const createCustomIcon = (color: string, icon: string) => {
    return L.divIcon({
      html: `<div style="
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        font-size: 14px;
        color: white;
      ">${icon}</div>`,
      className: 'custom-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  };

  // Icônes pour différents types de marqueurs
  const deliveryPersonIcon = createCustomIcon('#3B82F6', '🚚');
  const customerIcon = createCustomIcon('#EF4444', '🏠');
  const shopIcon = (collected: boolean) => createCustomIcon(collected ? '#10B981' : '#F59E0B', collected ? '✅' : '🏪');
  const currentLocationIcon = createCustomIcon('#8B5CF6', '📍');

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

  // Calculer la route optimale (simplifiée)
  const calculateRoute = (): [number, number][] => {
    if (!deliveryPersonLocation || !customerLocation || shopLocations.length === 0) return [];

    const points: [number, number][] = [];

    // Ajouter la position du livreur
    points.push([deliveryPersonLocation.lat, deliveryPersonLocation.lng]);

    // Ajouter les boutiques non collectées
    shopLocations
      .filter(shop => !shop.collected && shop.latitude && shop.longitude)
      .forEach(shop => {
        points.push([shop.latitude!, shop.longitude!]);
      });

    // Ajouter la destination finale
    points.push([customerLocation.lat, customerLocation.lng]);

    return points;
  };

  // Calculer l'ETA (Estimated Time of Arrival)
  const calculateETA = (distance: number, averageSpeed: number = 25): number => {
    // Vitesse moyenne en ville: 25 km/h
    // Conversion en minutes
    return Math.round((distance / averageSpeed) * 60);
  };

  // Calculer la vitesse basée sur les positions précédentes
  const calculateSpeed = (currentPos: {lat: number, lng: number}, previousPos: {lat: number, lng: number}, timeDiff: number): number => {
    const distance = calculateDistance(currentPos.lat, currentPos.lng, previousPos.lat, previousPos.lng);
    const speedKmh = (distance / (timeDiff / 3600)); // km/h
    return speedKmh;
  };

  // Mettre à jour les statistiques en temps réel
  useEffect(() => {
    if (deliveryPersonLocation && customerLocation) {
      const dist = calculateDistance(
        deliveryPersonLocation.lat,
        deliveryPersonLocation.lng,
        customerLocation.lat,
        customerLocation.lng
      );
      setDistance(dist);

      const etaMinutes = calculateETA(dist);
      setEta(etaMinutes);

      setLastUpdate(new Date());
    }
  }, [deliveryPersonLocation, customerLocation]);

  // Calculer la route avec les points
  useEffect(() => {
    const points = calculateRoute();
    setRoutePoints(points);
  }, [deliveryPersonLocation, customerLocation, shopLocations]);

  console.log('MapView: Rendu du composant avec center:', mapCenter);

  try {
  return (
    <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Position actuelle du livreur (si GPS actif) */}
        {currentLocation && (
          <Marker position={[currentLocation.lat, currentLocation.lng]} icon={currentLocationIcon}>
            <Popup>
              <div className="text-center">
                <strong>📍 Votre position actuelle</strong><br />
                <small>{currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</small>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Position du livreur (depuis les données) */}
        {deliveryPersonLocation && (
          <Marker position={[deliveryPersonLocation.lat, deliveryPersonLocation.lng]} icon={deliveryPersonIcon}>
            <Popup>
              <div className="text-center">
                <strong>🚚 Position du livreur</strong><br />
                <small>{deliveryPersonLocation.lat.toFixed(6)}, {deliveryPersonLocation.lng.toFixed(6)}</small>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Position du client */}
        {customerLocation && (
          <Marker position={[customerLocation.lat, customerLocation.lng]} icon={customerIcon}>
            <Popup>
              <div className="text-center">
                <strong>🏠 Client</strong><br />
                <small>{customerLocation.lat.toFixed(6)}, {customerLocation.lng.toFixed(6)}</small>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Boutiques */}
        {shopLocations.map((shop) => {
          if (!shop.latitude || !shop.longitude) return null;

          return (
            <Marker
              key={shop.id}
              position={[shop.latitude, shop.longitude]}
              icon={shopIcon(shop.collected || false)}
            >
              <Popup>
                <div className="text-center">
                  <strong>{shop.collected ? '✅' : '🏪'} {shop.name}</strong><br />
                  {shop.address && <small>{shop.address}</small>}<br />
                  <small>{shop.latitude.toFixed(6)}, {shop.longitude.toFixed(6)}</small>
                  <br />
                  <span className={`text-xs px-2 py-1 rounded ${
                    shop.collected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {shop.collected ? 'Collecté' : 'À collecter'}
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Route */}
        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            color="#3B82F6"
            weight={3}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}
      </MapContainer>

      {/* Légende */}
      <div className="absolute top-2 right-2 bg-white p-2 rounded shadow-md text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Livreur</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>Client</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span>Boutique</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Collecté</span>
          </div>
        </div>
      </div>

      {/* Informations GPS et statistiques Uber-like */}
      <div className="absolute bottom-2 left-2 bg-white p-4 rounded-lg shadow-lg text-sm max-w-sm border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isGpsActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="font-semibold text-gray-900">{isGpsActive ? 'GPS actif' : 'GPS inactif'}</span>
          </div>
          <button
            onClick={getCurrentPosition}
            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
            disabled={isGpsActive}
          >
            {isGpsActive ? 'Suivi...' : 'Activer GPS'}
          </button>
        </div>

        {/* Statistiques de trajet */}
        {distance !== null && eta !== null && (
          <div className="space-y-2 mb-3 p-2 bg-blue-50 rounded">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Distance:</span>
              <span className="font-semibold text-blue-700">{distance.toFixed(1)} km</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ETA:</span>
              <span className="font-semibold text-blue-700">
                {eta < 60 ? `${eta} min` : `${Math.floor(eta/60)}h ${eta%60}min`}
              </span>
            </div>
            {speed !== null && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Vitesse:</span>
                <span className="font-semibold text-blue-700">{speed.toFixed(1)} km/h</span>
              </div>
            )}
          </div>
        )}

        {currentLocation && (
          <div className="text-gray-600 text-xs">
            📍 {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
          </div>
        )}

        {lastUpdate && (
          <div className="text-gray-500 text-xs mt-1">
            Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
          </div>
        )}

        {gpsError && (
          <div className="text-red-600 mt-2 text-xs">
            ⚠️ {gpsError}
          </div>
        )}

        {!navigator.geolocation && (
          <div className="text-orange-600 mt-2 text-xs">
            ⚠️ Géolocalisation non supportée
          </div>
        )}
      </div>
    </div>
  );
  } catch (error) {
    console.error('MapView: Erreur lors du rendu de la carte:', error);
    return (
      <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border bg-red-50 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-red-600 text-lg font-semibold mb-2">Erreur de carte</div>
          <div className="text-red-500 text-sm">
            Impossible de charger la carte Leaflet.<br />
            Vérifiez la console pour plus de détails.
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Erreur: {error instanceof Error ? error.message : 'Erreur inconnue'}
          </div>
        </div>
      </div>
    );
  }
}