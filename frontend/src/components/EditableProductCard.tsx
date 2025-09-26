import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Edit3, Save, X, Star, MapPin, ShoppingBag } from 'lucide-react';
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

interface EditableProductCardProps {
  product: Product;
  onUpdate: (product: Product) => void;
  onProductClick?: (product: Product) => void;
  isEditMode: boolean;
}

export function EditableProductCard({ product, onUpdate, onProductClick, isEditMode }: EditableProductCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState(product);
  const { addItem } = useCart();

  const handleSave = () => {
    onUpdate(editedProduct);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProduct(product);
    setIsEditing(false);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche le clic sur la carte
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      boutique: product.boutique,
      quantity: 1
    });
  };

  const handleCardClick = () => {
    if (!isEditMode && !isEditing && onProductClick) {
      onProductClick(product);
    }
  };

  if (!isEditMode) {
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
          <Button 
            onClick={handleAddToCart}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-somba-primary hover:bg-white p-2"
          >
            <ShoppingBag className="h-4 w-4" />
          </Button>
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
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-somba-accent">{product.price}</div>
              {product.originalPrice && (
                <div className="text-xs text-gray-500 line-through">{product.originalPrice}</div>
              )}
            </div>
            <Button 
              size="sm" 
              onClick={handleAddToCart}
              className="bg-somba-accent hover:bg-somba-accent/90 text-white"
            >
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300 relative border-somba-primary/20">
      {isEditMode && !isEditing && (
        <Button
          onClick={() => setIsEditing(true)}
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 bg-white/90 border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
        >
          <Edit3 className="h-4 w-4" />
        </Button>
      )}

      {isEditing && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <Button
            onClick={handleSave}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white p-1.5"
          >
            <Save className="h-3 w-3" />
          </Button>
          <Button
            onClick={handleCancel}
            variant="outline"
            size="sm"
            className="bg-white border-red-500 text-red-500 hover:bg-red-500 hover:text-white p-1.5"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="relative">
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        {product.isOnSale && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
            Promo
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {product.rating && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{product.rating}</span>
            {product.reviews && (
              <span className="text-xs text-gray-500">({product.reviews})</span>
            )}
          </div>
        )}

        {isEditing ? (
          <Input
            value={editedProduct.name}
            onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
            className="font-semibold border-somba-primary/30 focus:border-somba-accent"
          />
        ) : (
          <h3 className="font-semibold text-somba-primary">{product.name}</h3>
        )}

        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-gray-400" />
          {isEditing ? (
            <Input
              value={editedProduct.boutique}
              onChange={(e) => setEditedProduct({ ...editedProduct, boutique: e.target.value })}
              className="text-xs flex-1 border-somba-primary/30 focus:border-somba-accent"
            />
          ) : (
            <span className="text-xs text-gray-500">{product.boutique}</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            {isEditing ? (
              <div className="space-y-1">
                <Input
                  value={editedProduct.price}
                  onChange={(e) => setEditedProduct({ ...editedProduct, price: e.target.value })}
                  className="font-bold text-somba-accent border-somba-primary/30 focus:border-somba-accent"
                />
                {editedProduct.originalPrice && (
                  <Input
                    value={editedProduct.originalPrice}
                    onChange={(e) => setEditedProduct({ ...editedProduct, originalPrice: e.target.value })}
                    className="text-xs text-gray-500 border-somba-primary/30 focus:border-somba-accent"
                    placeholder="Prix original (optionnel)"
                  />
                )}
              </div>
            ) : (
              <div>
                <div className="font-bold text-somba-accent">{product.price}</div>
                {product.originalPrice && (
                  <div className="text-xs text-gray-500 line-through">{product.originalPrice}</div>
                )}
              </div>
            )}
          </div>
          
          {!isEditing && (
            <Button 
              size="sm" 
              onClick={handleAddToCart}
              className="bg-somba-accent hover:bg-somba-accent/90 text-white"
            >
              Ajouter
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}