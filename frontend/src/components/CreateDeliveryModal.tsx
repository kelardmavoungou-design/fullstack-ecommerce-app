import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { Plus, Minus, MapPin, User, Store, Package } from "lucide-react";

interface CreateDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeliveryCreated: () => void;
}

interface Buyer {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
}

interface Shop {
  id: string;
  name: string;
  seller_name: string;
  latitude?: number;
  longitude?: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  shop_id: string;
  shop_name: string;
}

interface DeliveryItem {
  product_id: string;
  quantity: number;
  product: Product;
}

export function CreateDeliveryModal({ isOpen, onClose, onDeliveryCreated }: CreateDeliveryModalProps) {
  const [step, setStep] = useState(1);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState<any[]>([]);

  // Form data
  const [selectedBuyer, setSelectedBuyer] = useState<string>("");
  const [selectedShop, setSelectedShop] = useState<string>("");
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState<string>("");
  const [deliveryLatitude, setDeliveryLatitude] = useState<string>("");
  const [deliveryLongitude, setDeliveryLongitude] = useState<string>("");
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadBuyers();
      loadDeliveryPersonnel();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setStep(1);
    setSelectedBuyer("");
    setSelectedShop("");
    setDeliveryItems([]);
    setShippingAddress("");
    setDeliveryLatitude("");
    setDeliveryLongitude("");
    setSelectedDeliveryPerson("");
    setNotes("");
  };

  const loadBuyers = async () => {
    try {
      let token = sessionStorage.getItem('somba_token');
      if (!token) token = localStorage.getItem('somba_token');

      const response = await fetch('http://localhost:4000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.users) {
          const buyersList = data.users.filter((user: any) => user.role === 'buyer');
          setBuyers(buyersList);
        }
      }
    } catch (error) {
      console.error('Error loading buyers:', error);
      toast.error('Erreur lors du chargement des clients');
    }
  };

  const loadDeliveryPersonnel = async () => {
    try {
      let token = sessionStorage.getItem('somba_token');
      if (!token) token = localStorage.getItem('somba_token');

      const response = await fetch('http://localhost:4000/api/admin/delivery-personnel', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.personnel) {
          setDeliveryPersonnel(data.personnel);
        }
      }
    } catch (error) {
      console.error('Error loading delivery personnel:', error);
      toast.error('Erreur lors du chargement des livreurs');
    }
  };

  const loadShops = async () => {
    try {
      let token = sessionStorage.getItem('somba_token');
      if (!token) token = localStorage.getItem('somba_token');

      const response = await fetch('http://localhost:4000/api/admin/shops', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.shops) {
          setShops(data.shops);
        }
      }
    } catch (error) {
      console.error('Error loading shops:', error);
      toast.error('Erreur lors du chargement des boutiques');
    }
  };

  const loadProducts = async (shopId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/public/products?shop_id=${shopId}`);

      if (response.ok) {
        const data = await response.json();
        if (data.products) {
          setProducts(data.products);
        }
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Erreur lors du chargement des produits');
    }
  };

  const handleShopChange = (shopId: string) => {
    setSelectedShop(shopId);
    setDeliveryItems([]);
    if (shopId) {
      loadProducts(shopId);
    } else {
      setProducts([]);
    }
  };

  const addProductToDelivery = (product: Product) => {
    const existingItem = deliveryItems.find(item => item.product_id === product.id);

    if (existingItem) {
      setDeliveryItems(prev => prev.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setDeliveryItems(prev => [...prev, {
        product_id: product.id,
        quantity: 1,
        product: product
      }]);
    }
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setDeliveryItems(prev => prev.filter(item => item.product_id !== productId));
    } else {
      setDeliveryItems(prev => prev.map(item =>
        item.product_id === productId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const calculateTotal = () => {
    return deliveryItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const handleNext = () => {
    if (step === 1 && (!selectedBuyer || !selectedShop)) {
      toast.error('Veuillez sélectionner un client et une boutique');
      return;
    }
    if (step === 2 && deliveryItems.length === 0) {
      toast.error('Veuillez ajouter au moins un produit');
      return;
    }
    if (step === 3 && (!shippingAddress || !deliveryLatitude || !deliveryLongitude)) {
      toast.error('Veuillez saisir l\'adresse de livraison et les coordonnées GPS');
      return;
    }
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!selectedDeliveryPerson) {
      toast.error('Veuillez sélectionner un livreur');
      return;
    }

    setIsSubmitting(true);
    try {
      let token = sessionStorage.getItem('somba_token');
      if (!token) token = localStorage.getItem('somba_token');

      const deliveryData = {
        buyer_id: parseInt(selectedBuyer),
        shop_id: parseInt(selectedShop),
        items: deliveryItems.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: item.quantity
        })),
        shipping_address: shippingAddress,
        delivery_latitude: parseFloat(deliveryLatitude),
        delivery_longitude: parseFloat(deliveryLongitude),
        delivery_person_id: parseInt(selectedDeliveryPerson),
        notes: notes || null
      };

      const response = await fetch('http://localhost:4000/api/admin/deliveries/create-complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deliveryData)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Livraison créée avec succès !');
        onDeliveryCreated();
        onClose();
        resetForm();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erreur lors de la création de la livraison');
      }
    } catch (error) {
      console.error('Error creating delivery:', error);
      toast.error('Erreur lors de la création de la livraison');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="buyer-select" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Sélectionner un client
          </Label>
          <Select value={selectedBuyer} onValueChange={setSelectedBuyer}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un client..." />
            </SelectTrigger>
            <SelectContent>
              {buyers.map((buyer) => (
                <SelectItem key={buyer.id} value={buyer.id}>
                  {buyer.full_name} - {buyer.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shop-select" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Sélectionner une boutique
          </Label>
          <Select value={selectedShop} onValueChange={handleShopChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir une boutique..." />
            </SelectTrigger>
            <SelectContent>
              {shops.map((shop) => (
                <SelectItem key={shop.id} value={shop.id}>
                  {shop.name} - {shop.seller_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedBuyer && selectedShop && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium">Prêt pour l'étape suivante</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            Client et boutique sélectionnés. Vous pouvez maintenant ajouter des produits.
          </p>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Produits disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
          {products.map((product) => (
            <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-gray-600">{(product.price / 1000).toFixed(0)}K F CFA</p>
                    <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addProductToDelivery(product)}
                    className="ml-2"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {deliveryItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Produits sélectionnés</h3>
          <div className="space-y-3">
            {deliveryItems.map((item) => (
              <div key={item.product_id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{item.product.name}</h4>
                  <p className="text-sm text-gray-600">{(item.product.price / 1000).toFixed(0)}K F CFA × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateProductQuantity(item.product_id, item.quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateProductQuantity(item.product_id, item.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="border-t pt-3">
              <div className="flex justify-between items-center font-semibold">
                <span>Total:</span>
                <span>{(calculateTotal() / 1000).toFixed(0)}K F CFA</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <Label htmlFor="shipping-address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Adresse de livraison
          </Label>
          <Input
            id="shipping-address"
            placeholder="Entrez l'adresse complète de livraison..."
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              placeholder="Ex: 3.866667"
              value={deliveryLatitude}
              onChange={(e) => setDeliveryLatitude(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              placeholder="Ex: 11.516667"
              value={deliveryLongitude}
              onChange={(e) => setDeliveryLongitude(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optionnel)</Label>
          <Input
            id="notes"
            placeholder="Instructions spéciales pour la livraison..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Sélectionner un livreur
          </Label>
          <Select value={selectedDeliveryPerson} onValueChange={setSelectedDeliveryPerson}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Choisir un livreur..." />
            </SelectTrigger>
            <SelectContent>
              {deliveryPersonnel.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.full_name} ({person.active_deliveries} livraisons actives)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Récapitulatif de la livraison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Client:</span>
              <p>{buyers.find(b => b.id === selectedBuyer)?.full_name}</p>
            </div>
            <div>
              <span className="font-medium">Boutique:</span>
              <p>{shops.find(s => s.id === selectedShop)?.name}</p>
            </div>
            <div>
              <span className="font-medium">Adresse:</span>
              <p className="truncate">{shippingAddress}</p>
            </div>
            <div>
              <span className="font-medium">Livreur:</span>
              <p>{deliveryPersonnel.find(p => p.id === selectedDeliveryPerson)?.full_name}</p>
            </div>
          </div>

          <div>
            <span className="font-medium">Produits ({deliveryItems.length}):</span>
            <div className="mt-2 space-y-1">
              {deliveryItems.map((item) => (
                <div key={item.product_id} className="flex justify-between text-sm">
                  <span>{item.product.name} × {item.quantity}</span>
                  <span>{(item.product.price * item.quantity / 1000).toFixed(0)}K F CFA</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
              <span>Total:</span>
              <span>{(calculateTotal() / 1000).toFixed(0)}K F CFA</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle livraison</DialogTitle>
          <DialogDescription>
            Étape {step} sur 4 - {step === 1 ? "Sélection client et boutique" :
                                   step === 2 ? "Ajout des produits" :
                                   step === 3 ? "Adresse de livraison" :
                                   "Assignation du livreur"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-6">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>

          {step > 1 && (
            <Button variant="outline" onClick={handlePrevious}>
              Précédent
            </Button>
          )}

          {step < 4 ? (
            <Button onClick={handleNext} disabled={isLoading}>
              Suivant
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Création...' : 'Créer la livraison'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}