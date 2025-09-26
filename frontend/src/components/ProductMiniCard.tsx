import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Star, MapPin, ShoppingBag } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useCart } from './CartContext';

interface Product {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  boutique: string;
  isOnSale?: boolean;
  category: string;
  rating?: number;
  reviews?: number;
}

interface ProductMiniCardProps {
  product: Product;
  onProductClick?: (product: Product) => void;
  showBoutique?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function ProductMiniCard({ 
  product, 
  onProductClick, 
  showBoutique = true,
  size = 'medium' 
}: ProductMiniCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      boutique: product.boutique,
      quantity: 1
    });
  };

  const handleCardClick = () => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const getImageHeight = () => {
    switch (size) {
      case 'small': return 'h-32';
      case 'large': return 'h-64';
      default: return 'h-48';
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small': return 'p-3';
      case 'large': return 'p-6';
      default: return 'p-4';
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
          className={`w-full ${getImageHeight()} object-cover group-hover:scale-105 transition-transform duration-300`}
        />
        {product.isOnSale && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
            Promo
          </Badge>
        )}
        <Button 
          onClick={handleAddToCart}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-somba-primary hover:bg-white p-2"
        >
          <ShoppingBag className="h-4 w-4" />
        </Button>
      </div>
      
      <CardContent className={getPadding()}>
        {product.rating && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{product.rating}</span>
            {product.reviews && (
              <span className="text-xs text-gray-500">({product.reviews})</span>
            )}
          </div>
        )}
        
        <h3 className={`font-semibold mb-2 text-somba-primary group-hover:text-somba-accent transition-colors line-clamp-2 ${
          size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'
        }`}>
          {product.name}
        </h3>
        
        {showBoutique && (
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500">{product.boutique}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <div className={`font-bold text-somba-accent ${
              size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'
            }`}>
              {product.price}
            </div>
            {product.originalPrice && (
              <div className="text-xs text-gray-500 line-through">{product.originalPrice}</div>
            )}
          </div>
          <Button 
            size={size === 'small' ? 'sm' : 'sm'}
            onClick={handleAddToCart}
            className="bg-somba-accent hover:bg-somba-accent/90 text-white"
          >
            {size === 'small' ? '+' : 'Ajouter'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}