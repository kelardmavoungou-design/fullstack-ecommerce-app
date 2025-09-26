import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import {
  Package,
  User,
  MapPin,
  Clock,
  CheckCircle,
  X,
  Truck
} from "lucide-react";

interface AssignDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeliveryAssigned: () => void;
}

interface PendingOrder {
  id: string;
  buyer: {
    full_name: string;
    email: string;
    phone_number?: string;
  };
  shop: {
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  total: number;
  shipping_address?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  created_at: string;
}

interface DeliveryPersonnel {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  active_deliveries: number;
  availability: 'available' | 'busy' | 'overloaded';
}

export function AssignDeliveryModal({ isOpen, onClose, onDeliveryAssigned }: AssignDeliveryModalProps) {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState<DeliveryPersonnel[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Load pending orders and delivery personnel when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPendingOrders();
      loadDeliveryPersonnel();
    }
  }, [isOpen]);

  const loadPendingOrders = async () => {
    try {
      setIsLoading(true);
      let token = sessionStorage.getItem('somba_token');
      if (!token) {
        token = localStorage.getItem('somba_token');
      }
      if (!token) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }

      const response = await fetch('http://localhost:4000/api/admin/orders/pending-delivery', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.orders) {
          setPendingOrders(data.orders);
        }
      } else {
        console.error('Failed to load pending orders:', response.status);
        toast.error('Erreur lors du chargement des commandes en attente');
      }
    } catch (error) {
      console.error('Error loading pending orders:', error);
      toast.error('Erreur lors du chargement des commandes en attente');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeliveryPersonnel = async () => {
    try {
      let token = sessionStorage.getItem('somba_token');
      if (!token) {
        token = localStorage.getItem('somba_token');
      }
      if (!token) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }

      const response = await fetch('http://localhost:4000/api/admin/delivery-personnel', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.personnel) {
          setDeliveryPersonnel(data.personnel);
        }
      } else {
        console.error('Failed to load delivery personnel:', response.status);
        toast.error('Erreur lors du chargement du personnel de livraison');
      }
    } catch (error) {
      console.error('Error loading delivery personnel:', error);
      toast.error('Erreur lors du chargement du personnel de livraison');
    }
  };

  const handleAssignDelivery = async () => {
    if (!selectedOrder || !selectedDeliveryPerson) {
      toast.error('Veuillez sélectionner une commande et un livreur');
      return;
    }

    try {
      setIsAssigning(true);
      let token = sessionStorage.getItem('somba_token');
      if (!token) {
        token = localStorage.getItem('somba_token');
      }
      if (!token) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }

      const response = await fetch('http://localhost:4000/api/admin/deliveries/assign-to-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_id: parseInt(selectedOrder.id),
          delivery_person_id: parseInt(selectedDeliveryPerson),
          notes: notes.trim() || undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Livraison assignée avec succès');

        // Reset form
        setSelectedOrder(null);
        setSelectedDeliveryPerson("");
        setNotes("");

        // Refresh data
        loadPendingOrders();
        onDeliveryAssigned();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erreur lors de l\'assignation de la livraison');
      }
    } catch (error) {
      console.error('Error assigning delivery:', error);
      toast.error('Erreur lors de l\'assignation de la livraison');
    } finally {
      setIsAssigning(false);
    }
  };

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'busy':
        return <Badge className="bg-orange-100 text-orange-800">Occupé</Badge>;
      case 'overloaded':
        return <Badge className="bg-red-100 text-red-800">Surchargé</Badge>;
      default:
        return <Badge>Indisponible</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5" />
            <span>Assigner une Livraison</span>
          </DialogTitle>
          <DialogDescription>
            Sélectionnez une commande en attente et assignez-la à un livreur disponible
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Orders Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Commandes en Attente ({pendingOrders.length})</span>
            </h3>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Chargement des commandes...</p>
              </div>
            ) : pendingOrders.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600 text-lg mb-2">Toutes les commandes sont assignées</p>
                <p className="text-gray-500">Aucune commande en attente de livraison</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pendingOrders.map((order) => (
                  <Card
                    key={order.id}
                    className={`cursor-pointer transition-all ${
                      selectedOrder?.id === order.id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Commande #{order.id}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {(order.total / 1000).toFixed(0)}K F CFA
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        <div className="flex items-center space-x-1 mb-1">
                          <User className="h-3 w-3" />
                          <span>{order.buyer.full_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{order.shop.name}</span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center space-x-1">
                          <Package className="h-3 w-3" />
                          <span>{order.items.length} produit{order.items.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(order.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Assignment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Truck className="h-5 w-5" />
              <span>Assigner au Livreur</span>
            </h3>

            {selectedOrder ? (
              <div className="space-y-4">
                {/* Selected Order Summary */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-blue-900">Commande Sélectionnée</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Client:</span>
                        <span className="font-medium">{selectedOrder.buyer.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Boutique:</span>
                        <span className="font-medium">{selectedOrder.shop.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Produits:</span>
                        <span className="font-medium">{selectedOrder.items.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Total:</span>
                        <span className="font-medium">{(selectedOrder.total / 1000).toFixed(0)}K F CFA</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Person Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Sélectionner un livreur
                  </label>
                  <Select value={selectedDeliveryPerson} onValueChange={setSelectedDeliveryPerson}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un livreur..." />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryPersonnel.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{person.full_name}</span>
                            <div className="flex items-center space-x-2 ml-2">
                              {getAvailabilityBadge(person.availability)}
                              <span className="text-xs text-gray-500">
                                ({person.active_deliveries} actives)
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Notes (optionnel)
                  </label>
                  <Textarea
                    placeholder="Ajouter des instructions spéciales pour le livreur..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleAssignDelivery}
                    disabled={!selectedDeliveryPerson || isAssigning}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isAssigning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Assignation...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Assigner la Livraison
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedOrder(null);
                      setSelectedDeliveryPerson("");
                      setNotes("");
                    }}
                    variant="outline"
                    className="px-6"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 text-lg mb-2">Sélectionnez une commande</p>
                <p className="text-gray-500">Cliquez sur une commande à gauche pour l'assigner</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}