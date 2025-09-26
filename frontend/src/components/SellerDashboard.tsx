import { useState, useEffect, Component, ReactNode } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { useAuth } from "./AuthContext";
import { useStores } from "./StoresContext";
import { useProducts } from "./ProductsContext";
import { useShops } from "../contexts/ShopsContext";
import { StoreModal } from "./StoreModal";
import { ProductModal } from "./ProductModal";
import { ProductVariantModal } from "./ProductVariantModal";
import { FirstProductModal } from "./FirstProductModal";
import { StoreManagement } from "./StoreManagement";
import { OrderManagement } from "./OrderManagement";
import { ClientManagement } from "./ClientManagement";
import { SellerSettings } from "./SellerSettings";
import { CampaignManagement } from "./CampaignManagement";
import { BankAccountSettings } from "./BankAccountSettings";
import { WithdrawalManagement } from "./WithdrawalManagement";
import { toast } from "sonner";
import sellerService from "../services/sellerService";

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle className="text-red-600">Une erreur s'est produite</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Une erreur inattendue s'est produite. Veuillez rafraîchir la page.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Rafraîchir la page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  Store,
  Settings,
  Search,
  Eye,
  Edit,
  Plus,
  TrendingUp,
  
  Trash2,
  
  LogOut,
  Target,
  Zap,
  Activity,
  MapPin,
  Phone,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  SlidersHorizontal,
  Star,
  
  
  Download,
  
  CheckSquare,
  Square,
  CreditCard,
  ArrowUpRight,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SellerDashboardProps {
  onLogout: () => void;
}





interface TopProduct {
  id: string;
  name: string;
  price: string;
  stats?: {
    totalSold: number;
  };
}

interface TrafficSource {
  name: string;
  value: number;
  color: string;
}

interface DailySale {
  date: string;
  sales: number;
}

interface OrderByChannel {
  channel: string;
  orders: number;
}

interface PerformanceByCategory {
  category: string;
  sales: number;
  revenue: string;
}

interface RecentOrder {
  id: number;
  customerName: string;
  amount: number;
  time: string;
}

interface VisitorLocation {
  country: string;
  count: number;
}

interface ReportsData {
  totalSales: number;
  totalOrders: number;
  conversionRate: number;
  topProducts: TopProduct[];
  trafficSources: TrafficSource[];
  dailySales: DailySale[];
  ordersByChannel: OrderByChannel[];
  performanceByCategory: PerformanceByCategory[];
  liveVisitors: number;
  recentOrders: RecentOrder[];
  visitorLocations: VisitorLocation[];
}



// Données pour les graphiques
const revenueData = [
  { month: 'Jan', value: 1000000 },
  { month: 'Fév', value: 1200000 },
  { month: 'Mar', value: 1300000 },
  { month: 'Avr', value: 1450000 },
  { month: 'Mai', value: 1600000 },
  { month: 'Jun', value: 1850000 },
  { month: 'Jul', value: 2000000 },
];







