import React from 'react';
import MapView from './MapView';

export default function MapTest() {
  // Données de test pour vérifier que la carte fonctionne
  const testDeliveryPersonLocation = { lat: 5.3200, lng: -4.0300 }; // Plateau, Abidjan
  const testCustomerLocation = { lat: 5.3167, lng: -4.0333 }; // Centre-ville, Abidjan
  const testShopLocations = [
    {
      id: 1,
      name: 'Tech Store Abidjan',
      address: 'Plateau, Abidjan',
      latitude: 5.3200,
      longitude: -4.0300,
      collected: false
    },
    {
      id: 2,
      name: 'Apple Store',
      address: 'Marcory, Abidjan',
      latitude: 5.3100,
      longitude: -4.0200,
      collected: true
    }
  ];

  const handleLocationUpdate = (location: { lat: number; lng: number }) => {
    console.log('Test: Nouvelle position GPS:', location);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test de la Carte Interactive</h1>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h2 className="font-semibold mb-2">Données de test :</h2>
        <ul className="text-sm space-y-1">
          <li>📍 Livreur: {testDeliveryPersonLocation.lat}, {testDeliveryPersonLocation.lng}</li>
          <li>🏠 Client: {testCustomerLocation.lat}, {testCustomerLocation.lng}</li>
          <li>🏪 Boutiques: {testShopLocations.length} (1 collectée, 1 à collecter)</li>
        </ul>
      </div>

      <MapView
        deliveryPersonLocation={testDeliveryPersonLocation}
        customerLocation={testCustomerLocation}
        shopLocations={testShopLocations}
        height="600px"
        showRoute={true}
        onLocationUpdate={handleLocationUpdate}
      />

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions de test :</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Vérifiez que la carte OpenStreetMap s'affiche</li>
          <li>Cliquez sur "Activer GPS" pour obtenir votre position réelle</li>
          <li>Vérifiez que les marqueurs s'affichent (bleu=livreur, rouge=client, jaune/vert=boutiques)</li>
          <li>Ouvrez la console du navigateur pour voir les logs GPS</li>
        </ol>
      </div>
    </div>
  );
}