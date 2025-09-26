import React, { useState, useEffect } from "react";
import { Search, MapPin, Star, Phone, Clock, Filter, Grid, List, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useShops } from "../contexts/ShopsContext";
import { Shop } from "../services/api";

interface Store {
  id: number;
  name: string;
  image: string;
  description: string;
  location: {
    zone: string;
    address: string;
    city: string;
  };
  rating?: number;
  reviews?: number;
  categories?: string[];
  phone?: string;
  hours?: string;
  delivery?: boolean;
  verified: boolean;
  email?: string;
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  footer_description?: string;
}

interface StoresPageProps {
  onStoreClick?: (store: Store) => void;
  onViewProducts?: (storeName: string) => void;
}

export function StoresPage({ onStoreClick, onViewProducts }: StoresPageProps) {
  const { shops, loading, error, refreshShops } = useShops();
  const [stores, setStores] = useState<Store[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Load shops on component mount and set up periodic refresh
  useEffect(() => {
    const loadShops = async () => {
      await refreshShops();
    };

    loadShops();

    // Refresh shops every 30 seconds to show new shops
    const interval = setInterval(() => {
      refreshShops();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshShops]);

  // Map API shops to Store interface whenever shops change
  useEffect(() => {
    const mappedStores: Store[] = shops.map((shop: Shop) => {
      return {
        id: shop.id,
        name: shop.name,
        image: shop.logo || "",
        description: shop.description || "",
        location: {
          zone: shop.address ? shop.address.split(",")[0] || "" : "",
          address: shop.address || "",
          city: shop.address ? shop.address.split(",")[1]?.trim() || "" : "",
        },
        phone: shop.phone,
        hours: shop.opening_hours,
        verified: shop.is_active,
        email: shop.email,
        facebook_url: shop.facebook_url,
        twitter_url: shop.twitter_url,
        instagram_url: shop.instagram_url,
        youtube_url: shop.youtube_url,
        footer_description: shop.footer_description,
      };
    });
    setStores(mappedStores);
  }, [shops]);

  const zones = ["all", "Cocody", "Plateau", "Marcory", "Treichville", "Adjamé", "Yopougon"];
  const categories = ["all", "Électronique", "Mode", "Gaming", "Alimentaire", "Électroménager"];

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.location.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.location.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = selectedZone === "all" || store.location.zone === selectedZone;
    const matchesCategory = selectedCategory === "all" ||
                           (store.categories && store.categories.some(cat => cat === selectedCategory));

    return matchesSearch && matchesZone && matchesCategory;
  });

  const handleStoreClick = (store: Store) => {
    if (onStoreClick) {
      onStoreClick(store);
    }
  };

  const handleViewProducts = (e: React.MouseEvent, storeName: string) => {
    e.stopPropagation(); // Empêche le clic sur la carte de se déclencher
    if (onViewProducts) {
      onViewProducts(storeName);
    }
  };

  return (
    <div className="min-h-screen bg-somba-light">
      {/* Hero Section */}
      <div className="bg-somba-primary text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Découvrez nos Boutiques Partenaires</h1>
            <p className="text-xl opacity-90">Trouvez les meilleurs magasins près de chez vous</p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <Input
                    placeholder="Rechercher par nom de boutique, zone ou adresse..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-black text-gray-900  rounded-full border-somba-primary/30"
                  />
                </div>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger className="md:w-48 h-12 bg-black text-gray-900 border-somba-primary/30">
                    <SelectValue placeholder="Zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map(zone => (
                      <SelectItem key={zone} value={zone}>
                        {zone === "all" ? "Toutes les zones" : zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="md:w-48 h-12 text-gray-900 border-somba-primary/30">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === "all" ? "Toutes catégories" : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Results */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <p className="text-somba-primary">
              <span className="font-semibold">{filteredStores.length}</span> boutique(s) trouvée(s)
            </p>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Filtres actifs:</span>
              {selectedZone !== "all" && (
                <Badge variant="secondary" className="bg-somba-accent text-white">
                  {selectedZone}
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="bg-somba-accent text-white">
                  {selectedCategory}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid"
                ? "bg-somba-accent hover:bg-somba-accent/90"
                : "border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
              }
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={viewMode === "list"
                ? "bg-somba-accent hover:bg-somba-accent/90"
                : "border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
              }
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-somba-primary" />
            <span className="ml-2 text-somba-primary">Chargement des boutiques...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="font-medium text-red-900 mb-2">Erreur de chargement</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Stores Grid/List */}
        {!loading && !error && (
          <div className={viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
          }>
            {filteredStores.map((store) => (
            <Card
              key={store.id}
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-somba-primary/10 cursor-pointer group"
              onClick={() => handleStoreClick(store)}
            >
              <div className={viewMode === "list" ? "flex" : ""}>
                <div className={viewMode === "list" ? "w-48 flex-shrink-0" : ""}>
                  <div className="relative h-48 w-full">
                    <ImageWithFallback
                      src={store.image}
                      alt={store.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {store.verified && (
                      <Badge className="absolute top-2 right-2 bg-green-500">Vérifié</Badge>
                    )}
                    {store.delivery && (
                      <Badge className="absolute top-2 left-2 bg-somba-accent">Livraison</Badge>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-somba-primary group-hover:text-somba-accent transition-colors">{store.name}</h3>
                      {store.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{store.rating}</span>
                          {store.reviews && (
                            <span className="text-xs text-gray-500">({store.reviews})</span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{store.description}</p>
                    {store.categories && store.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {store.categories.map((category) => (
                          <Badge key={category} variant="outline" className="text-xs border-somba-accent text-somba-accent">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {/* Shop Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-somba-light/50 rounded p-2">
                        <p className="text-xs text-gray-600">Produits</p>
                        <p className="font-semibold text-somba-primary">{shops.find(s => s.id === store.id)?.product_count || 0}</p>
                      </div>
                      <div className="bg-somba-light/50 rounded p-2">
                        <p className="text-xs text-gray-600">Commandes</p>
                        <p className="font-semibold text-somba-primary">{shops.find(s => s.id === store.id)?.order_count || 0}</p>
                      </div>
                      <div className="bg-somba-light/50 rounded p-2">
                        <p className="text-xs text-gray-600">Ventes</p>
                        <p className="font-semibold text-somba-primary">{(shops.find(s => s.id === store.id)?.total_sales || 0).toLocaleString()} F</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-somba-accent" />
                        <span>
                          {store.location.address}, {store.location.zone}
                        </span>
                      </div>
                      {store.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4 text-somba-accent" />
                          <span>{store.phone}</span>
                        </div>
                      )}
                      {store.hours && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4 text-somba-accent" />
                          <span>{store.hours}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-somba-accent hover:bg-somba-accent/90"
                        onClick={(e) => handleViewProducts(e, store.name)}
                      >
                        Voir les produits
                      </Button>
                      <Button variant="outline" className="border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white">
                        Contacter
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
          </div>
        )}

        {!loading && !error && filteredStores.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Aucune boutique trouvée</h3>
            <p className="text-gray-500">
              Essayez de modifier vos critères de recherche ou de naviguer dans toutes les catégories.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}