import React from 'react';
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from './ui/sheet';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';

interface CartDrawerProps {
  children: React.ReactNode;
  onNavigateToLogin?: () => void;
  onNavigateToRegister?: () => void;
  onNavigateToCheckout?: () => void;
}

export function CartDrawer({ children, onNavigateToLogin, onNavigateToRegister, onNavigateToCheckout }: CartDrawerProps) {
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' F CFA';
  };

  const subtotal = getTotalPrice();
  const shippingCost = 0; // Gratuit
  const total = subtotal + shippingCost;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.info("Veuillez vous inscrire pour finaliser votre commande");
      if (onNavigateToRegister) {
        onNavigateToRegister();
      } else if (onNavigateToLogin) {
        // Fallback to login if register navigation is not provided
        onNavigateToLogin();
      }
    } else {
      if (onNavigateToCheckout) {
        onNavigateToCheckout();
      }
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="bg-teal-700 text-white -m-6 mb-6 px-6 py-4">
          <SheetTitle className="text-white text-center flex items-center justify-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Votre panier ({items.length} article{items.length > 1 ? 's' : ''})
          </SheetTitle>
          <SheetDescription className="text-white/80 text-center text-sm">
            {items.length === 0 
              ? "Aucun article dans votre panier" 
              : `Total: ${formatPrice(total)} • Livraison gratuite`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Votre panier est vide</p>
                <p className="text-sm">Ajoutez des produits pour commencer vos achats</p>
              </div>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="flex-1 space-y-4 overflow-y-auto max-h-80">
                {items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <ImageWithFallback
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-gray-900 line-clamp-2">{item.name}</h3>
                        <p className="text-orange-500 text-sm mt-1">
                          Prix unitaire : {item.price}
                        </p>
                        <p className="text-xs text-gray-500">
                          Boutique : {item.boutique}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <span className="w-12 text-center border rounded px-2 py-1 text-sm font-medium">
                          {item.quantity}
                        </span>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-200"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Total for this item and Remove Button */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="border-t pt-4 mt-4 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total ({items.reduce((sum, item) => sum + item.quantity, 0)} articles) :</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Frais de livraison :</span>
                    <span className="text-green-600 font-medium">Gratuit</span>
                  </div>
                  
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total :</span>
                      <span className="text-teal-700">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2"
                    size="lg"
                    onClick={handleCheckout}
                  >
                    <CreditCard className="h-4 w-4" />
                    {isAuthenticated ? 'Procéder au paiement' : 'S\'inscrire pour commander'}
                  </Button>
                  
                  {items.length > 0 && (
                    <Button
                      variant="outline"
                      className="w-full hover:bg-gray-50"
                      onClick={() => {
                        clearCart();
                        toast.success("Panier vidé");
                      }}
                    >
                      Vider le panier
                    </Button>
                  )}
                </div>

                {/* Security Notice */}
                <div className="text-xs text-gray-500 text-center border-t pt-3">
                  <p>🔒 Paiement sécurisé • Livraison gratuite • Support 24/7</p>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}