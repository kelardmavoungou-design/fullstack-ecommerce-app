import React, { useState, useEffect } from "react";
import { Package, Heart, Award, Eye, Calendar, Truck, CheckCircle, Clock, MapPin, Phone, Mail, User, Edit, CreditCard, Star, ShoppingBag, TrendingUp, Activity, Gift, ChevronRight, ChevronDown, Plus, Bell, Settings, Home, Trash2, Copy, Download, Filter, Search, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";
import { toast } from 'sonner';
import orderService from "../services/orderService";
import wishlistService from "../services/wishlistService";
import authService from "../services/authService";
import buyerService from "../services/buyerService";
import DeliveryInterface from "./DeliveryInterface";
import { WishlistItem, Order as ApiOrder, OrderItem as ApiOrderItem, BuyerStats, Address, Notification } from "../services/api";
import { jwtDecode } from "jwt-decode";


interface Order {
  id: string;
  date: string;
  total: string;
  status: 'En cours' | 'Livré' | 'Annulé' | 'En préparation';
  items: OrderItem[];
  trackingSteps: TrackingStep[];
  deliveryAddress: string;
  paymentMethod: string;
  estimatedDelivery?: string;
}

interface OrderItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  image: string;
  boutique: string;
  size?: string;
  color?: string;
}

interface TrackingStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
  date?: string;
}

interface FavoriteItem {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  boutique: string;
  category: string;
  isOnSale?: boolean;
  rating?: number;
}

//add
interface UserPayload {
  userId: string;
  full_name: string;
  email: string;
  avatar: string;
  exp: number;
}

// Removed local interfaces - now using imported types from api.ts

// Helper functions to transform API data to local types
const mapApiStatusToLocal = (apiStatus: string): Order['status'] => {
  switch (apiStatus) {
    case 'pending':
    case 'paid':
    case 'shipped':
      return 'En cours';
    case 'delivered':
      return 'Livré';
    case 'cancelled':
      return 'Annulé';
    default:
      return 'En cours';
  }
};

const mapApiPaymentMethodToLocal = (apiMethod: string): string => {
  switch (apiMethod) {
    case 'mobile_money':
      return 'Mobile Money';
    case 'cash_on_delivery':
      return 'Espèces';
    default:
      return 'Non spécifié';
  }
};

const transformApiOrderItemToLocal = (apiItem: ApiOrderItem, shopName?: string): OrderItem => {
  return {
    id: apiItem.id,
    name: apiItem.name,
    price: (() => {
      if (apiItem.price === undefined || apiItem.price === null) return 'Prix non disponible';
      const numPrice = typeof apiItem.price === 'string' ? parseFloat(apiItem.price) : apiItem.price;
      if (isNaN(numPrice)) return 'Prix non disponible';
      return numPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' });
    })(),
    quantity: apiItem.quantity,
    image: apiItem.image || '',
    boutique: shopName || 'Boutique',
    size: undefined, // Not available in API
    color: undefined, // Not available in API
  };
};

const getDefaultTrackingSteps = (status: Order['status']): TrackingStep[] => {
  const baseSteps: TrackingStep[] = [
    { step: 1, title: "Commande confirmée", description: "Votre commande a été confirmée", completed: true, date: "Date inconnue" },
    { step: 2, title: "Préparation", description: "Préparation de votre commande", completed: false, date: undefined },
    { step: 3, title: "Expédition", description: "Votre commande est en route", completed: false, date: undefined },
    { step: 4, title: "Livraison", description: "Livraison prévue", completed: false, date: undefined },
  ];

  if (status === 'Livré') {
    return baseSteps.map(step => ({ ...step, completed: true, date: "Date inconnue" }));
  } else if (status === 'En cours') {
    return baseSteps.map((step, index) => ({
      ...step,
      completed: index < 2,
      date: index < 2 ? "Date inconnue" : undefined
    }));
  }

  return baseSteps;
};

const transformApiOrderToLocal = (apiOrder: ApiOrder): Order => {
  const localStatus = mapApiStatusToLocal(apiOrder.status);
  const items = apiOrder.items?.map(item => transformApiOrderItemToLocal(item, apiOrder.shop_name)) || [];

  return {
    id: apiOrder.id.toString(),
    date: new Date(apiOrder.created_at).toLocaleDateString('fr-FR'),
    total: (() => {
      if (apiOrder.total === undefined || apiOrder.total === null) return 'Prix non disponible';
      const numPrice = typeof apiOrder.total === 'string' ? parseFloat(apiOrder.total) : apiOrder.total;
      if (isNaN(numPrice)) return 'Prix non disponible';
      return numPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' });
    })(),
    status: localStatus,
    items: items,
    trackingSteps: getDefaultTrackingSteps(localStatus),
    deliveryAddress: apiOrder.shipping_address || 'Adresse non spécifiée',
    paymentMethod: mapApiPaymentMethodToLocal(apiOrder.payment_method),
    estimatedDelivery: localStatus === 'En cours' ? 'Livraison estimée' : undefined,
  };
};

const transformApiWishlistItemToLocal = (apiItem: WishlistItem): FavoriteItem => {
  return {
    id: apiItem.id,
    name: apiItem.name,
    price: (() => {
      if (apiItem.price === undefined || apiItem.price === null) return 'Prix non disponible';
      const numPrice = typeof apiItem.price === 'string' ? parseFloat(apiItem.price) : apiItem.price;
      if (isNaN(numPrice)) return 'Prix non disponible';
      return numPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' });
    })(),
    image: apiItem.image || '',
    boutique: apiItem.shop_name || 'Boutique',
    category: apiItem.category,
    rating: undefined, // Not available in API
    isOnSale: undefined, // Not available in API
    originalPrice: undefined, // Not available in API
  };
};



