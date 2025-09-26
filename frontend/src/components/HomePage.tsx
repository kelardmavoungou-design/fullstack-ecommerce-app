import React, { useEffect, useState } from "react";
import { ArrowRight, Star, ShoppingBag, Truck, Shield, Headphones, TrendingUp, MapPin, Store, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { HeroCarousel } from "./HeroCarousel";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ProductCard } from "./ProductCard";
import { AdDisplay, AdCarousel } from "./AdDisplay";
import { toast } from "sonner";
import publicService from "../services/publicService";
import { Shop } from "../services/api";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

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

interface HomePageProps {
  onNavigateToLogin: () => void;
  onNavigateToCheckout: () => void;
  onCategoryClick: (category: string) => void;
  onProductClick: (product: Product) => void;
  onViewAllProducts: () => void;
  onNavigateToStores: () => void;
  products: Product[];
}

const categories = [
  {
    name: "Électronique",
    icon: "📱",
    image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZWxlY3Ryb25pY3N8ZW58MHx8MHx8fDA%3D",
    count: "2,500+"
  },
  {
    name: "Mode",
    icon: "👗",
    image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bW9kZXxlbnwwfHwwfHx8MA%3D%3D",
    count: "1,800+"
  },
  {
    name: "Électroménager",
    icon: "🏠",
    image: "https://images.unsplash.com/photo-1601121141499-17ae80afc03a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8JUVDJUE5JUEzbGVjdHJvbSVDMyVBOW5hZ2VyfGVufDB8fDB8fHww",
    count: "3,200+"
  },
  {
    name: "Sport",
    icon: "⚽",
    image: "https://images.unsplash.com/photo-1517649763942-7e3c76255df4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8c3BvcnR8ZW58MHx8MHx8fDA%3D",
    count: "900+"
  },
  {
    name: "Gaming",
    icon: "🎮",
    image: "https://images.unsplash.com/photo-1580327344181-c1163234e5a0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Z2FtaW5nfGVufDB8fDB8fHww",
    count: "1,100+"
  },
  {
    name: "Beauté",
    icon: "💄",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YmVhdXRlfGVufDB8fDB8fHww",
    count: "750+"
  }
];

const services = [
  {
    icon: Truck,
    title: "Livraison Rapide",
    description: "Recevez vos commandes sous 24h à Pointe-Noire et ses environs."
  },
  {
    icon: Shield,
    title: "Paiement Sécurisé",
    description: "Toutes vos transactions sont cryptées et 100% sécurisées."
  },
  {
    icon: Headphones,
    title: "Support Client 24/7",
    description: "Notre équipe est disponible à tout moment pour vous assister."
  },
  {
    icon: TrendingUp,
    title: "Qualité Garantie",
    description: "Nous sélectionnons les meilleurs produits pour vous."
  }
];

const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
    <div className="space-y-2">
      <div className="bg-gray-200 h-4 rounded w-3/4"></div>
      <div className="bg-gray-200 h-4 rounded w-1/2"></div>
      <div className="bg-gray-200 h-4 rounded w-1/4"></div>
    </div>
  </div>
);

export function HomePage({
  onNavigateToLogin,
  onNavigateToCheckout,
  onCategoryClick,
  onProductClick,
  onViewAllProducts,
  onNavigateToStores,
  products
}: HomePageProps) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('confirmed') === 'true') {
      toast.success("🎉 Email confirmé avec succès ! Bienvenue sur SOMBA !");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const fetchShops = async () => {
      setShopsLoading(true);
      try {
        const response = await publicService.getShops({ limit: 6 });
        if (response.success && response.data) {
          setShops(response.data.shops);
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
      } finally {
        setShopsLoading(false);
      }
    };
    fetchShops();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      setProductsLoading(false);
    }
  }, [products]);

  const featuredProducts = products
    .filter(p => p.name && p.name.trim() !== '')
    .slice(0, 8)
    .map(product => ({
      ...product,
      rating: product.rating || 4.5,
      reviews: product.reviews || Math.floor(Math.random() * 200) + 50
    }));

  return (
    <div className="min-h-screen bg-white space-y-12 md:space-y-16">
      <HeroCarousel />

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="border-0 shadow-none text-center md:text-left">
                <CardContent className="p-0 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-somba-accent/10 text-somba-accent rounded-lg">
                      <service.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-somba-primary text-md">{service.title}</h3>
                    <p className="text-gray-500 text-sm">{service.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-somba-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-somba-primary mb-2">Parcourir par Catégorie</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Trouvez ce que vous cherchez parmi notre vaste sélection de catégories.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <div
                key={category.name}
                className="group cursor-pointer text-center"
                onClick={() => onCategoryClick(category.name)}
              >
                <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white shadow-md group-hover:border-somba-accent transition-all duration-300">
                  <ImageWithFallback
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-somba-accent/30 transition-colors"></div>
                </div>
                <h3 className="font-semibold text-somba-primary group-hover:text-somba-accent">{category.name}</h3>
                <p className="text-xs text-gray-500">{category.count} articles</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner Ad Section */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <AdDisplay
            placement="home"
            className="max-w-4xl mx-auto"
            categories={categories.map(c => c.name)}
          />
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-somba-primary mb-2">Nouveautés et Tendances</h2>
              <p className="text-gray-600">Les articles les plus populaires du moment.</p>
            </div>
            <Button
              className="mt-4 md:mt-0 bg-somba-accent hover:bg-somba-accent/90 text-white"
              onClick={onViewAllProducts}
            >
              Voir tous les produits <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {productsLoading ? (
              [...Array(8)].map((_, index) => <SkeletonCard key={index} />)
            ) : (
              featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onProductClick={onProductClick}
                  onNavigateToCheckout={onNavigateToCheckout}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Top Shops Section */}
      {/* <section className="py-20 bg-somba-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-somba-primary mb-2">Nos Boutiques Vedettes</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Découvrez les boutiques les plus appréciées par notre communauté.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {shopsLoading ? (
              [...Array(3)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="bg-gray-200 h-24 rounded-lg"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              shops.map((shop) => (
                <Card key={shop.id} className="group hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                        <AvatarImage src={shop.logo_url} alt={shop.name} />
                        <AvatarFallback>{shop.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-somba-primary text-lg">{shop.name}</h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {shop.address || "Adresse non disponible"}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {shop.description || "Aucune description pour cette boutique."}
                    </p>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="border-somba-accent text-somba-accent">
                        {shop.product_count || 0} Produits
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-somba-accent hover:bg-somba-accent/10 hover:text-somba-accent"
                        onClick={onNavigateToStores}
                      >
                        Visiter <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <div className="text-center mt-12">
            <Button
              className="bg-somba-primary hover:bg-somba-primary/90 text-white"
              onClick={onNavigateToStores}
            >
              Découvrir toutes les boutiques
            </Button>
          </div>
        </div>
      </section> */}


    </div>
  );
}