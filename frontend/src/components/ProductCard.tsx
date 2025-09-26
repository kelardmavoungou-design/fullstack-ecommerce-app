import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Star, MapPin, ShoppingBag, CreditCard, Plus } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  boutique: string;
  isOnSale?: boolean;
  category: string;
  description?: string;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  sizes?: string[];
  colors?: string[];
  specifications?: { [key: string]: string };
  images?: string[];
  stock?: number;
}

interface ProductCardProps {
  product: Product;
  onProductClick?: (product: Product) => void;
  onNavigateToCheckout?: () => void;
  onNavigateToLogin?: () => void;
}

export function ProductCard({ product, onProductClick, onNavigateToCheckout, onNavigateToLogin }: ProductCardProps) {
  const { addToCart, items } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier si l'utilisateur est un vendeur
  const isSeller = user?.role === 'seller';
  const canPurchase = isAuthenticated && !isSeller;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche le clic sur la carte

    // Vérifier si l'utilisateur peut acheter
    if (!canPurchase) {
      if (isSeller) {
        toast.info("Mode vendeur", {
          description: "Vous êtes en mode vendeur. Utilisez un compte acheteur pour faire des achats.",
          duration: 3000,
        });
      } else {
        toast.info("Connexion requise", {
          description: "Veuillez vous connecter pour ajouter au panier",
          duration: 3000,
        });
      }
      return;
    }

    setIsLoading(true);

    // Simulation d'un délai pour l'animation
    await new Promise(resolve => setTimeout(resolve, 300));

    // Vérifier si le produit est déjà dans le panier
    const isInCart = items.some(item => item.id === product.id);

    if (!isInCart) {
      // Ajouter au panier s'il n'y est pas déjà
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        boutique: product.boutique,
        quantity: 1
      });

      // Toast de confirmation d'ajout
      toast.success("Produit ajouté au panier", {
        description: `${product.name} a été ajouté à votre panier`,
        duration: 2000,
      });
    } else {
      // Toast si déjà dans le panier
      toast.info("Produit déjà dans le panier", {
        description: `${product.name} est déjà dans votre panier`,
        duration: 2000,
      });
    }

    setIsLoading(false);
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche le clic sur la carte

    // Vérifier si l'utilisateur peut acheter
    if (!canPurchase) {
      if (isSeller) {
        toast.info("Mode vendeur", {
          description: "Vous êtes en mode vendeur. Utilisez un compte acheteur pour faire des achats.",
          duration: 3000,
        });
      } else {
        toast.info("Connexion requise", {
          description: "Veuillez vous connecter pour effectuer un achat",
          duration: 3000,
        });

        // Rediriger vers la page de connexion après un délai
        setTimeout(() => {
          if (onNavigateToLogin) {
            onNavigateToLogin();
          }
        }, 500);
      }
      return;
    }

    // D'abord ajouter au panier
    await handleAddToCart(e);

    // Toast de redirection
    toast.success("Redirection vers le checkout", {
      description: `Achat de ${product.name}`,
      duration: 1500,
    });

    // Naviguer vers checkout après un délai
    setTimeout(() => {
      if (onNavigateToCheckout) {
        onNavigateToCheckout();
      }
    }, 500);
  };

  const handleCardClick = () => {
    console.log('🖱️ ProductCard clicked:', {
      id: product.id,
      name: product.name,
      boutique: product.boutique,
      category: product.category
    });

    if (onProductClick) {
      console.log('✅ onProductClick handler found, calling it...');
      onProductClick(product);
    } else {
      console.warn('❌ onProductClick not provided to ProductCard');
    }
  };

  return (
    <Card 
      className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-somba-primary/10 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative">
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.isOnSale && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
            Promo
          </Badge>
        )}
        
        {/* Boutons flottants - Seulement pour les acheteurs */}
        {canPurchase && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Button
              onClick={handleAddToCart}
              disabled={isLoading}
              className="bg-somba-primary hover:bg-somba-primary/90 text-white p-2 shadow-lg"
              title="Ajouter au panier"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={handleBuyNow}
              disabled={isLoading}
              className="bg-somba-accent hover:bg-somba-accent/90 text-white p-2 shadow-lg"
              title="Acheter maintenant"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* Badge pour les vendeurs */}
        {isSeller && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-blue-500 text-white text-xs">
              Mode Vendeur
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        {product.rating && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{product.rating}</span>
            {product.reviews && (
              <span className="text-xs text-gray-500">({product.reviews})</span>
            )}
          </div>
        )}
        
        <h3 className="font-semibold mb-2 text-somba-primary group-hover:text-somba-accent transition-colors line-clamp-2">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-500">{product.boutique}</span>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="font-bold text-somba-accent">{product.price}</div>
            {product.originalPrice && (
              <div className="text-xs text-gray-500 line-through">{product.originalPrice}</div>
            )}
          </div>
          
          {/* Boutons d'action - Seulement pour les acheteurs */}
          {canPurchase ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={isLoading}
                variant="outline"
                className="flex-1 border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white transition-all duration-300"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                ) : (
                  <Plus className="h-3 w-3 mr-1" />
                )}
                Panier
              </Button>
              <Button
                size="sm"
                onClick={handleBuyNow}
                disabled={isLoading}
                className="flex-1 bg-somba-accent hover:bg-somba-accent/90 text-white transition-all duration-300"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                ) : null}
                Acheter
              </Button>
            </div>
          ) : (
            /* Message pour les vendeurs */
            <div className="text-center py-2">
              <p className="text-xs text-gray-500">
                {isSeller ? "Mode vendeur - Exploration uniquement" : "Connectez-vous pour acheter"}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}