interface DashboardPageProps {
  initialTab?: string;
}

export function DashboardPage({ initialTab = "overview" }: DashboardPageProps) {
   const { user } = useAuth();

   const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  // Removed mock data state - now using real API data
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [buyerStats, setBuyerStats] = useState<BuyerStats | null>(null);
  const [buyerStatsLoading, setBuyerStatsLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone_number: ''
  });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Function to cancel photo selection
  const handleCancelPhotoSelection = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);

    // Clear the file input
    const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    toast.info('📸 Sélection annulée', {
      description: 'La photo sélectionnée a été supprimée',
      duration: 2000,
    });
  };

  // Function to remove current profile photo
  const handleRemoveProfilePhoto = async () => {
    if (!user) return;

    const confirmRemove = window.confirm('Êtes-vous sûr de vouloir supprimer votre photo de profil ?');
    if (!confirmRemove) return;

    setLoading(true);
    try {
      const response = await updateUserProfile({ avatar: null });

      if (response.success) {
        toast.success('🗑️ Photo supprimée', {
          description: 'Votre photo de profil a été supprimée',
          duration: 3000,
        });

        // Reset photo states
        setSelectedPhoto(null);
        setPhotoPreview(null);

        // Clear the file input
        const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        toast.error('❌ Erreur', {
          description: 'Impossible de supprimer la photo',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error removing profile photo:', error);
      toast.error('❌ Erreur serveur', {
        description: 'Problème lors de la suppression',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };
  const { logout, updateProfile: updateUserProfile } = useAuth();
  const { addToCart } = useCart();

  //add
  // Nouvel effet pour gérer le token Facebook dans l'URL
  useEffect(() => {
    const handleFacebookLogin = () => {
      // Lire le token dans l'URL
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (token) {
        try {
          const decoded: UserPayload = jwtDecode(token);

          // Mettre à jour le profil utilisateur avec les données Facebook
          setProfileData({
            full_name: decoded.full_name || '',
            email: decoded.email || '',
            phone_number: user?.phone_number || '' // Garder le téléphone existant si disponible
          });

          // Si l'utilisateur a une photo de profil via Facebook, mettre à jour l'état
          if (decoded.avatar) {
            setPhotoPreview(decoded.avatar);
          }

          // Stocker le token dans localStorage pour les requêtes API
          localStorage.setItem("authToken", token);

          // Nettoyer l'URL pour retirer le token
          window.history.replaceState({}, document.title, window.location.pathname);

          toast.success('🎉 Connexion Facebook réussie !', {
            description: `Bienvenue ${decoded.full_name}`,
            duration: 3000,
          });

        } catch (error) {
          console.error("Token Facebook invalide:", error);
          toast.error('❌ Erreur de connexion Facebook', {
            description: 'Le token est invalide',
            duration: 4000,
          });
        }
      }
    };

    handleFacebookLogin();
  }, []);


  // Load orders from API
  useEffect(() => {
    const loadOrders = async () => {
      setOrdersLoading(true);
      try {
        const response = await orderService.getOrders();
        if (response.success && response.data && response.data.orders) {
          // Transform API orders to local format
          const transformedOrders = response.data.orders.map(transformApiOrderToLocal);
          setOrders(transformedOrders);
        } else {
          // Show empty state if no orders
          setOrders([]);
        }
      } catch (error) {
        console.error('Error loading orders:', error);
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    if (user) {
      loadOrders();
    } else {
      setOrders([]);
      setOrdersLoading(false);
    }
  }, [user]);

  // Load favorites from API
  useEffect(() => {
    const loadFavorites = async () => {
      setFavoritesLoading(true);
      try {
        const response = await wishlistService.getWishlist();
        if (response.success && response.data && response.data.items) {
          // Transform API wishlist items to local format
          const transformedFavorites = response.data.items.map(transformApiWishlistItemToLocal);
          setFavorites(transformedFavorites);
        } else {
          // Show empty state if no favorites
          setFavorites([]);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
        setFavorites([]);
      } finally {
        setFavoritesLoading(false);
      }
    };

    if (user) {
      loadFavorites();
    } else {
      setFavorites([]);
      setFavoritesLoading(false);
    }
  }, [user]);

  // Initialize profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone_number: user.phone_number || ''
      });
    }
  }, [user]);

  // Load buyer statistics
  useEffect(() => {
    const loadBuyerStats = async () => {
      setBuyerStatsLoading(true);
      try {
        const response = await buyerService.getBuyerStats();
        if (response.success && response.data) {
          setBuyerStats(response.data);
        }
      } catch (error) {
        console.error('Error loading buyer stats:', error);
      } finally {
        setBuyerStatsLoading(false);
      }
    };

    if (user) {
      loadBuyerStats();
    } else {
      setBuyerStats(null);
      setBuyerStatsLoading(false);
    }
  }, [user]);

  // Load addresses
  useEffect(() => {
    const loadAddresses = async () => {
      setAddressesLoading(true);
      try {
        const response = await buyerService.getAddresses();
        if (response.success && response.data) {
          setAddresses(response.data);
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
        setAddresses([]);
      } finally {
        setAddressesLoading(false);
      }
    };

    if (user) {
      loadAddresses();
    } else {
      setAddresses([]);
      setAddressesLoading(false);
    }
  }, [user]);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      setNotificationsLoading(true);
      try {
        const response = await buyerService.getNotifications();
        if (response.success && response.data) {
          setNotifications(response.data.notifications);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
      } finally {
        setNotificationsLoading(false);
      }
    };

    if (user) {
      loadNotifications();
    } else {
      setNotifications([]);
      setNotificationsLoading(false);
    }
  }, [user]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('❌ Invalid file type:', file.type);
      toast.error('❌ Format non supporté', {
        description: 'Veuillez sélectionner un fichier image (JPG, PNG, GIF, etc.)',
        duration: 4000,
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('📁 Fichier trop volumineux', {
        description: `La taille maximale autorisée est de ${Math.round(maxSize / 1024 / 1024)}MB`,
        duration: 4000,
      });
      return;
    }

    // Validate minimum size (too small images might be problematic)
    if (file.size < 1024) { // 1KB minimum
      toast.error('📷 Image trop petite', {
        description: 'Veuillez sélectionner une image de meilleure qualité',
        duration: 4000,
      });
      return;
    }

    setSelectedPhoto(file);

    // Create preview with loading state
    const reader = new FileReader();
    reader.onloadstart = () => {
      // Could add loading state here if needed
    };

    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPhotoPreview(result);

      toast.success('📸 Photo sélectionnée', {
        description: `${file.name} (${Math.round(file.size / 1024)}KB)`,
        duration: 3000,
      });
    };

    reader.onerror = () => {
      toast.error('❌ Erreur de lecture', {
        description: 'Impossible de lire le fichier sélectionné',
        duration: 4000,
      });
    };

    reader.readAsDataURL(file);
  };

  const handleProfileUpdate = async () => {
    if (!user) {
      toast.error('❌ Erreur', {
        description: 'Utilisateur non connecté',
        duration: 4000,
      });
      return;
    }

    setLoading(true);

    try {
      let photoUrl = user.avatar;
      let hasPhotoUpload = false;

      // Upload photo if selected
      if (selectedPhoto) {
        hasPhotoUpload = true;
        toast.info('📤 Téléchargement de la photo...', {
          description: 'Veuillez patienter pendant le téléchargement',
          duration: 2000,
        });

        try {
          const uploadResponse = await authService.uploadProfilePhoto(selectedPhoto);

          if (uploadResponse.success && uploadResponse.data) {
            photoUrl = uploadResponse.data.photoUrl;
            toast.success('✅ Photo téléchargée', {
              description: 'Votre nouvelle photo a été sauvegardée',
              duration: 2000,
            });
          } else {
            toast.error('❌ Échec du téléchargement', {
              description: uploadResponse.error || 'Erreur lors du téléchargement de la photo',
              duration: 4000,
            });
            setLoading(false);
            return;
          }
        } catch (uploadError: any) {
          toast.error('❌ Erreur de téléchargement', {
            description: 'Impossible de télécharger la photo. Réessayez.',
            duration: 4000,
          });
          setLoading(false);
          return;
        }
      }

      // Check if there are any changes to update
      const hasProfileChanges =
        profileData.full_name !== user.full_name ||
        profileData.email !== user.email ||
        profileData.phone_number !== user.phone_number ||
        (selectedPhoto && photoUrl); // Always update if photo was uploaded

      if (!hasProfileChanges) {
        toast.info('ℹ️ Aucune modification', {
          description: 'Vos informations sont déjà à jour',
          duration: 3000,
        });
        setLoading(false);
        return;
      }

      // Update profile with new data including photo URL
      const updateData = {
        ...profileData,
        ...(selectedPhoto && photoUrl && { avatar: photoUrl }) // Always include avatar if photo was uploaded
      };

      console.log('📤 Update data:', updateData);
      console.log('📸 Photo URL:', photoUrl);
      console.log('📸 Selected photo:', selectedPhoto);

      toast.info('🔄 Mise à jour en cours...', {
        description: 'Sauvegarde de vos modifications',
        duration: 2000,
      });

      const response = await updateUserProfile(updateData);

      if (response.success) {
        console.log('✅ Profile update successful, response:', response);

        // Success message based on what was updated
        const updateType = hasPhotoUpload ? 'photo et informations' : 'informations';
        toast.success('🎉 Profil mis à jour !', {
          description: `Vos ${updateType} ont été sauvegardées avec succès`,
          duration: 4000,
        });

        // Reset photo states
        setSelectedPhoto(null);
        setPhotoPreview(null);

        // Update profile data state to reflect changes
        if ((response as any).user) {
          console.log('👤 Updating profile data with:', (response as any).user);
          setProfileData({
            full_name: (response as any).user.full_name || '',
            email: (response as any).user.email || '',
            phone_number: (response as any).user.phone_number || ''
          });
        } else {
          // Fallback: update with current user data if no user object returned
          console.log('👤 No user object returned, using current user data');
          setProfileData({
            full_name: user.full_name || '',
            email: user.email || '',
            phone_number: user.phone_number || ''
          });
        }

        // Clear the file input
        const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }

        // Force refresh user data to ensure avatar is updated
        if (hasPhotoUpload) {
          // Special message for OAuth photo replacement
          const wasOAuthPhoto = user.avatar && user.avatar.startsWith('http');
          const successMessage = wasOAuthPhoto
            ? '📸 Photo OAuth remplacée ! Votre photo personnalisée est maintenant visible'
            : '📸 Photo mise à jour ! Votre nouvelle photo de profil est maintenant visible';

          toast.success('Photo de profil mise à jour !', {
            description: successMessage,
            duration: 4000,
          });

          console.log('🔄 Reloading page to show updated avatar...');
          // Small delay to show the success message before refresh
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }

      } else {
        toast.error('❌ Échec de la mise à jour', {
          description: 'Une erreur est survenue lors de la mise à jour du profil',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('❌ Erreur serveur', {
        description: 'Problème de connexion. Veuillez réessayer.',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== 'string') {
      return 'U';
    }
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours': return 'bg-yellow-500';
      case 'Livré': return 'bg-green-500';
      case 'Annulé': return 'bg-red-500';
      case 'En préparation': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrackingProgress = (steps: TrackingStep[]) => {
    const completedSteps = steps.filter(step => step.completed).length;
    return (completedSteps / steps.length) * 100;
  };

  const toggleOrderDetails = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const handleAddFavoriteToCart = (item: any) => {
    const product = {
      id: item.id,
      name: item.name,
      price: typeof item.price === 'number' ? item.price.toString() : item.price,
      image: item.image,
      boutique: item.boutique || item.shop_name || '',
      quantity: 1
    };

    addToCart(product);

    toast.success(`${item.name} ajouté au panier`, {
      description: `Chez ${product.boutique} • ${product.price}`,
      duration: 2000,
    });
  };

  const handleRemoveFromFavorites = async (productId: number, productName: string) => {
    try {
      const response = await wishlistService.removeFromWishlist(productId);
      if (response.success) {
        // Update local state
        setFavorites(prev => prev.filter(item => item.id !== productId));
        toast.success(`${productName} retiré des favoris`);
      } else {
        toast.error('Erreur lors de la suppression du favori');
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast.error('Erreur lors de la suppression du favori');
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await buyerService.markNotificationRead(id);
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await buyerService.updateAddress(id, { isDefault: true });
      // Update local state
      setAddresses(prev =>
        prev.map(addr => ({ ...addr, isDefault: addr.id === id }))
      );
      toast.success("Adresse par défaut mise à jour");
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error("Erreur lors de la mise à jour de l'adresse par défaut");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (addresses.find(addr => addr.id === id)?.isDefault) {
      toast.error("Impossible de supprimer l'adresse par défaut");
      return;
    }
    try {
      await buyerService.deleteAddress(id);
      // Update local state
      setAddresses(prev => prev.filter(addr => addr.id !== id));
      toast.success("Adresse supprimée");
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error("Erreur lors de la suppression de l'adresse");
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.items && order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesFilter = orderFilter === "all" || order.status === orderFilter;
    return matchesSearch && matchesFilter;
  });

  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-somba-light flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-somba-primary mb-4">Accès restreint</h2>
          <p className="text-gray-600 mb-6">Veuillez vous connecter pour accéder à votre dashboard.</p>
          <Button
            onClick={() => window.location.href = '/login'}
            className="bg-somba-accent hover:bg-somba-accent/90"
          >
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-somba-light">
      <div className="container mx-auto px-4 py-8">
        {/* Header amélioré */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl font-bold text-somba-primary mb-2">Tableau de bord SOMBA</h1>
              <p className="text-gray-600">Gérez votre compte et suivez vos activités</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-somba-primary text-somba-primary hover:bg-somba-light"
                  onClick={() => setActiveTab('notifications')}
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotifications > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-5 h-5 rounded-full p-0 flex items-center justify-center">
                      {unreadNotifications}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Profil utilisateur */}
              <div className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm border border-somba-primary/10">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={photoPreview || user.avatar} alt={user.full_name} />
                  <AvatarFallback className="bg-somba-accent text-white">
                    {getUserInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-somba-primary">{user.full_name}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className="bg-somba-accent text-xs">Premium</Badge>
                    <Badge variant="outline" className="border-green-600 text-green-600 text-xs">
                      <Activity className="h-2 w-2 mr-1" />
                      Actif
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
                  >
                    Actualiser
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      logout();
                      window.location.href = '/';
                    }}
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    Déconnexion
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification en cours */}
        {orders.some(order => order.status === 'En cours') && (
          <div className="mb-8">
            <Card className="border-somba-accent/20 bg-gradient-to-r from-somba-accent/5 to-somba-accent/10">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-somba-accent/20 rounded-full">
                    <Truck className="h-6 w-6 text-somba-accent" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-somba-primary mb-1">🚛 Livraison en cours</h4>
                    <p className="text-sm text-gray-600">
                      {orders.find(order => order.status === 'En cours')?.estimatedDelivery || 'Livraison en cours'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-somba-accent text-somba-accent hover:bg-somba-accent hover:text-white"
                    onClick={() => setActiveTab('orders')}
                  >
                    Suivre la livraison
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Cards améliorées */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <Card
            className="border-somba-primary/10 overflow-hidden relative cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveTab('orders')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Commandes passées</p>
                  <p className="text-3xl font-bold text-somba-primary">
                    {buyerStatsLoading ? '...' : (buyerStats?.totalOrders || 0)}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {(buyerStats?.totalOrders || 0) > 0 ? 'Commandes actives' : 'Aucune commande'}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-somba-accent/20 to-somba-accent/10 rounded-full">
                  <Package className="h-6 w-6 text-somba-accent" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-somba-accent to-somba-accent/50"></div>
            </CardContent>
          </Card>

          <Card
            className="border-somba-primary/10 overflow-hidden relative cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveTab('overview')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Articles favoris</p>
                  <p className="text-3xl font-bold text-somba-primary">
                    {favoritesLoading ? '...' : (buyerStats?.favoritesCount || 0)}
                  </p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <Heart className="h-3 w-3 mr-1" />
                    {(buyerStats?.favoritesCount || 0) > 0 ? 'Articles sauvegardés' : 'Aucun favori'}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-500/10 rounded-full">
                  <Heart className="h-6 w-6 text-red-500" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-500/50"></div>
            </CardContent>
          </Card>

          <Card className="border-somba-primary/10 overflow-hidden relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Points fidélité</p>
                  <p className="text-3xl font-bold text-somba-primary">
                    {buyerStatsLoading ? '...' : (buyerStats?.loyaltyPoints || 0)}
                  </p>
                  <p className="text-xs text-somba-accent flex items-center mt-1">
                    <Gift className="h-3 w-3 mr-1" />
                    {(buyerStats?.loyaltyPoints || 0) >= 150 ? 'Éligible au cadeau' : `${150 - (buyerStats?.loyaltyPoints || 0)} pour cadeau`}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 rounded-full">
                  <Award className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-yellow-500/50"></div>
            </CardContent>
          </Card>

          <Card className="border-somba-primary/10 overflow-hidden relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total dépensé</p>
                  <p className="text-3xl font-bold text-somba-primary">
                    {buyerStatsLoading ? '...' : `${(buyerStats?.totalSpent || 0).toLocaleString()}K`}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <Activity className="h-3 w-3 mr-1" />
                    F CFA
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-full">
                  <CreditCard className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-500/50"></div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation améliorée */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full bg-white border border-somba-primary/10 mb-8 p-1 rounded-lg">
            <TabsTrigger
              value="overview"
              className="flex-1 data-[state=active]:bg-somba-accent data-[state=active]:text-white rounded-md"
            >
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="flex-1 data-[state=active]:bg-somba-accent data-[state=active]:text-white rounded-md"
            >
              Commandes
            </TabsTrigger>
            <TabsTrigger
              value="deliveries"
              className="flex-1 data-[state=active]:bg-somba-accent data-[state=active]:text-white rounded-md"
            >
              Livraisons
            </TabsTrigger>
            <TabsTrigger
              value="addresses"
              className="flex-1 data-[state=active]:bg-somba-accent data-[state=active]:text-white rounded-md"
            >
              Adresses
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex-1 data-[state=active]:bg-somba-accent data-[state=active]:text-white rounded-md"
            >
              Notifications
              {unreadNotifications > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadNotifications}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex-1 data-[state=active]:bg-somba-accent data-[state=active]:text-white rounded-md"
            >
              Paramètres
            </TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Commandes récentes avec détails */}
              <Card className="border-somba-primary/10">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-somba-primary">Vos commandes récentes</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-somba-accent hover:bg-somba-light"
                      onClick={() => setActiveTab('orders')}
                    >
                      Voir tout <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.slice(0, 2).map((order) => (
                      <div key={order.id} className="border border-somba-primary/10 rounded-lg overflow-hidden">
                        <div
                          className="flex items-center justify-between p-4 bg-somba-light cursor-pointer hover:bg-somba-gray transition-colors"
                          onClick={() => toggleOrderDetails(order.id)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-white rounded-lg">
                              <Package className="h-5 w-5 text-somba-accent" />
                            </div>
                            <div>
                              <p className="font-medium text-somba-primary">Commande #{order.id}</p>
                              <p className="text-sm text-gray-500">{order.date}</p>
                              {order.estimatedDelivery && order.status === 'En cours' && (
                                <p className="text-xs text-somba-accent font-medium">{order.estimatedDelivery}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-somba-primary">{order.total}</p>
                            <Badge className={`${getStatusColor(order.status)} text-white`}>
                              {order.status}
                            </Badge>
                            <div className="flex items-center mt-1">
                              {expandedOrders.has(order.id) ? (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Détails de la commande */}
                        {expandedOrders.has(order.id) && (
                          <div className="p-4 bg-white border-t border-somba-primary/10">
                            <div className="space-y-4">
                              {/* Articles commandés */}
                              <div>
                                <h5 className="font-medium text-somba-primary mb-3">Articles commandés</h5>
                                <div className="space-y-3">
                                  {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center space-x-3">
                                      <div className="w-12 h-12 rounded-lg overflow-hidden">
                                        <ImageWithFallback
                                          src={item.image}
                                          alt={item.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium text-sm text-somba-primary">{item.name}</p>
                                        <p className="text-xs text-gray-500">{item.boutique}</p>
                                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                                          {item.size && <span>Taille: {item.size}</span>}
                                          {item.color && <span>Couleur: {item.color}</span>}
                                          <span>Qty: {item.quantity}</span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-semibold text-sm text-somba-accent">{item.price}</p>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleAddFavoriteToCart(item)}
                                          className="mt-1 text-xs h-6 px-2 border-somba-accent text-somba-accent hover:bg-somba-accent hover:text-white"
                                        >
                                          Racheter
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Informations livraison */}
                              <div className="flex items-center justify-between pt-3 border-t border-somba-primary/10">
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <MapPin className="h-4 w-4 text-somba-accent" />
                                  <span className="truncate max-w-48">{order.deliveryAddress}</span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {order.paymentMethod}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Articles favoris */}
              <Card className="border-somba-primary/10">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-somba-primary flex items-center">
                      <Heart className="h-5 w-5 mr-2 text-red-500" />
                      Vos favoris
                    </CardTitle>
                    <Badge className="bg-somba-accent text-white">
                      {favorites.length} articles
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {favoritesLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, index) => (
                          <div key={index} className="animate-pulse">
                            <div className="bg-gray-200 h-16 rounded-lg"></div>
                          </div>
                        ))}
                      </div>
                    ) : favorites.length === 0 ? (
                      <div className="text-center py-8">
                        <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Aucun article favori</p>
                      </div>
                    ) : (
                      favorites.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 p-3 border border-somba-primary/10 rounded-lg hover:bg-somba-light transition-colors">
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            <ImageWithFallback
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-somba-primary text-sm">{item.name}</h4>
                            <p className="text-xs text-gray-500">{item.boutique}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex flex-col space-y-1">
                              <span className="font-semibold text-somba-accent text-sm">{item.price}</span>
                            </div>
                            <div className="flex space-x-1 mt-2">
                              <Button
                                size="sm"
                                className="bg-somba-accent hover:bg-somba-accent/90 flex-1"
                                onClick={() => handleAddFavoriteToCart(item)}
                              >
                                Ajouter
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                onClick={() => handleRemoveFromFavorites(item.id, item.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {favorites.length > 3 && (
                    <div className="text-center mt-4">
                      <p className="text-sm text-gray-500">
                        Et {favorites.length - 3} autres articles favoris
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Commandes */}
          <TabsContent value="orders" className="space-y-6">
            <Card className="border-somba-primary/10">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                  <CardTitle className="text-somba-primary">Mes commandes</CardTitle>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Rechercher une commande..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:w-64"
                      />
                    </div>
                    <Select value={orderFilter} onValueChange={setOrderFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Filtrer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="En cours">En cours</SelectItem>
                        <SelectItem value="Livré">Livrées</SelectItem>
                        <SelectItem value="Annulé">Annulées</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ordersLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="animate-pulse">
                          <div className="bg-gray-200 h-32 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucune commande trouvée</p>
                    </div>
                  ) : (
                    filteredOrders.map((order) => (
                      <div key={order.id} className="border border-somba-primary/10 rounded-lg overflow-hidden">
                        <div
                          className="flex items-center justify-between p-4 bg-white cursor-pointer hover:bg-somba-light transition-colors"
                          onClick={() => toggleOrderDetails(order.id)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-somba-light rounded-lg">
                              <Package className="h-5 w-5 text-somba-accent" />
                            </div>
                            <div>
                              <p className="font-medium text-somba-primary">Commande #{order.id}</p>
                              <p className="text-sm text-gray-500">{order.date} • {order.items.length} article(s)</p>
                              {order.estimatedDelivery && order.status === 'En cours' && (
                                <p className="text-xs text-somba-accent font-medium">{order.estimatedDelivery}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-somba-primary">{order.total}</p>
                            <Badge className={`${getStatusColor(order.status)} text-white`}>
                              {order.status}
                            </Badge>
                            <div className="flex items-center justify-end mt-1">
                              {expandedOrders.has(order.id) ? (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Détails étendus de la commande */}
                        {expandedOrders.has(order.id) && (
                          <div className="border-t border-somba-primary/10 bg-somba-light/50">
                            <div className="p-6 space-y-6">
                              {/* Suivi de commande */}
                              <div>
                                <h5 className="font-medium text-somba-primary mb-4 flex items-center">
                                  <Clock className="h-4 w-4 mr-2" />
                                  Suivi de votre commande
                                </h5>
                                <div className="relative">
                                  <Progress value={getTrackingProgress(order.trackingSteps)} className="h-2 mb-4" />
                                  <div className="flex justify-between">
                                    {order.trackingSteps.map((step, index) => (
                                      <div key={step.step} className="flex flex-col items-center">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step.completed
                                          ? 'bg-somba-accent text-white'
                                          : 'bg-gray-200 text-gray-500'
                                          }`}>
                                          {step.completed ? (
                                            <CheckCircle className="h-3 w-3" />
                                          ) : (
                                            step.step
                                          )}
                                        </div>
                                        <div className="mt-2 text-center">
                                          <p className="text-xs font-medium text-somba-primary">{step.title}</p>
                                          <p className="text-xs text-gray-500">{step.description}</p>
                                          {step.date && (
                                            <p className="text-xs text-gray-400 mt-1">{step.date}</p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Articles de la commande */}
                              <div>
                                <h5 className="font-medium text-somba-primary mb-4">Articles commandés</h5>
                                <div className="space-y-3">
                                  {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-somba-primary/10">
                                      <div className="w-16 h-16 rounded-lg overflow-hidden">
                                        <ImageWithFallback
                                          src={item.image}
                                          alt={item.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium text-somba-primary">{item.name}</p>
                                        <p className="text-sm text-gray-500">{item.boutique}</p>
                                        <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                                          {item.size && <span>Taille: {item.size}</span>}
                                          {item.color && <span>Couleur: {item.color}</span>}
                                          <span>Quantité: {item.quantity}</span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-semibold text-somba-accent">{item.price}</p>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleAddFavoriteToCart(item)}
                                          className="mt-2 border-somba-accent text-somba-accent hover:bg-somba-accent hover:text-white"
                                        >
                                          Racheter
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Informations de livraison */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <h6 className="font-medium text-somba-primary flex items-center">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    Adresse de livraison
                                  </h6>
                                  <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                                </div>
                                <div className="space-y-2">
                                  <h6 className="font-medium text-somba-primary flex items-center">
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Mode de paiement
                                  </h6>
                                  <p className="text-sm text-gray-600">{order.paymentMethod}</p>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex justify-end space-x-3 pt-4 border-t border-somba-primary/10">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Facture
                                </Button>
                                {order.status === 'Livré' && (
                                  <Button
                                    size="sm"
                                    className="bg-somba-accent hover:bg-somba-accent/90"
                                  >
                                    <Star className="h-4 w-4 mr-2" />
                                    Donner un avis
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Livraisons */}
          <TabsContent value="deliveries" className="space-y-6">
            <Card className="border-somba-primary/10">
              <CardHeader>
                <CardTitle className="text-somba-primary flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Suivi de mes livraisons
                </CardTitle>
                <CardDescription>Suivez l'état de vos livraisons en cours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Statistiques de livraison */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <Package className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="text-sm text-blue-600 font-medium">En préparation</p>
                          <p className="text-2xl font-bold text-blue-800">
                            {orders.filter(o => o.status === 'En préparation').length}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <Truck className="h-8 w-8 text-yellow-600" />
                        <div>
                          <p className="text-sm text-yellow-600 font-medium">En cours</p>
                          <p className="text-2xl font-bold text-yellow-800">
                            {orders.filter(o => o.status === 'En cours').length}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-sm text-green-600 font-medium">Livrées</p>
                          <p className="text-2xl font-bold text-green-800">
                            {orders.filter(o => o.status === 'Livré').length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Liste des livraisons */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-somba-primary">Mes livraisons récentes</h4>
                    {ordersLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, index) => (
                          <div key={index} className="animate-pulse">
                            <div className="bg-gray-200 h-24 rounded-lg"></div>
                          </div>
                        ))}
                      </div>
                    ) : orders.filter(o => ['En cours', 'En préparation', 'Livré'].includes(o.status)).length === 0 ? (
                      <div className="text-center py-8">
                        <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Aucune livraison en cours</p>
                      </div>
                    ) : (
                      orders
                        .filter(o => ['En cours', 'En préparation', 'Livré'].includes(o.status))
                        .slice(0, 5)
                        .map((order) => (
                          <div key={order.id} className="border border-somba-primary/10 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-somba-light rounded-lg">
                                  <Package className="h-5 w-5 text-somba-accent" />
                                </div>
                                <div>
                                  <p className="font-medium text-somba-primary">Commande #{order.id}</p>
                                  <p className="text-sm text-gray-500">{order.date}</p>
                                </div>
                              </div>
                              <Badge className={`${getStatusColor(order.status)} text-white`}>
                                {order.status}
                              </Badge>
                            </div>

                            {order.status === 'En cours' && order.trackingSteps && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-sm mb-2">
                                  <span className="text-gray-600">Progression de la livraison</span>
                                  <span className="font-medium">
                                    {order.trackingSteps.filter(s => s.completed).length}/{order.trackingSteps.length} étapes
                                  </span>
                                </div>
                                <Progress value={getTrackingProgress(order.trackingSteps)} className="h-2" />
                                <div className="flex justify-between mt-2">
                                  {order.trackingSteps.map((step, index) => (
                                    <div key={step.step} className="flex flex-col items-center flex-1">
                                      <div className={`w-3 h-3 rounded-full ${
                                        step.completed ? 'bg-somba-accent' : 'bg-gray-300'
                                      }`} />
                                      <span className="text-xs text-center mt-1 text-gray-500">
                                        {step.title}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600 truncate max-w-48">{order.deliveryAddress}</span>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-somba-accent">{order.total}</p>
                                {order.estimatedDelivery && order.status === 'En cours' && (
                                  <p className="text-xs text-somba-accent">{order.estimatedDelivery}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>

                  {/* Informations de livraison */}
                  <div className="bg-somba-light/50 rounded-lg p-4">
                    <h5 className="font-medium text-somba-primary mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Informations sur la livraison
                    </h5>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• Livraison gratuite dès 50.000 FCFA d'achat</p>
                      <p>• Délai de livraison: 2-5 jours ouvrés</p>
                      <p>• Suivi en temps réel de vos colis</p>
                      <p>• Service client disponible 7j/7</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Adresses */}
          <TabsContent value="addresses" className="space-y-6">
            <Card className="border-somba-primary/10">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-somba-primary">Mes adresses de livraison</CardTitle>
                  <Button className="bg-somba-accent hover:bg-somba-accent/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une adresse
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {addressesLoading ? (
                    <div className="space-y-4">
                      {[...Array(2)].map((_, index) => (
                        <div key={index} className="animate-pulse">
                          <div className="bg-gray-200 h-24 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucune adresse enregistrée</p>
                      <Button className="mt-4 bg-somba-accent hover:bg-somba-accent/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter une adresse
                      </Button>
                    </div>
                  ) : (
                    addresses.map((address) => (
                      <div key={address.id} className="border border-somba-primary/10 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-somba-primary">{address.label}</h4>
                              {address.isDefault && (
                                <Badge className="bg-somba-accent text-white text-xs">Par défaut</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{address.fullAddress}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!address.isDefault && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAddress(address.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {!address.isDefault && (
                          <div className="mt-3 pt-3 border-t border-somba-primary/10">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefaultAddress(address.id)}
                              className="border-somba-accent text-somba-accent hover:bg-somba-accent hover:text-white"
                            >
                              Définir par défaut
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-somba-primary/10">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-somba-primary flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Centre de notifications
                  </CardTitle>
                  <Badge className="bg-red-500 text-white">
                    {unreadNotifications} non lues
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notificationsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="animate-pulse">
                          <div className="bg-gray-200 h-20 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucune notification</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${notification.read
                          ? 'border-somba-primary/10 bg-white'
                          : 'border-somba-accent/20 bg-somba-accent/5'
                          }`}
                        onClick={() => handleMarkNotificationRead(notification.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-somba-primary">{notification.title}</h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {notification.type === 'order' ? 'Commande' :
                                  notification.type === 'promo' ? 'Promotion' : 'Système'}
                              </Badge>
                              <span className="text-xs text-gray-400">{notification.date}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Paramètres */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations personnelles */}
              <Card className="border-somba-primary/10">
                <CardHeader>
                  <CardTitle className="text-somba-primary flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-6 mb-6">
                    <div className="relative group">
                      <Avatar className="h-24 w-24 ring-4 ring-somba-accent/20">
                        <AvatarImage
                          src={photoPreview || (user.avatar ? `${(import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '')}${user.avatar}` : undefined)}
                          alt={user.full_name}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-somba-accent text-white text-xl">
                          {getUserInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Overlay pour l'upload */}
                      <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer">
                        <label
                          htmlFor="photo-upload"
                          className="cursor-pointer p-4 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                          title="Changer de photo"
                          onClick={(e) => {
                            e.preventDefault();
                            const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
                            if (fileInput) {
                              fileInput.click();
                            }
                          }}
                        >
                          <Edit className="h-6 w-6 text-white" />
                        </label>
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                          style={{ display: 'none' }}
                        />
                      </div>

                      {/* Indicateur de chargement */}
                      {loading && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}

                      {/* Message pour les utilisateurs sans photo */}
                      {!user.avatar && !photoPreview && !selectedPhoto && (
                        <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="text-center text-white">
                            <User className="h-6 w-6 mx-auto mb-1" />
                            <p className="text-xs font-medium">Ajouter une photo</p>
                          </div>
                        </div>
                      )}

                      {/* Message de confirmation pour photo existante */}
                      {user.avatar && !photoPreview && !selectedPhoto && (
                        <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="text-center text-white">
                            <Edit className="h-5 w-5 mx-auto mb-1" />
                            <p className="text-xs font-medium">Changer la photo</p>
                          </div>
                        </div>
                      )}

                      {/* Bouton changer photo pour OAuth photos */}
                      {user.avatar && user.avatar.startsWith('http') && !photoPreview && !selectedPhoto && (
                        <div className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
                              if (fileInput) {
                                fileInput.click();
                              }
                            }}
                            className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-white text-somba-primary border border-somba-primary/20"
                            title="Remplacer la photo OAuth par une photo personnalisée"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {/* Bouton supprimer pour les utilisateurs avec photo */}
                      {user.avatar && !selectedPhoto && !photoPreview && (
                        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleRemoveProfilePhoto}
                            disabled={loading}
                            className="h-6 w-6 p-0 rounded-full"
                            title="Supprimer la photo"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-bold text-somba-primary text-xl">{user.full_name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{user.email}</p>

                      {/* Badge de statut */}
                      <div className="flex items-center space-x-2 mb-3">
                        <Badge className="bg-green-500 text-white">
                          <Activity className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                        <Badge variant="outline" className="border-somba-accent text-somba-accent">
                          Membre Premium
                        </Badge>
                      </div>

                      {/* Statistiques utilisateur */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-somba-light/50 rounded-lg p-2">
                          <div className="text-lg font-bold text-somba-primary">{buyerStats?.totalOrders || 0}</div>
                          <div className="text-xs text-gray-600">Commandes</div>
                        </div>
                        <div className="bg-somba-light/50 rounded-lg p-2">
                          <div className="text-lg font-bold text-somba-primary">{buyerStats?.favoritesCount || 0}</div>
                          <div className="text-xs text-gray-600">Favoris</div>
                        </div>
                        <div className="bg-somba-light/50 rounded-lg p-2">
                          <div className="text-lg font-bold text-somba-primary">{buyerStats?.loyaltyPoints || 0}</div>
                          <div className="text-xs text-gray-600">Points</div>
                        </div>
                      </div>

                      {/* Message de photo sélectionnée */}
                      {selectedPhoto && (
                        <div className="mt-3 p-3 bg-somba-accent/10 border border-somba-accent/20 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-somba-accent" />
                              <div>
                                <span className="text-sm text-somba-accent font-medium">
                                  Photo sélectionnée: {selectedPhoto.name}
                                </span>
                                <p className="text-xs text-gray-600 mt-1">
                                  {Math.round(selectedPhoto.size / 1024)}KB • Cliquez sur "Mettre à jour" pour sauvegarder
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelPhotoSelection}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                              title="Annuler la sélection"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Bouton changer photo pour OAuth ou photos existantes */}
                      {!selectedPhoto && !photoPreview && (
                        <div className="mt-3 flex justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
                              if (fileInput) {
                                fileInput.click();
                              }
                            }}
                            className="border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {user.avatar ? 'Changer de photo' : 'Ajouter une photo'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-somba-primary">Nom complet</label>
                      <Input
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-somba-primary">Email</label>
                      <Input
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-somba-primary">Téléphone</label>
                      <Input
                        value={profileData.phone_number}
                        onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                        placeholder="+225 XX XX XX XX XX"
                        className="mt-1"
                      />
                    </div>
                    <div className="space-y-3">
                      <Button
                        onClick={handleProfileUpdate}
                        disabled={loading}
                        className="w-full bg-somba-accent hover:bg-somba-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Mise à jour en cours...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mettre à jour le profil
                          </>
                        )}
                      </Button>

                      {selectedPhoto && (
                        <p className="text-xs text-center text-gray-500">
                          💡 La photo sera automatiquement sauvegardée avec vos informations
                        </p>
                      )}

                      {/* Guide d'utilisation */}
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Conseils pour votre photo de profil
                        </h4>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>• Formats acceptés: JPG, PNG, GIF, WebP</li>
                          <li>• Taille maximale: 5MB</li>
                          <li>• Résolution recommandée: 200x200px minimum</li>
                          <li>• La photo sera automatiquement redimensionnée</li>
                          {user.avatar && user.avatar.startsWith('http') && (
                            <li className="text-orange-700 font-medium">• 💡 Vous pouvez remplacer votre photo Google/Facebook par une photo personnalisée</li>
                          )}
                        </ul>
                      </div>

                      {/* Historique des modifications */}
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="text-sm font-medium text-green-900 mb-2 flex items-center">
                          <Activity className="h-4 w-4 mr-2" />
                          Dernière activité
                        </h4>
                        <div className="text-xs text-green-800 space-y-1">
                          <p>• Profil actif depuis votre inscription</p>
                          {user.avatar && (
                            <p>• Photo de profil: Active</p>
                          )}
                          <p>• Dernière connexion: Aujourd'hui</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Préférences de notification */}
              <Card className="border-somba-primary/10">
                <CardHeader>
                  <CardTitle className="text-somba-primary flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Préférences de notification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-somba-primary">Notifications par email</h4>
                      <p className="text-sm text-gray-500">Recevoir les mises à jour par email</p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-somba-primary">Notifications SMS</h4>
                      <p className="text-sm text-gray-500">Recevoir les alertes par SMS</p>
                    </div>
                    <Switch
                      checked={smsNotifications}
                      onCheckedChange={setSmsNotifications}
                    />
                  </div>

                  <div className="pt-4 border-t border-somba-primary/10">
                    <h4 className="font-medium text-somba-primary mb-3">Types de notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Commandes et livraisons</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Promotions et offres</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Nouveaux produits</span>
                        <Switch />
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white">
                    Sauvegarder les préférences
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}