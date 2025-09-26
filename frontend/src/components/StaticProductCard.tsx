import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface StaticProductCardProps {
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  boutique: string;
  isOnSale?: boolean;
}

export function StaticProductCard({ 
  name, 
  price, 
  originalPrice, 
  image, 
  boutique, 
  isOnSale = false 
}: StaticProductCardProps) {
  return (
    <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-gray-200">
      <CardContent className="p-0">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
          <ImageWithFallback
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {isOnSale && (
            <Badge className="absolute top-2 right-2 bg-red-500 hover:bg-red-600">
              PROMO
            </Badge>
          )}
        </div>
        
        {/* Product Info */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-teal-700 transition-colors">
              {name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Boutique : {boutique}
            </p>
          </div>
          
          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">{price}</span>
            {originalPrice && (
              <span className="text-sm text-gray-500 line-through">{originalPrice}</span>
            )}
          </div>
          
          {/* Action Button */}
          <Button 
            className="w-full bg-red-500 hover:bg-red-600 text-white transition-colors"
            size="sm"
          >
            ACHETER
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}