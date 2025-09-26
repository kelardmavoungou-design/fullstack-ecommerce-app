import { useEffect, useState } from "react";
import api from "../services/api";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

import { 
  ShoppingBag, 
  Heart, 
  User, 
  Settings, 
  Package,
  Star,
  Calendar,
  CreditCard,
  TrendingUp
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Order {
  id: string;
  date: string;
  status: "En cours" | "Livré" | "En attente";
  total: string;
  items: number;
}

interface FavoriteProduct {
  id: number;
  name: string;
  price: string;
  image: string;
  boutique: string;
}

export function Dashboard() {
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    avatar: "",
    loginProvider: "", // 'google', 'facebook', or 'local'
    isVerified: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/profile");
        const userData = res.data.user || res.data;

        // Déterminer le fournisseur de connexion
        let loginProvider = 'local';
        if (userData.google_id) loginProvider = 'google';
        else if (userData.facebook_id) loginProvider = 'facebook';

        setUserProfile({
          name: userData.full_name || userData.name,
          email: userData.email,
          phone: userData.phone_number || userData.phone,
          address: userData.address || '',
          avatar: userData.avatar, // Peut être une URL Google, Facebook ou locale
          loginProvider: loginProvider,
          isVerified: userData.is_verified || false
        });
      } catch (e) {
        console.error('Erreur lors de la récupération du profil:', e);
        // Essayer de récupérer depuis localStorage en cas d'erreur
        try {
          const storedUser = localStorage.getItem('somba_current_user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);

            // Déterminer le fournisseur de connexion depuis localStorage
            let loginProvider = 'local';
            if (userData.google_id) loginProvider = 'google';
            else if (userData.facebook_id) loginProvider = 'facebook';

            setUserProfile({
              name: userData.full_name || userData.name || '',
              email: userData.email || '',
              phone: userData.phone_number || userData.phone || '',
              address: userData.address || '',
              avatar: userData.avatar || '',
              loginProvider: loginProvider,
              isVerified: userData.is_verified || false
            });
          }
        } catch (storageError) {
          console.error('Erreur lors de la récupération depuis localStorage:', storageError);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);


  const recentOrders: Order[] = [
    {
      id: "#CMD001",
      date: "15 Jan 2025",
      status: "Livré",
      total: "125.000 F CFA",
      items: 3
    },
    {
      id: "#CMD002", 
      date: "12 Jan 2025",
      status: "En cours",
      total: "75.000 F CFA",
      items: 2
    },
    {
      id: "#CMD003",
      date: "8 Jan 2025", 
      status: "En attente",
      total: "200.000 F CFA",
      items: 1
    }
  ];

  const favoriteProducts: FavoriteProduct[] = [
    {
      id: 1,
      name: "ORDINATEUR PORTABLE",
      price: "320.000 F CFA",
      image: "https://images.unsplash.com/photo-1754928864131-21917af96dfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBjb21wdXRlciUyMG1vZGVybnxlbnwxfHx8fDE3NTU1NDU1MzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      boutique: "Zoo Market"
    },
    {
      id: 2,
      name: "CASQUE AUDIO",
      price: "50.000 F CFA", 
      image: "https://images.unsplash.com/photo-1752055833666-bfca5443136b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFkcGhvbmVzJTIwYXVkaW98ZW58MXx8fHwxNzU1NTcwNDAzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      boutique: "Zoo Market"
    },
    {
      id: 3,
      name: "SAMSUNG GALAXY NOTE EDGE",
      price: "165.000 F CFA",
      image: "https://images.unsplash.com/photo-1698311427625-c9d99d089e54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW1zdW5nJTIwcGhvbmUlMjBtb2JpbGV8ZW58MXx8fHwxNzU1NTk0Mjk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      boutique: "Zoo Market"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Livré": return "bg-green-500";
      case "En cours": return "bg-blue-500";
      case "En attente": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Optionnel: vérification du type/taille

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await api.post("/auth/upload-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUserProfile((prev) => ({ ...prev, avatar: res.data.photoUrl }));
      console.log('Photo de profil mise à jour avec succès');
    } catch (err) {
      console.error('Erreur lors du téléchargement de la photo:', err);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await api.put("/auth/profile", {
        full_name: userProfile.name,
        email: userProfile.email,
        phone_number: userProfile.phone,
        address: userProfile.address
      });
      // Optionnel: toast de succès
      console.log('Profil mis à jour avec succès');
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Bienvenue sur votre espace personnel</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Commandes</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-teal-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Favoris</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dépenses Totales</p>
                <p className="text-2xl font-bold text-gray-900">1.2M</p>
                <p className="text-xs text-gray-500">F CFA</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Points Fidélité</p>
                <p className="text-2xl font-bold text-gray-900">850</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="favorites">Favoris</TabsTrigger>
          <TabsTrigger value="profile">Profil</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Commandes Récentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{order.id}</p>
                      <p className="text-sm text-gray-600">{order.date} • {order.items} article(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{order.total}</p>
                      <Badge className={`${getStatusColor(order.status)} text-white`}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  Voir toutes les commandes
                </Button>
              </CardContent>
            </Card>

            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                    <AvatarFallback>{userProfile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{userProfile.name}</h3>
                      {userProfile.loginProvider !== 'local' && (
                        <Badge variant="secondary" className="text-xs">
                          {userProfile.loginProvider === 'google' ? 'Google' : 'Facebook'}
                        </Badge>
                      )}
                      {userProfile.isVerified && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                          Vérifié
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{userProfile.email}</p>
                    <p className="text-sm text-gray-600">{userProfile.phone}</p>
                    {userProfile.loginProvider !== 'local' && (
                      <p className="text-xs text-blue-600 mt-1">
                        Connecté via {userProfile.loginProvider === 'google' ? 'Google' : 'Facebook'}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="outline" onClick={() => document.getElementById('avatar-upload')?.click()} className="w-full">
                  Changer la photo
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Toutes mes commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-teal-100 rounded-lg">
                        <Package className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-sm text-gray-600">{order.date} • {order.items} article(s)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{order.total}</p>
                      <Badge className={`${getStatusColor(order.status)} text-white`}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mes Favoris</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoriteProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100">
                      <ImageWithFallback
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-sm mb-1">{product.name}</h3>
                      <p className="text-xs text-gray-600 mb-2">Boutique: {product.boutique}</p>
                      <p className="font-bold text-teal-600 mb-3">{product.price}</p>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-red-500 hover:bg-red-600">
                          Acheter
                        </Button>
                        <Button size="sm" variant="outline">
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations Personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                  <AvatarFallback>{userProfile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{userProfile.name}</h3>
                    {userProfile.loginProvider !== 'local' && (
                      <Badge variant="secondary">
                        {userProfile.loginProvider === 'google' ? 'Google' : 'Facebook'}
                      </Badge>
                    )}
                    {userProfile.isVerified && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        ✓ Vérifié
                      </Badge>
                    )}
                  </div>
                  {userProfile.loginProvider !== 'local' && (
                    <p className="text-sm text-blue-600 mb-2">
                      Connecté via {userProfile.loginProvider === 'google' ? 'Google' : 'Facebook'}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    disabled={userProfile.loginProvider !== 'local'}
                  >
                    {userProfile.loginProvider !== 'local'
                      ? 'Photo synchronisée avec ' + (userProfile.loginProvider === 'google' ? 'Google' : 'Facebook')
                      : 'Changer la photo'
                    }
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={userProfile.phone}
                    onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={userProfile.address}
                    onChange={(e) => setUserProfile({...userProfile, address: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleSaveProfile}>
                  Sauvegarder les modifications
                </Button>
                <Button variant="outline">
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}