export function SellerDashboard({ onLogout }: SellerDashboardProps) {
   const { user } = useAuth();
  const { addStore, updateStore, deleteStore, getStoresBySeller } = useStores();
   const { addProduct, updateProduct, deleteProduct, getProductsBySeller } = useProducts();
   const { refreshShops } = useShops();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedStoreForManagement, setSelectedStoreForManagement] = useState<any>(null);
  const [isEditingStore, setIsEditingStore] = useState(false);

  // Alibaba-style products interface state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [productFilters, setProductFilters] = useState({
    category: "all",
    status: "all",
    store: "all",
    priceRange: "all"
  });
  const [showFilters, setShowFilters] = useState(false);


  // 🔄 Algorithme Shopify - États d'initialisation
  const [dateRange, setDateRange] = useState("30"); // Période d'analyse (7, 30, 90 jours)
  const [filters, setFilters] = useState({
    channel: "all", // Canal de vente (Google, Direct, etc.)
    region: "all",  // Région géographique
    category: "all", // Catégorie de produits
    store: "all"    // Boutique spécifique
  });
  const [isLiveViewActive, setIsLiveViewActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  // Auto-refresh supprimé : dashboard toujours statique


  const [reports, setReports] = useState<ReportsData>({
    totalSales: 0,
    totalOrders: 0,
    conversionRate: 0,
    topProducts: [],
    trafficSources: [],
    dailySales: [],
    ordersByChannel: [],
    performanceByCategory: [],
    liveVisitors: 0,
    recentOrders: [],
    visitorLocations: []
  });

  const [sellerProfile, setSellerProfile] = useState<any>(null);

  // Get stores for current seller from AuthContext
  const currentSellerId = user?.id ? parseInt(user.id.toString()) : 0;
  const sellerStores = getStoresBySeller(currentSellerId);
  const sellerProducts = getProductsBySeller(currentSellerId);
  const isFirstProduct = sellerProducts.length === 0;

  // 🔄 Algorithme Shopify - Fonctions utilitaires
  const getDateRangeDays = () => parseInt(dateRange);
  const getFilteredData = (data: any[]) => {
    // Appliquer les filtres selon la logique Shopify
    return data.filter(item => {
      if (filters.store !== "all" && item.storeId !== parseInt(filters.store)) return false;
      if (filters.category !== "all" && item.category !== filters.category) return false;
      if (filters.region !== "all" && item.region !== filters.region) return false;
      if (filters.channel !== "all" && item.channel !== filters.channel) return false;
      return true;
    });
  };





  // Calcul des métriques principales avec données réelles
  const calculateOverviewMetrics = async () => {
    setIsLoading(true);
    try {
      // Récupérer les boutiques du vendeur
      const shopsResponse = await sellerService.getShops();
      if (!shopsResponse.success) {
        throw new Error(shopsResponse.error);
      }

      const shops = shopsResponse.data || [];
      const filteredShops = filters.store === "all" ? shops : shops.filter(s => s.id === parseInt(filters.store));

      let totalSales = 0;
      let totalOrders = 0;
      const allTopProducts: TopProduct[] = [];
      const allOrders: any[] = [];

      // Pour chaque boutique, récupérer les statistiques
      for (const shop of filteredShops) {
        try {
          const statsResponse = await sellerService.getShopStats(shop.id.toString());
          if (statsResponse.success && statsResponse.data) {
            const stats = statsResponse.data;
            totalSales += stats.total_sales || 0;

            // Récupérer les commandes pour cette boutique
            const ordersResponse = await sellerService.getOrders(shop.id.toString());
            if (ordersResponse.success && ordersResponse.data) {
              const orders = ordersResponse.data.orders || [];
              totalOrders += orders.length;
              allOrders.push(...orders);

              // Ajouter les produits les plus vendus
              if (stats.top_products) {
                stats.top_products.forEach(product => {
                  allTopProducts.push({
                    id: product.id.toString(),
                    name: product.name,
                    price: `${product.total_sold * 25000} F CFA`, // Estimation du prix
                    stats: { totalSold: product.total_sold }
                  });
                });
              }
            }
          }
        } catch (error) {
          console.warn(`Erreur lors de la récupération des stats pour la boutique ${shop.id}:`, error);
        }
      }

      // Trier et limiter les produits les plus vendus
      const topProducts = allTopProducts
        .sort((a, b) => (b.stats?.totalSold || 0) - (a.stats?.totalSold || 0))
        .slice(0, 5);

      // Taux de conversion (estimation basée sur les données réelles)
      const conversionRate = totalOrders > 0 ? ((totalOrders / (totalOrders * 3)) * 100) : 0;

      // Sources de trafic (estimation basée sur les campagnes - à implémenter plus tard)
      const trafficSources = [
        { name: 'Google', value: 25, color: '#4285F4' },
        { name: 'Direct', value: 20, color: '#34D399' }
      ];

      setReports(prev => ({
        ...prev,
        totalSales,
        totalOrders,
        conversionRate,
        topProducts,
        trafficSources
      }));
    } catch (error) {
      console.error('Erreur lors du calcul des métriques:', error);
      toast.error('Erreur lors du chargement des données du tableau de bord');
      // Fallback vers les données simulées en cas d'erreur

      const filteredStores = filters.store === "all" ? sellerStores : sellerStores.filter(s => s.id === parseInt(filters.store));
      const filteredProducts = getFilteredData(sellerProducts);

      const totalSales = filteredStores.reduce((sum, store) => sum + (store.stats?.monthlyRevenue || 0), 0);
      const totalOrders = Math.floor(totalSales / 25000);
      const conversionRate = totalOrders > 0 ? ((totalOrders / (totalOrders * 3)) * 100) : 0;

      const topProducts = filteredProducts
        .sort((a, b) => (b.stats?.totalSold || 0) - (a.stats?.totalSold || 0))
        .slice(0, 5);

      const trafficSources = [
        { name: 'Google', value: 25, color: '#4285F4' },
        { name: 'Direct', value: 20, color: '#34D399' }
      ];

      // Set values directly without animation
      setReports(prev => ({
        ...prev,
        totalSales,
        totalOrders,
        conversionRate,
        topProducts,
        trafficSources
      }));


    } finally {
      setIsLoading(false);
    }
  };

  // Vue en direct avec données réelles
  const startLiveView = (): (() => void) => {
    setIsLiveViewActive(true);
    setIsLoadingLive(true);

    const fetchLiveData = async () => {
      try {
        // Récupérer les boutiques du vendeur
        const shopsResponse = await sellerService.getShops();
        if (!shopsResponse.success) {
          throw new Error(shopsResponse.error);
        }

        const shops = shopsResponse.data || [];
        let totalLiveVisitors = 0;
        const allRecentOrders: RecentOrder[] = [];
        const locationCounts: { [key: string]: number } = {};

        // Pour chaque boutique, récupérer les données temps réel
        for (const shop of shops) {
          try {
            // Simulation de visiteurs actifs (dans un vrai système, ceci viendrait d'une API temps réel)
            totalLiveVisitors += Math.floor(Math.random() * 20) + 5;

            // Récupérer les commandes récentes (dernières 24h)
            const ordersResponse = await sellerService.getOrders(shop.id.toString(), {
              limit: 10 // Limiter aux 10 dernières commandes
            });

            if (ordersResponse.success && ordersResponse.data) {
              const orders = ordersResponse.data.orders || [];
              const recentOrdersFromShop = orders
                .filter(order => {
                  const orderDate = new Date(order.created_at);
                  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                  return orderDate > oneDayAgo;
                })
                .slice(0, 3) // Maximum 3 commandes récentes par boutique
                .map(order => ({
                  id: order.id,
                  customerName: order.buyer_name || `Client ${order.id}`,
                  amount: order.total || 0,
                  time: new Date(order.created_at).toLocaleTimeString('fr-FR')
                }));

              allRecentOrders.push(...recentOrdersFromShop);

              // Agréger les localisations des visiteurs
              orders.forEach(order => {
                const country = order.shipping_address?.split(',')[1]?.trim() || 'Congo'; // Estimation
                locationCounts[country] = (locationCounts[country] || 0) + 1;
              });
            }
          } catch (error) {
            console.warn(`Erreur lors de la récupération des données temps réel pour la boutique ${shop.id}:`, error);
          }
        }

        // Convertir les localisations en format requis
        const visitorLocations = Object.entries(locationCounts)
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 4); // Top 4 pays

        // Si pas de données de localisation, utiliser des données simulées
        if (visitorLocations.length === 0) {
          visitorLocations.push(
            { country: 'Congo', count: Math.floor(Math.random() * 20) + 5 },
            { country: 'France', count: Math.floor(Math.random() * 10) + 2 },
            { country: 'Canada', count: Math.floor(Math.random() * 8) + 1 },
            { country: 'Belgique', count: Math.floor(Math.random() * 5) + 1 }
          );
        }

        setReports(prev => ({
          ...prev,
          liveVisitors: totalLiveVisitors || Math.floor(Math.random() * 50) + 10,
          recentOrders: allRecentOrders.slice(0, 6), // Maximum 6 commandes récentes
          visitorLocations
        }));
      } catch (error) {
        console.error('Erreur lors de la récupération des données temps réel:', error);

        // Fallback vers les données simulées
        const liveVisitors = Math.floor(Math.random() * 50) + 10;
        const recentOrders = Array.from({ length: Math.floor(Math.random() * 3) }, (_, i) => ({
          id: Date.now() + i,
          customerName: `Client ${Math.floor(Math.random() * 1000)}`,
          amount: Math.floor(Math.random() * 50000) + 5000,
          time: new Date().toLocaleTimeString('fr-FR')
        }));
        const visitorLocations = [
          { country: 'Congo', count: Math.floor(Math.random() * 20) + 5 },
          { country: 'France', count: Math.floor(Math.random() * 10) + 2 },
          { country: 'Canada', count: Math.floor(Math.random() * 8) + 1 },
          { country: 'Belgique', count: Math.floor(Math.random() * 5) + 1 }
        ];

        setReports(prev => ({
          ...prev,
          liveVisitors,
          recentOrders,
          visitorLocations
        }));
      } finally {
        setIsLoadingLive(false);
      }
    };

    // Récupération initiale (sans await pour rester synchrone)
    fetchLiveData();

    // Rafraîchissement périodique
    const interval = setInterval(fetchLiveData, 5000);

    return () => clearInterval(interval);
  };

  const stopLiveView = () => {
    setIsLiveViewActive(false);
  };

  // 🔄 Algorithme Shopify - Génération des rapports avec données réelles
  const generateAnalyticsReport = async () => {
    setIsLoadingAnalytics(true);

    // Safeguard: reset loading after 10 seconds max
    const loadingTimeout = setTimeout(() => {
      setIsLoadingAnalytics(false);
    }, 10000);

    try {
      const days = getDateRangeDays();

      // Récupérer les boutiques du vendeur
      const shopsResponse = await sellerService.getShops();
      if (!shopsResponse.success) {
        throw new Error(shopsResponse.error);
      }

      const shops = shopsResponse.data || [];
      const filteredShops = getFilteredData(shops);

      const allOrders: any[] = [];
      const allProducts: any[] = [];

      // Pour chaque boutique filtrée, récupérer les commandes et statistiques
      for (const shop of filteredShops) {
        try {
          const ordersResponse = await sellerService.getOrders(shop.id.toString());
          if (ordersResponse.success && ordersResponse.data) {
            const orders = ordersResponse.data.orders || [];
            allOrders.push(...orders);
          }

          const productsResponse = await sellerService.getProducts(shop.id.toString());
          if (productsResponse.success && productsResponse.data) {
            const products = productsResponse.data.products || [];
            allProducts.push(...products);
          }
        } catch (error) {
          console.warn(`Erreur lors de la récupération des données pour la boutique ${shop.id}:`, error);
        }
      }

      // 1. Calculer la performance par catégorie
      const categoryMap: { [category: string]: { sales: number; revenue: number } } = {};

      allOrders.forEach(order => {
        // Supposons que chaque commande a une liste de produits achetés dans order.items
        (order.items || []).forEach((item: any) => {
          const category = item.category || 'Non classé';
          const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0;
          const quantity = item.quantity || 1;
          if (!categoryMap[category]) {
            categoryMap[category] = { sales: 0, revenue: 0 };
          }
          categoryMap[category].sales += quantity;
          categoryMap[category].revenue += price * quantity;
        });
      });

      // 2. Transformer en tableau pour le dashboard (vide selon la logique)
      const performanceByCategory: PerformanceByCategory[] = [];

      // Générer les commandes journalières basées sur les données réelles
      const dailySales = Array.from({ length: days }, (_, i) => {
        const date = new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        // Filtrer les commandes du jour
        const dayOrders = allOrders.filter(order =>
          (order.created_at || order.createdAt)?.split('T')[0] === date
        );
        // Calculer le chiffre d'affaires du jour
        const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        return {
          date,
          sales: dayOrders.length,
          revenue: dayRevenue
        };
      });

      // Commandes par canal (estimation basée sur les données disponibles)
      const ordersByChannel = [
        { channel: 'Google', orders: Math.floor(allOrders.length * 0.25) || Math.floor(Math.random() * 30) + 10 },
        { channel: 'Direct', orders: Math.floor(allOrders.length * 0.2) || Math.floor(Math.random() * 40) + 15 }
      ];

      // Mettre à jour le state reports en une seule fois pour éviter les conflits DOM
      setReports(prev => ({
        ...prev,
        performanceByCategory,
        dailySales,
        ordersByChannel
      }));
    } catch (error) {
      console.error('Erreur lors de la génération du rapport analytique:', error);
      toast.error('Erreur lors du chargement des données analytiques');

      // Fallback vers les données simulées
      const days = getDateRangeDays();
      const dailySales = Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sales: Math.floor(Math.random() * 15) + 5 // 5-20 commandes par jour
      }));

      const ordersByChannel = [
        { channel: 'Google', orders: Math.floor(Math.random() * 30) + 10 },
        { channel: 'Direct', orders: Math.floor(Math.random() * 40) + 15 }
      ];



      setReports(prev => ({
        ...prev,
        dailySales,
        ordersByChannel
      }));
    } finally {
      clearTimeout(loadingTimeout);
      setIsLoadingAnalytics(false);
    }
  };

  //  Effets de cycle de vie
  useEffect(() => {
    calculateOverviewMetrics();
  }, [filters, dateRange]);



  // Fetch seller profile
  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        const response = await sellerService.getSellerProfile();
        if (response.success) {
          setSellerProfile(response.data);
        }
      } catch (error) {
        console.error('Error fetching seller profile:', error);
      }
    };
    fetchSellerProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      generateAnalyticsReport();
    }
  }, [activeTab, filters, dateRange, sellerStores]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (activeTab === 'live' && isLiveViewActive) {
      cleanup = startLiveView();
    } else {
      stopLiveView();
    }
    return cleanup;
  }, [activeTab, isLiveViewActive]);

  const handleViewStore = (storeId: number) => {
    const store = sellerStores.find(s => s.id === storeId);
    toast.info(`Consultation de la boutique ${store?.name}`);
  };

  const handleEditStore = (storeId: number) => {
    const store = sellerStores.find(s => s.id === storeId);
    if (store) {
      setSelectedStoreForManagement(store);
      setIsEditingStore(true);
    }
  };

  const handleNavigationAttempt = (newTab: string) => {
    if (isEditingStore) {
      const confirmed = window.confirm(
        "Vous êtes en cours de modification d'une boutique. Vos modifications non sauvegardées seront perdues. Voulez-vous continuer ?"
      );
      if (!confirmed) {
        return false;
      }
      setIsEditingStore(false);
      setSelectedStoreForManagement(null);
    }
    setActiveTab(newTab);
    return true;
  };



  const handleDeleteStore = (storeId: number) => {
    const store = sellerStores.find(s => s.id === storeId);
    if (store && window.confirm(`Êtes-vous sûr de vouloir supprimer la boutique "${store.name}" ?`)) {
      deleteStore(storeId);
      toast.success(`Boutique "${store.name}" supprimée avec succès`);
    }
  };


  const handleAddStore = () => {
    setEditingStore(null);
    setIsStoreModalOpen(true);
  };

  const handleSaveStore = async (storeData: any) => {
    if (editingStore) {
      // Update existing store
      updateStore(editingStore.id, storeData);
    } else {
      // Add new store
      await addStore(storeData);
      // Refresh shops in ShopsContext so StoresPage shows the new shop immediately
      await refreshShops();
    }
    setIsStoreModalOpen(false);
    setEditingStore(null);
  };

  // Product management functions
  const handleAddProduct = () => {
    if (sellerStores.length === 0) {
      toast.error("Vous devez d'abord créer une boutique pour ajouter des produits");
      return;
    }
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleAddProductWithVariants = () => {
    if (sellerStores.length === 0) {
      toast.error("Vous devez d'abord créer une boutique pour ajouter des produits");
      return;
    }
    setEditingProduct(null);
    setIsVariantModalOpen(true);
  };

  const handleEditProduct = (productId: number) => {
    const product = sellerProducts.find(p => p.id === productId);
    if (product) {
      setEditingProduct(product);
      setIsProductModalOpen(true);
    }
  };

  const handleDeleteProduct = (productId: number) => {
    const product = sellerProducts.find(p => p.id === productId);
    if (product && window.confirm(`Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ?`)) {
      deleteProduct(productId);
      toast.success(`Produit "${product.name}" supprimé avec succès`);
    }
  };

  const handleSaveProduct = (productData: any) => {
    if (editingProduct) {
      // Update existing product
      updateProduct(editingProduct.id, productData);
    } else {
      // Add new product - Alibaba Algorithm: Find shop by name and get ID
      const selectedStore = sellerStores.find(store => store.name === productData.boutique);
      if (!selectedStore) {
        toast.error("Boutique non trouvée. Veuillez sélectionner une boutique valide.");
        return;
      }

      addProduct({
        ...productData,
        sellerId: currentSellerId,
        storeId: selectedStore.id
      });
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };



  const sidebarItems = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'orders', label: 'Commandes', icon: ShoppingCart },
    { id: 'stores', label: 'Mes Boutiques', icon: Store },
    { id: 'products', label: 'Produits', icon: Package },
    { id: 'campaigns', label: 'Campagnes Publicitaires', icon: Target },
    { id: 'analytics', label: 'Statistiques', icon: BarChart3 },
    { id: 'live', label: 'Vue en direct', icon: Activity },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'bank-settings', label: 'Paramètres bancaires', icon: CreditCard },
    { id: 'withdrawals', label: 'Retraits', icon: ArrowUpRight },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  const renderSidebar = () => (
    <div className="w-64 bg-white border-r border-somba-primary/10 h-screen sticky top-0">
      <div className="p-4 border-b border-somba-primary/10">
        <h1 className="font-bold">
          <span className="text-somba-accent">SOMBA</span>
          <span className="text-somba-primary ml-1">Dashboard Vendeur</span>
        </h1>
      </div>
      
      <nav className="p-4 space-y-2">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigationAttempt(item.id)}
            disabled={isEditingStore && activeTab !== item.id}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === item.id
                ? 'bg-somba-accent text-white'
                : isEditingStore && activeTab !== item.id
                ? 'text-somba-text-light cursor-not-allowed opacity-50'
                : 'text-somba-primary hover:bg-somba-light'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Edit Mode Alert */}
      {isEditingStore && (
        <div className="mx-4 mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Edit className="h-4 w-4 text-orange-600" />
            <p className="text-sm font-medium text-orange-800">Mode édition</p>
          </div>
          <p className="text-xs text-orange-700 mt-1">
            Navigation limitée pendant la modification
          </p>
        </div>
      )}

      {/* Logout Button */}
      <div className="absolute bottom-4 left-4 right-4">
        <Button
          onClick={() => {
            if (isEditingStore) {
              const confirmed = window.confirm(
                "Vous êtes en cours de modification d'une boutique. Vos modifications non sauvegardées seront perdues. Voulez-vous continuer ?"
              );
              if (!confirmed) return;
            }
            onLogout();
          }}
          variant="outline"
          className="w-full border-red-300 text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </div>
  );

  const renderOrders = () => (
    <OrderManagement />
  );

  const renderStores = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-somba-primary to-somba-accent p-6 rounded-xl text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mes Boutiques</h1>
            <p className="text-somba-light/90 text-lg">Gérez vos différentes boutiques et leurs performances</p>
            <div className="flex items-center mt-4 space-x-6">
              <div className="flex items-center space-x-2">
                <Store className="h-5 w-5" />
                <span className="font-semibold">{sellerStores.length} boutique{sellerStores.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span className="font-semibold">{sellerStores.reduce((sum, store) => sum + store.stats.totalProducts, 0)} produits</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">{sellerStores.filter(s => s.isActive).length} actif{sellerStores.filter(s => s.isActive).length > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <Button onClick={handleAddStore} className="bg-white text-somba-primary hover:bg-gray-100 font-semibold px-6 py-3 text-lg shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              Nouvelle Boutique
            </Button>
            <p className="text-xs text-somba-light/70 mt-2">Créez une nouvelle boutique en quelques clics</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {sellerStores.map((store) => (
          <Card key={store.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-somba-accent">
            <div className="h-48 overflow-hidden relative">
              <ImageWithFallback
                src={store.image}
                alt={store.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 right-3">
                <Badge className={`${store.isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white"} shadow-md`}>
                  {store.isActive ? '✓ Actif' : '⏸️ Inactive'}
                </Badge>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-somba-primary mb-1">{store.name}</h3>
                  <p className="text-sm text-somba-text-light font-medium">{store.category}</p>
                  <div className="flex items-center mt-2">
                    <div className="flex items-center text-yellow-500 text-sm">
                      <span>★</span>
                      <span className="ml-1 text-somba-primary font-medium">{store.rating?.toFixed(1) || '4.5'}</span>
                      <span className="text-somba-text-light ml-1">({store.reviewsCount || 0} avis)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-somba-text-light flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {store.address || 'Adresse non spécifiée'}
                </p>
                <p className="text-xs text-somba-text-light flex items-center mt-1">
                  <Phone className="h-3 w-3 mr-1" />
                  {store.phone || 'Téléphone non spécifié'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 my-4 p-3 bg-somba-light/50 rounded-lg">
                <div className="text-center">
                  <p className="text-xl font-bold text-somba-primary">{store.stats.totalProducts}</p>
                  <p className="text-xs text-somba-text-light font-medium">Produits</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-somba-primary">{store.stats.totalSales}</p>
                  <p className="text-xs text-somba-text-light font-medium">Ventes</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-somba-primary">{(store.stats.monthlyRevenue / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-somba-text-light font-medium">CA F CFA</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white flex-1"
                  onClick={() => handleViewStore(store.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Voir
                </Button>
                <Button
                  size="sm"
                  className="bg-somba-accent hover:bg-somba-accent/90 flex-1"
                  onClick={() => handleEditStore(store.id)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Gérer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 p-2"
                  onClick={() => handleDeleteStore(store.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      
      {/* Message si aucune boutique */}
      {sellerStores.length === 0 && (
        <Card className="border-2 border-dashed border-somba-primary/20 bg-gradient-to-br from-somba-light/30 to-white">
          <CardContent className="p-12 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-somba-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="h-10 w-10 text-somba-accent" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-somba-accent rounded-full flex items-center justify-center">
                <Plus className="h-4 w-4 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-somba-primary mb-3">Créez votre première boutique</h3>
            <p className="text-somba-text-light mb-6 max-w-md mx-auto">
              Commencez votre aventure e-commerce en créant votre boutique. Ajoutez vos produits, personnalisez votre image et commencez à vendre !
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleAddStore} className="bg-somba-accent hover:bg-somba-accent/90 px-8 py-3 text-lg">
                <Plus className="h-5 w-5 mr-2" />
                Créer ma première boutique
              </Button>
              <Button variant="outline" className="border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white px-6 py-3">
                <Target className="h-4 w-4 mr-2" />
                Voir les conseils
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="p-4 bg-white rounded-lg border border-somba-primary/10">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <Package className="h-4 w-4 text-green-600" />
                </div>
                <h4 className="font-semibold text-somba-primary mb-1">Ajoutez vos produits</h4>
                <p className="text-xs text-somba-text-light">Importez facilement vos produits avec photos et descriptions</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-somba-primary/10">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <h4 className="font-semibold text-somba-primary mb-1">Attirez des clients</h4>
                <p className="text-xs text-somba-text-light">Utilisez nos outils marketing pour développer votre clientèle</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-somba-primary/10">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </div>
                <h4 className="font-semibold text-somba-primary mb-1">Suivez vos ventes</h4>
                <p className="text-xs text-somba-text-light">Analysez vos performances avec des rapports détaillés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de gestion des boutiques */}
      <StoreModal 
        isOpen={isStoreModalOpen}
        onClose={() => {
          setIsStoreModalOpen(false);
          setEditingStore(null);
        }}
        onSave={handleSaveStore}
        store={editingStore}
        sellerId={currentSellerId}
      />
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-somba-primary">Statistiques</h1>
          <p className="text-somba-text-light">Analysez les performances de vos boutiques</p>
        </div>

        {/* Controls for date range and filters */}
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-somba-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent"
          >
            <option value="7">7 jours</option>
            <option value="30">30 jours</option>
            <option value="90">90 jours</option>
          </select>

          <select
            value={filters.channel}
            onChange={(e) => setFilters(prev => ({ ...prev, channel: e.target.value }))}
            className="px-3 py-2 border border-somba-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent"
          >
            <option value="all">Tous canaux</option>
            
            <option value="Google">Google</option>
            <option value="Direct">Direct</option>
            
          </select>

          <select
            value={filters.store}
            onChange={(e) => setFilters(prev => ({ ...prev, store: e.target.value }))}
            className="px-3 py-2 border border-somba-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent"
          >
            <option value="all">Toutes boutiques</option>
            {sellerStores.map(store => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution du chiffre d'affaires */}
        <Card>
          <CardHeader>
            <CardTitle className="text-somba-primary">Évolution du chiffre d'affaires</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={reports.dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip formatter={(value) => [`${value.toLocaleString()} F CFA`, "Chiffre d'affaires"]} />
                <Line
                  type="monotone"
                  dataKey="revenue" // <-- Affiche le chiffre d'affaires réel
                  stroke="#FF6600"
                  strokeWidth={3}
                  dot={{ fill: '#FF6600', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Commandes par jour */}
        <Card>
          <CardHeader>
            <CardTitle className="text-somba-primary">Commandes par jour</CardTitle>
            <p className="text-sm text-somba-text-light">Évolution quotidienne des commandes</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={reports.dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  fontSize={12}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
                  }}
                />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip
                  formatter={(value) => [`${value}`, 'Commandes']}
                  labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString('fr-FR')}`}
                />
                <Bar
                  dataKey="sales"
                  fill="#FF6600"
                  radius={[4, 4, 0, 0]}
                  name="Commandes"
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-somba-accent rounded-full"></div>
                <span className="text-somba-text-light">Commandes quotidiennes</span>
              </div>
              <div className="text-somba-primary font-semibold">
                Moyenne: {Math.round(reports.dailySales.reduce((sum, day) => sum + day.sales, 0) / reports.dailySales.length)} commandes/jour
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Répartition par boutique */}
        <Card>
          <CardHeader>
            <CardTitle className="text-somba-primary">Répartition par boutique</CardTitle>
            <p className="text-sm text-somba-text-light">Ventes par boutique</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sellerStores.map((store, index) => ({
                    name: store.name,
                    value: store.stats?.totalSales || Math.floor(Math.random() * 100) + 20,
                    color: ['#FF6600', '#0088FE', '#00C49F', '#FF8042', '#8884D8'][index % 5]
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                >
                  {sellerStores.map((store, index) => (
                    <Cell key={`cell-${index}`} fill={['#FF6600', '#0088FE', '#00C49F', '#FF8042', '#8884D8'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} ventes`, 'Ventes']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center flex-wrap gap-4 mt-4">
              {sellerStores.map((storeItem, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ['#FF6600', '#0088FE', '#00C49F', '#FF8042', '#8884D8'][index % 5] }}
                  ></div>
                  <span className="text-sm text-somba-text-light">{storeItem.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance par catégorie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-somba-primary">Performance par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.performanceByCategory.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-somba-primary/10 rounded-lg">
                  <div>
                    <p className="font-semibold text-somba-primary">{category.category}</p>
                    <p className="text-sm text-somba-text-light">{category.sales} ventes</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-somba-primary">{category.revenue}</p>
                    <div className="w-20 h-2 bg-gray-200 rounded-full mt-1">
                      <div
                        className="h-2 bg-somba-accent rounded-full"
                        style={{ width: `${Math.min(category.sales * 2, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderLive = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-somba-primary">Vue en direct</h1>
          <p className="text-somba-text-light">Suivez l'activité en temps réel de vos boutiques</p>
          {isLoadingLive && (
            <div className="mt-2 flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-somba-accent"></div>
              <span className="text-sm text-somba-text-light">Chargement des données temps réel...</span>
            </div>
          )}
        </div>

        <Button
          onClick={() => setIsLiveViewActive(!isLiveViewActive)}
          className={isLiveViewActive ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
        >
          {isLiveViewActive ? "Arrêter" : "Démarrer"} le suivi
        </Button>
      </div>

      {isLiveViewActive ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visiteurs actifs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-somba-primary">Visiteurs actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-somba-accent mb-2">{reports.liveVisitors}</div>
                <p className="text-somba-text-light">personnes en ligne</p>
                <div className="mt-4">
                  <Activity className="h-8 w-8 text-green-500 mx-auto animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commandes récentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-somba-primary">Commandes récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reports.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border border-somba-primary/10 rounded-lg">
                    <div>
                      <p className="font-semibold text-somba-primary">{order.customerName}</p>
                      <p className="text-sm text-somba-text-light">{order.time}</p>
                    </div>
                    <p className="font-semibold text-somba-primary">{(() => {
                      if (order.amount === undefined || order.amount === null) return 'Prix non disponible';
                      const numPrice = typeof order.amount === 'string' ? parseFloat(order.amount) : order.amount;
                      if (isNaN(numPrice)) return 'Prix non disponible';
                      return numPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' });
                    })()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Localisation des visiteurs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-somba-primary">Localisation des visiteurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reports.visitorLocations.map((location, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-somba-primary/10 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <p className="font-semibold text-somba-primary">{location.country}</p>
                    </div>
                    <p className="font-semibold text-somba-primary">{location.count} visiteurs</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Activity className="h-12 w-12 text-somba-text-light mx-auto mb-4" />
            <h3 className="text-lg font-medium text-somba-primary mb-2">Vue en direct inactive</h3>
            <p className="text-somba-text-light mb-4">
              Cliquez sur "Démarrer le suivi" pour voir l'activité en temps réel de vos boutiques.
            </p>
            <Button
              onClick={() => setIsLiveViewActive(true)}
              className="bg-green-500 hover:bg-green-600"
            >
              <Zap className="h-4 w-4 mr-2" />
              Démarrer le suivi
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Alibaba-style products processing functions
  const getFilteredAndSortedProducts = () => {
    let filtered = sellerProducts.filter(product => {
      // Search filter
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.boutique.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = productFilters.category === "all" ||
                             product.category === productFilters.category;

      // Status filter
      const matchesStatus = productFilters.status === "all" ||
                           (productFilters.status === "active" && product.inStock !== false) ||
                           (productFilters.status === "inactive" && product.inStock === false);

      // Store filter
      const matchesStore = productFilters.store === "all" ||
                          product.boutique === productFilters.store;

      return matchesSearch && matchesCategory && matchesStatus && matchesStore;
    });

    // Sort products
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "price":
          aValue = parseFloat(a.price.replace(/[^\d]/g, "")) || 0;
          bValue = parseFloat(b.price.replace(/[^\d]/g, "")) || 0;
          break;
        case "status":
          aValue = a.inStock !== false ? 1 : 0;
          bValue = b.inStock !== false ? 1 : 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredProducts = getFilteredAndSortedProducts();
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };



  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) return;

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${selectedProducts.length} produit(s) ?`
    );

    if (confirmed) {
      selectedProducts.forEach(id => deleteProduct(id));
      setSelectedProducts([]);
      toast.success(`${selectedProducts.length} produit(s) supprimé(s)`);
    }
  };

  const renderProducts = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-somba-primary to-somba-accent p-6 rounded-xl text-white mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mes Produits</h1>
            <p className="text-somba-light/90 text-lg">Gérez votre catalogue de produits professionnels</p>
            <div className="flex items-center mt-4 space-x-6">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span className="font-semibold">{sellerProducts.length} produits</span>
              </div>
              <div className="flex items-center space-x-2">
                <Store className="h-5 w-5" />
                <span className="font-semibold">{sellerStores.length} boutiques</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">{sellerProducts.filter(p => p.inStock !== false).length} en stock</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex gap-3">
              <Button onClick={handleAddProduct} className="bg-white text-somba-primary hover:bg-gray-100 font-semibold px-6 py-3 text-lg shadow-lg min-w-[200px]">
                <Plus className="h-5 w-5 mr-2" />
                Produit Simple
              </Button>
              <Button onClick={handleAddProductWithVariants} className="bg-somba-accent hover:bg-somba-accent/90 text-white font-semibold px-4 py-2 text-base shadow-lg" size="default">
                <Package className="h-4 w-4 mr-2" />
                Produit avec Variantes
              </Button>
            </div>
            <p className="text-xs text-somba-light/70 mt-2">Ajoutez un produit simple ou avec des variantes à votre catalogue</p>
          </div>
        </div>
      </div>

      {/* Advanced Search and Filters Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, boutique, référence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <select
              value={productFilters.category}
              onChange={(e) => setProductFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent"
            >
              <option value="all">Toutes catégories</option>
              <option value="Électronique">Électronique</option>
              <option value="Mode">Mode</option>
              <option value="Gaming">Gaming</option>
              <option value="Électroménager">Électroménager</option>
              <option value="Sport">Sport</option>
              <option value="Beauté">Beauté</option>
            </select>

            <select
              value={productFilters.status}
              onChange={(e) => setProductFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent"
            >
              <option value="all">Tous statuts</option>
              <option value="active">En stock</option>
              <option value="inactive">Rupture de stock</option>
            </select>

            <select
              value={productFilters.store}
              onChange={(e) => setProductFilters(prev => ({ ...prev, store: e.target.value }))}
              className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent"
            >
              <option value="all">Toutes boutiques</option>
              {sellerStores.map(store => (
                <option key={store.id} value={store.name}>{store.name}</option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-gray-300"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtres avancés
            </Button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prix</label>
                <select
                  value={productFilters.priceRange}
                  onChange={(e) => setProductFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent"
                >
                  <option value="all">Tous prix</option>
                  <option value="0-50000">0 - 50,000 F CFA</option>
                  <option value="50000-200000">50,000 - 200,000 F CFA</option>
                  <option value="200000+">200,000+ F CFA</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedProducts.length} sélectionné(s)</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          )}

          {/* Results count */}
          <div className="text-sm text-gray-600">
            {filteredProducts.length} produit(s) trouvé(s)
            {searchQuery && ` pour "${searchQuery}"`}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order as "asc" | "desc");
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent"
          >
            <option value="name-asc">Nom A-Z</option>
            <option value="name-desc">Nom Z-A</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
            <option value="status-desc">En stock d'abord</option>
          </select>

          {/* View Mode */}
          <div className="flex border border-gray-300 rounded-lg">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Items per page */}
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent"
          >
            <option value={12}>12 par page</option>
            <option value={24}>24 par page</option>
            <option value={48}>48 par page</option>
          </select>
        </div>
      </div>

      {/* Products Grid/List */}
      {paginatedProducts.length > 0 ? (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-somba-accent group">
                  {/* Checkbox for bulk selection */}
                  <div className="absolute top-3 left-3 z-10">
                    <button
                      onClick={() => handleSelectProduct(product.id)}
                      className="w-5 h-5 border-2 border-white rounded bg-white/80 hover:bg-white transition-colors flex items-center justify-center"
                    >
                      {selectedProducts.includes(product.id) ? (
                        <CheckSquare className="h-3 w-3 text-somba-primary" />
                      ) : (
                        <Square className="h-3 w-3 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <div className="h-48 overflow-hidden relative">
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className={`${product.inStock !== false ? "bg-green-500 text-white" : "bg-red-500 text-white"} shadow-md`}>
                        {product.inStock !== false ? '✓ En stock' : '⏸️ Rupture'}
                      </Badge>
                    </div>
                    {/* Quick actions overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEditProduct(product.id)}
                          className="bg-white text-somba-primary hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="bg-white text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div>
                        <h3 className="font-semibold text-somba-primary text-lg line-clamp-2 group-hover:text-somba-accent transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-sm text-somba-text-light">{product.boutique}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">
                            {(Math.random() * 1.5 + 3.5).toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">#{product.id}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xl font-bold text-somba-primary">{product.price}</p>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toast.info(`Consultation du produit ${product.name}`)}
                            className="border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditProduct(product.id)}
                            className="border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-3">
              {paginatedProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleSelectProduct(product.id)}
                        className="flex-shrink-0"
                      >
                        {selectedProducts.includes(product.id) ? (
                          <CheckSquare className="h-5 w-5 text-somba-primary" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>

                      {/* Product Image */}
                      <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg">
                        <ImageWithFallback
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-somba-primary text-lg truncate">
                          {product.name}
                        </h3>
                        <p className="text-sm text-somba-text-light">{product.boutique}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-500">#{product.id}</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">
                              {(Math.random() * 1.5 + 3.5).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex-shrink-0">
                        <Badge className={`${product.inStock !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {product.inStock !== false ? 'En stock' : 'Rupture'}
                        </Badge>
                      </div>

                      {/* Price */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xl font-bold text-somba-primary">{product.price}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toast.info(`Consultation du produit ${product.name}`)}
                          className="border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditProduct(product.id)}
                          className="border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">
                Affichage de {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredProducts.length)} sur {filteredProducts.length} produits
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10 h-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <Card className="border-2 border-dashed border-somba-primary/20 bg-gradient-to-br from-somba-light/30 to-white">
          <CardContent className="p-12 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-somba-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-10 w-10 text-somba-accent" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-somba-accent rounded-full flex items-center justify-center">
                <Plus className="h-4 w-4 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-somba-primary mb-3">
              {searchQuery ? 'Aucun produit trouvé' : 'Aucun produit dans votre catalogue'}
            </h3>
            <p className="text-somba-text-light mb-6 max-w-md mx-auto">
              {searchQuery
                ? `Aucun produit ne correspond à votre recherche "${searchQuery}". Essayez avec d'autres termes.`
                : 'Commencez à construire votre catalogue en ajoutant vos premiers produits.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleAddProduct} className="bg-somba-accent hover:bg-somba-accent/90 px-8 py-3 text-lg min-w-[200px]">
                <Plus className="h-5 w-5 mr-2" />
                Produit Simple
              </Button>
              <Button onClick={handleAddProductWithVariants} className="bg-somba-primary hover:bg-somba-primary/90 text-white font-semibold px-4 py-2 text-base" size="default">
                <Package className="h-4 w-4 mr-2" />
                Produit avec Variantes
              </Button>
              {!searchQuery && (
                <Button variant="outline" className="border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white px-6 py-3">
                  <Download className="h-4 w-4 mr-2" />
                  Importer des produits
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Modal */}
      {isFirstProduct && !editingProduct ? (
        <FirstProductModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          sellerId={currentSellerId}
        />
      ) : (
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          product={editingProduct}
          sellerId={currentSellerId}
        />
      )}

      {/* Product Variant Modal */}
      <ProductVariantModal
        isOpen={isVariantModalOpen}
        onClose={() => {
          setIsVariantModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        product={editingProduct}
        sellerId={currentSellerId}
      />
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-somba-primary">Vue d'ensemble</h1>
          <p className="text-somba-text-light">Tableau de bord de vos performances globales</p>
          {isLoading && (
            <div className="mt-2 flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-somba-accent"></div>
              <span className="text-sm text-somba-text-light">Chargement des données...</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={calculateOverviewMetrics}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-somba-primary mr-2"></div>
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Actualiser
          </Button>


        </div>
      </div>

      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-somba-primary via-somba-accent to-somba-primary p-6 rounded-xl text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Bienvenue sur votre tableau de bord !</h2>
            <p className="text-somba-light/90">Voici un aperçu de vos performances commerciales</p>

          </div>
          {/* Dernière mise à jour supprimée car lastUpdateTime n'existe plus */}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <Card className={`hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 ${isLoading ? 'animate-pulse' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-somba-text-light font-medium">Chiffre d'affaires</p>
                <p className="text-3xl font-bold text-somba-primary mt-1 transition-all duration-500 ease-out">{(() => {
                  if (reports.totalSales === undefined || reports.totalSales === null) return 'Prix non disponible';
                  const numPrice = typeof reports.totalSales === 'string' ? parseFloat(reports.totalSales) : reports.totalSales;
                  if (isNaN(numPrice)) return 'Prix non disponible';
                  return numPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' });
                })()}</p>
                <div className="flex items-center mt-2">
                  <div className="flex items-center text-green-600 text-sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="font-semibold">+12,5%</span>
                  </div>
                  <span className="text-somba-text-light text-xs ml-2">vs mois dernier</span>
                </div>
              </div>
              <div className="h-14 w-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center transition-transform duration-300 hover:scale-110">
                <TrendingUp className="h-7 w-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 ${isLoading ? 'animate-pulse' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-somba-text-light font-medium">Commandes totales</p>
                <p className="text-3xl font-bold text-somba-primary mt-1 transition-all duration-500 ease-out">{reports.totalOrders}</p>
                <div className="flex items-center mt-2">
                  <div className="flex items-center text-blue-600 text-sm">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    <span className="font-semibold">+8,7%</span>
                  </div>
                  <span className="text-somba-text-light text-xs ml-2">vs mois dernier</span>
                </div>
              </div>
              <div className="h-14 w-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center transition-transform duration-300 hover:scale-110">
                <ShoppingCart className="h-7 w-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 ${isLoading ? 'animate-pulse' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-somba-text-light font-medium">Boutiques actives</p>
                <p className="text-3xl font-bold text-somba-primary mt-1 transition-all duration-500 ease-out">{sellerStores.filter(s => s.isActive).length}</p>
                <div className="flex items-center mt-2">
                  <div className="flex items-center text-purple-600 text-sm">
                    <Store className="h-4 w-4 mr-1" />
                    <span className="font-semibold">{sellerStores.length} total</span>
                  </div>
                </div>
              </div>
              <div className="h-14 w-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center transition-transform duration-300 hover:scale-110">
                <Store className="h-7 w-7 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 ${isLoading ? 'animate-pulse' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-somba-text-light font-medium">Produits en ligne</p>
                  <p className="text-3xl font-bold text-somba-primary mt-1 transition-all duration-500 ease-out">{sellerProducts.filter(p => p.inStock !== false).length}</p>
                  <div className="flex items-center mt-2">
                    <div className="flex items-center text-green-600 text-sm">
                      <Package className="h-4 w-4 mr-1" />
                      <span className="font-semibold">{sellerProducts.length} total</span>
                    </div>
                  </div>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center transition-transform duration-300 hover:scale-110">
                  <Package className="h-7 w-7 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500 ${isLoading ? 'animate-pulse' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-somba-text-light font-medium">Solde du portefeuille</p>
                  <p className="text-3xl font-bold text-somba-primary mt-1 transition-all duration-500 ease-out">{(() => {
                    if (sellerProfile?.walletBalance === undefined || sellerProfile?.walletBalance === null) return '0 F CFA';
                    const balance = typeof sellerProfile.walletBalance === 'string' ? parseFloat(sellerProfile.walletBalance) : sellerProfile.walletBalance;
                    if (isNaN(balance)) return '0 F CFA';
                    return balance.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' });
                  })()}</p>
                  <div className="flex items-center mt-2">
                    <div className="flex items-center text-orange-600 text-sm">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span className="font-semibold">Disponible</span>
                    </div>
                  </div>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center transition-transform duration-300 hover:scale-110">
                  <TrendingUp className="h-7 w-7 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-somba-primary">Produits les plus vendus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.topProducts.slice(0, 5).map((product, index) => (
                <div key={product.id || index} className="flex items-center justify-between p-3 border border-somba-primary/10 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-somba-accent text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-somba-primary">{product.name}</p>
                      <p className="text-sm text-somba-text-light">{product.stats?.totalSold || 0} ventes</p>
                    </div>
                  </div>
                  <p className="font-semibold text-somba-primary">{product.price}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-somba-primary">Évolution du mois</CardTitle>
            <p className="text-sm text-somba-text-light">Chiffre d'affaires journalier</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  stroke="#666"
                  fontSize={12}
                  tickFormatter={(value) => {
                    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul'];
                    return months[parseInt(value.split(' ')[0].replace('Jan', '0').replace('Fév', '1').replace('Mar', '2').replace('Avr', '3').replace('Mai', '4').replace('Jun', '5').replace('Jul', '6'))];
                  }}
                />
                <YAxis
                  stroke="#666"
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(value) => [`${value.toLocaleString()} F CFA`, 'Chiffre d\'affaires']}
                  labelFormatter={(label) => `Mois: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#FF6600"
                  strokeWidth={3}
                  dot={{ fill: '#FF6600', r: 5 }}
                  activeDot={{ r: 7, stroke: '#FF6600', strokeWidth: 2, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-somba-accent rounded-full"></div>
                <span className="text-somba-text-light">Évolution mensuelle</span>
              </div>
              <div className="text-somba-primary font-semibold">
                +{(((revenueData[revenueData.length - 1].value - revenueData[0].value) / revenueData[0].value) * 100).toFixed(1)}% ce mois
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    if (selectedStoreForManagement) {
      return (
        <StoreManagement 
          store={selectedStoreForManagement}
          onBack={() => {
            setSelectedStoreForManagement(null);
            setIsEditingStore(false);
          }}
          onSave={(updatedStore) => {
            updateStore(updatedStore.id, updatedStore);
            setSelectedStoreForManagement(null);
            setIsEditingStore(false);
          }}
        />
      );
    }

    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'orders':
        return renderOrders();
      case 'stores':
        return renderStores();
      case 'products':
        return renderProducts();
      case 'campaigns':
        return <CampaignManagement />;
      case 'analytics':
        return renderAnalytics();
      case 'live':
        return renderLive();
      case 'clients':
        return <ClientManagement />;
      case 'bank-settings':
        return <BankAccountSettings />;
      case 'withdrawals':
        return <WithdrawalManagement />;
      case 'settings':
        return <SellerSettings />;
      default:
        return renderOverview();
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-somba-light">
        {renderSidebar()}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}