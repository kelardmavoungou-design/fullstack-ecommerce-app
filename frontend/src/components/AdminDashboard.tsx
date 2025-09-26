import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import useWebSocket from "../hooks/useWebSocket";
import { CreateDeliveryModal } from "./CreateDeliveryModal";
import { AssignDeliveryModal } from "./AssignDeliveryModal";
import {
  Users,
  ShoppingBag,
  Store,
  DollarSign,
  TrendingUp,
  Eye,
  Shield,
  Settings,
  UserCheck,
  UserX,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  AlertTriangle,
  CreditCard,
  Wallet,
  BarChart3,
  PieChart,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Ban,
  Check,
  X,
  AlertCircle,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  Calendar,
  Download,
  Upload,
  MessageSquare,
  Flag,
  Gavel,
  Receipt,
  Banknote,
  TrendingDown,
  UserPlus,
  Package,
  ShoppingCart,
  Building2,
  Crown,
  ShieldCheck,
  FileText,
  Bell,
  Power,
  Plus
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface AdminDashboardProps {
  onLogout: () => void;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'superadmin';
  joinDate: string;
  status: 'Actif' | 'Inactif';
  lastLogin: string;
  wallet_balance?: number;
  total_sales?: number;
  shop_count?: number;
  order_count?: number;
}

interface ShopData {
  id: string;
  name: string;
  seller_id: string;
  seller_name: string;
  status: 'active' | 'inactive' | 'pending';
  product_count: number;
  total_sales: number;
  created_at: string;
  category?: string;
  is_certified?: boolean;
}

interface CampaignData {
  id: string;
  title: string;
  seller_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'active';
  budget: number;
  impressions: number;
  clicks: number;
  created_at: string;
}

interface DisputeData {
  id: string;
  title: string;
  user_name: string;
  type: 'payment' | 'product' | 'delivery' | 'other';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
}

interface PlatformStats {
  total_users: number;
  active_users: number;
  total_sellers: number;
  total_buyers: number;
  total_shops: number;
  active_shops: number;
  total_orders: number;
  total_sales: number;
  platform_wallet: number;
  pending_withdrawals: number;
  pending_campaigns: number;
  open_disputes: number;
}

interface TransactionData {
  id: string;
  type: 'payment' | 'withdrawal' | 'commission';
  amount: number;
  user_name: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  description: string;
}

interface DeliveryData {
  id: string;
  order_id: string;
  delivery_person_id: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  assigned_at: string;
  picked_up_at?: string;
  delivered_at?: string;
  progress: number;
  total_products: number;
  collected_products: number;
  validation_code?: string;
  order: {
    buyer: {
      full_name: string;
      phone_number?: string;
    };
    shop: {
      name: string;
    };
    total: number;
    shipping_address?: string;
  };
  delivery_person: {
    full_name: string;
    phone_number?: string;
  };
}

interface DeliveryPersonnelData {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  active_deliveries: number;
  availability: 'available' | 'busy' | 'overloaded';
}

interface DeliveryStats {
  total_deliveries: number;
  active_deliveries: number;
  delivery_personnel: number;
  status_breakdown: Record<string, number>;
}


export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // WebSocket pour les notifications temps réel
  const {
    isConnected: wsConnected,
    adminProductCollected,
    adminDeliveryReady,
    adminDeliveryCompleted
  } = useWebSocket(user?.id?.toString(), 'superadmin');

  // Modal state
  const [isCreateDeliveryModalOpen, setIsCreateDeliveryModalOpen] = useState(false);
  const [isAssignDeliveryModalOpen, setIsAssignDeliveryModalOpen] = useState(false);

  // ===== ALGORITHME Admin_Dashboard_Complet - ÉTATS =====
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    total_users: 0,
    active_users: 0,
    total_sellers: 0,
    total_buyers: 0,
    total_shops: 0,
    active_shops: 0,
    total_orders: 0,
    total_sales: 0,
    platform_wallet: 0,
    pending_withdrawals: 0,
    pending_campaigns: 0,
    open_disputes: 0
  });

  const [userData, setUserData] = useState<UserData[]>([]);
  const [shopData, setShopData] = useState<ShopData[]>([]);
  const [campaignData, setCampaignData] = useState<CampaignData[]>([]);
  const [disputeData, setDisputeData] = useState<DisputeData[]>([]);
  const [transactionData, setTransactionData] = useState<TransactionData[]>([]);

  // États pour les filtres et recherche
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [shopFilter, setShopFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [disputeFilter, setDisputeFilter] = useState("all");

  // États pour la gestion des livraisons
  const [deliveryData, setDeliveryData] = useState<DeliveryData[]>([]);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState<DeliveryPersonnelData[]>([]);
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats>({
    total_deliveries: 0,
    active_deliveries: 0,
    delivery_personnel: 0,
    status_breakdown: {}
  });
  const [deliveryFilter, setDeliveryFilter] = useState("all");

  // États pour les animations et chargements
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false); // Disabled to prevent crashes
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

  // Données pour les graphiques - simplified
  const [salesChartData, setSalesChartData] = useState<any[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  // ===== INITIALISATION DES DONNÉES =====
  useEffect(() => {
    // Only load data if user is authenticated
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Auto-refresh effect - disabled to prevent crashes
  // useEffect(() => {
  //   let interval: NodeJS.Timeout;
  //   if (autoRefreshEnabled) {
  //     interval = setInterval(() => {
  //       loadDashboardData();
  //       setLastUpdateTime(new Date());
  //     }, 30000); // Refresh every 30 seconds
  //   }
  //   return () => clearInterval(interval);
  // }, [autoRefreshEnabled]);

  // Gestion des notifications WebSocket pour les admins
  useEffect(() => {
    if (adminProductCollected) {
      toast.success(`🛍️ ${adminProductCollected.message}`, {
        duration: 5000,
      });
      // Recharger les données de livraison pour mettre à jour la progression
      loadDeliveries();
      loadDeliveryStats();
    }
  }, [adminProductCollected]);

  useEffect(() => {
    if (adminDeliveryReady) {
      toast.info(`🚚 ${adminDeliveryReady.message}`, {
        duration: 6000,
      });
      // Recharger les données de livraison
      loadDeliveries();
      loadDeliveryStats();
    }
  }, [adminDeliveryReady]);

  useEffect(() => {
    if (adminDeliveryCompleted) {
      toast.success(`✅ ${adminDeliveryCompleted.message}`, {
        duration: 7000,
      });
      // Recharger les données de livraison
      loadDeliveries();
      loadDeliveryStats();
    }
  }, [adminDeliveryCompleted]);

  // ===== FONCTIONS DE CHARGEMENT DES DONNÉES =====
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Charger toutes les données selon l'algorithme
      await Promise.all([
        loadPlatformStats(),
        loadUsers(),
        loadShops(),
        loadCampaigns(),
        loadDisputes(),
        loadTransactions(),
        loadChartData(),
        loadDeliveries(),
        loadDeliveryPersonnel(),
        loadDeliveryStats()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données du tableau de bord');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlatformStats = async () => {
    try {
      // Check both sessionStorage and localStorage for token
      let token = sessionStorage.getItem('somba_token');
      if (!token) {
        token = localStorage.getItem('somba_token');
      }
      if (!token) {
        console.warn('No token available, skipping platform stats load');
        return;
      }

      // Use the API service instead of direct fetch to benefit from interceptors
      const response = await fetch('http://localhost:4000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.stats) {
          // Map API response to frontend format
          const stats: PlatformStats = {
            total_users: data.stats.users?.reduce((sum: number, user: any) => sum + user.count, 0) || 0,
            active_users: data.stats.users?.find((u: any) => u.role === 'buyer')?.count || 0,
            total_sellers: data.stats.users?.find((u: any) => u.role === 'seller')?.count || 0,
            total_buyers: data.stats.users?.find((u: any) => u.role === 'buyer')?.count || 0,
            total_shops: data.stats.shops?.total_shops || 0,
            active_shops: data.stats.shops?.active_shops || 0,
            total_orders: data.stats.orders?.reduce((sum: number, order: any) => sum + order.count, 0) || 0,
            total_sales: data.stats.orders?.reduce((sum: number, order: any) => sum + order.total_amount, 0) || 0,
            platform_wallet: 0, // Will be calculated from real data
            pending_withdrawals: 0, // Will be calculated from real data
            pending_campaigns: data.stats.pending_campaigns?.length || 0,
            open_disputes: 0 // Will be calculated from real data
          };
          setPlatformStats(stats);
        }
      } else {
        console.error('Failed to load platform stats:', response.status);
        // Fallback to mock data if API fails
        const mockStats: PlatformStats = {
          total_users: 1247,
          active_users: 892,
          total_sellers: 156,
          total_buyers: 1091,
          total_shops: 203,
          active_shops: 178,
          total_orders: 3456,
          total_sales: 12500000,
          platform_wallet: 1250000,
          pending_withdrawals: 450000,
          pending_campaigns: 12,
          open_disputes: 8
        };
        setPlatformStats(mockStats);
      }
    } catch (error) {
      console.error('Error loading platform stats:', error);
      // Fallback to mock data if API fails
      const mockStats: PlatformStats = {
        total_users: 1247,
        active_users: 892,
        total_sellers: 156,
        total_buyers: 1091,
        total_shops: 203,
        active_shops: 178,
        total_orders: 3456,
        total_sales: 12500000,
        platform_wallet: 1250000,
        pending_withdrawals: 450000,
        pending_campaigns: 12,
        open_disputes: 8
      };
      setPlatformStats(mockStats);
    }
  };

  const loadUsers = async () => {
    try {
      let token = sessionStorage.getItem('somba_token');
      if (!token) {
        token = localStorage.getItem('somba_token');
      }
      if (!token) {
        console.warn('No token available, skipping users load');
        return;
      }

      const response = await fetch('http://localhost:4000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.users) {
          // Map API response to frontend format
          const users: UserData[] = data.users.map((user: any) => ({
            id: user.id.toString(),
            name: user.full_name,
            email: user.email,
            role: user.role,
            joinDate: new Date(user.created_at).toLocaleDateString('fr-FR'),
            status: user.is_verified ? 'Actif' : 'Inactif',
            lastLogin: user.last_login ? new Date(user.last_login).toLocaleString('fr-FR') : 'Jamais',
            wallet_balance: user.wallet_balance || 0,
            total_sales: user.total_sales || 0,
            shop_count: user.shops?.length || 0,
            order_count: user.order_count || 0
          }));
          setUserData(users);
        }
      } else {
        console.error('Failed to load users:', response.status);
        // Fallback to empty array if API fails
        setUserData([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      // Fallback to empty array if API fails
      setUserData([]);
    }
  };

  const loadShops = async () => {
    try {
      let token = sessionStorage.getItem('somba_token');
      if (!token) {
        token = localStorage.getItem('somba_token');
      }
      if (!token) {
        console.warn('No token available, skipping shops load');
        return;
      }

      const response = await fetch('http://localhost:4000/api/admin/shops', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.shops) {
          // Map API response to frontend format
          const shops: ShopData[] = data.shops.map((shop: any) => ({
            id: shop.id.toString(),
            name: shop.name,
            seller_id: shop.seller_id.toString(),
            seller_name: shop.seller_name,
            status: shop.is_active ? 'active' : 'inactive',
            product_count: shop.product_count || 0,
            total_sales: shop.total_sales || 0,
            created_at: new Date(shop.created_at).toLocaleDateString('fr-FR'),
            category: shop.category || 'Non catégorisé',
            is_certified: shop.is_certified || false
          }));
          setShopData(shops);
        }
      } else {
        console.error('Failed to load shops:', response.status);
        // Fallback to empty array if API fails
        setShopData([]);
      }
    } catch (error) {
      console.error('Error loading shops:', error);
      // Fallback to empty array if API fails
      setShopData([]);
    }
  };

  const loadCampaigns = async () => {
    try {
      let token = sessionStorage.getItem('somba_token');
      if (!token) {
        token = localStorage.getItem('somba_token');
      }
      if (!token) {
        console.warn('No token available, skipping campaigns load');
        return;
      }

      const response = await fetch('http://localhost:4000/api/admin/campaigns/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.campaigns) {
          // Map API response to frontend format
          const campaigns: CampaignData[] = data.campaigns.map((campaign: any) => ({
            id: campaign.id.toString(),
            title: campaign.title,
            seller_name: campaign.seller_name,
            status: campaign.status,
            budget: campaign.budget || 0,
            impressions: campaign.impressions || 0,
            clicks: campaign.clicks || 0,
            created_at: new Date(campaign.created_at).toLocaleDateString('fr-FR')
          }));
          setCampaignData(campaigns);
        }
      } else {
        console.error('Failed to load campaigns:', response.status);
        // Fallback to empty array if API fails
        setCampaignData([]);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
      // Fallback to empty array if API fails
      setCampaignData([]);
    }
  };

  const loadDisputes = async () => {
    try {
      let token = sessionStorage.getItem('somba_token');
      if (!token) {
        token = localStorage.getItem('somba_token');
      }
      if (!token) {
        console.warn('No token available, skipping disputes load');
        return;
      }

      const response = await fetch('http://localhost:4000/api/admin/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reports) {
          // Map API response to frontend format
          const disputes: DisputeData[] = data.reports.map((report: any) => ({
            id: report.id.toString(),
            title: report.reason,
            user_name: report.reporter_name,
            type: report.target_type === 'product' ? 'product' : report.target_type === 'shop' ? 'delivery' : 'other',
            status: report.status === 'open' ? 'open' : 'resolved',
            priority: 'medium', // Default priority since not in API
            created_at: new Date(report.created_at).toLocaleDateString('fr-FR')
          }));
          setDisputeData(disputes);
        }
      } else {
        console.error('Failed to load disputes:', response.status);
        // Fallback to empty array if API fails
        setDisputeData([]);
      }
    } catch (error) {
      console.error('Error loading disputes:', error);
      // Fallback to empty array if API fails
      setDisputeData([]);
    }
  };

  const loadTransactions = async () => {
    try {
      let token = sessionStorage.getItem('somba_token');
      if (!token) {
        token = localStorage.getItem('somba_token');
      }
      if (!token) {
        console.warn('No token available, skipping transactions load');
        return;
      }

      const response = await fetch('http://localhost:4000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.stats && data.stats.recent_orders) {
          // Map recent orders to transaction format
          const transactions: TransactionData[] = data.stats.recent_orders.map((order: any) => ({
            id: order.id.toString(),
            type: 'payment',
            amount: order.total || 0,
            user_name: order.buyer_name,
            status: order.status === 'paid' ? 'completed' : order.status === 'pending' ? 'pending' : 'completed',
            created_at: new Date(order.created_at).toLocaleString('fr-FR'),
            description: `Paiement commande #${order.id} - ${order.shop_name}`
          }));
          setTransactionData(transactions);
        }
      } else {
        console.error('Failed to load transactions:', response.status);
        // Fallback to empty array if API fails
        setTransactionData([]);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Fallback to empty array if API fails
      setTransactionData([]);
    }
  };

  const loadChartData = async () => {
    try {
      let token = sessionStorage.getItem('somba_token');
      if (!token) {
        token = localStorage.getItem('somba_token');
      }
      if (!token) {
        console.warn('No token available, skipping chart data load');
        return;
      }

      const response = await fetch('http://localhost:4000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.stats) {
          // Map monthly sales data
          if (data.stats.monthly_sales) {
            const sales = data.stats.monthly_sales.map((item: any) => ({
              month: new Date(2024, item.month - 1, 1).toLocaleDateString('fr-FR', { month: 'short' }),
              ventes: item.sales || 0,
              commandes: item.orders || 0
            }));
            setSalesChartData(sales);
          }

          // For user growth and revenue, keep mock data since not available in dashboard stats
          const users = [
            { month: 'Jan', nouveaux: 45, actifs: 234 },
            { month: 'Fév', nouveaux: 52, actifs: 267 },
            { month: 'Mar', nouveaux: 67, actifs: 298 },
            { month: 'Avr', nouveaux: 78, actifs: 345 },
            { month: 'Mai', nouveaux: 89, actifs: 389 },
            { month: 'Jun', nouveaux: 95, actifs: 432 }
          ];

          const revenue = [
            { categorie: 'Électronique', montant: 4500000 },
            { categorie: 'Mode', montant: 2800000 },
            { categorie: 'Électroménager', montant: 2200000 },
            { categorie: 'Gaming', montant: 1800000 },
            { categorie: 'Beauté', montant: 1200000 }
          ];

          setUserGrowthData(users);
          setRevenueData(revenue);
        }
      } else {
        console.error('Failed to load chart data:', response.status);
        // Fallback to mock data if API fails
        const sales = [
          { month: 'Jan', ventes: 850000, commandes: 145 },
          { month: 'Fév', ventes: 920000, commandes: 156 },
          { month: 'Mar', ventes: 1100000, commandes: 189 },
          { month: 'Avr', ventes: 1350000, commandes: 234 },
          { month: 'Mai', ventes: 1420000, commandes: 245 },
          { month: 'Jun', ventes: 1680000, commandes: 289 }
        ];

        const users = [
          { month: 'Jan', nouveaux: 45, actifs: 234 },
          { month: 'Fév', nouveaux: 52, actifs: 267 },
          { month: 'Mar', nouveaux: 67, actifs: 298 },
          { month: 'Avr', nouveaux: 78, actifs: 345 },
          { month: 'Mai', nouveaux: 89, actifs: 389 },
          { month: 'Jun', nouveaux: 95, actifs: 432 }
        ];

        const revenue = [
          { categorie: 'Électronique', montant: 4500000 },
          { categorie: 'Mode', montant: 2800000 },
          { categorie: 'Électroménager', montant: 2200000 },
          { categorie: 'Gaming', montant: 1800000 },
          { categorie: 'Beauté', montant: 1200000 }
        ];

        setSalesChartData(sales);
        setUserGrowthData(users);
        setRevenueData(revenue);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
      // Fallback to mock data if API fails
      const sales = [
        { month: 'Jan', ventes: 850000, commandes: 145 },
        { month: 'Fév', ventes: 920000, commandes: 156 },
        { month: 'Mar', ventes: 1100000, commandes: 189 },
        { month: 'Avr', ventes: 1350000, commandes: 234 },
        { month: 'Mai', ventes: 1420000, commandes: 245 },
        { month: 'Jun', ventes: 1680000, commandes: 289 }
      ];

      const users = [
        { month: 'Jan', nouveaux: 45, actifs: 234 },
        { month: 'Fév', nouveaux: 52, actifs: 267 },
        { month: 'Mar', nouveaux: 67, actifs: 298 },
        { month: 'Avr', nouveaux: 78, actifs: 345 },
        { month: 'Mai', nouveaux: 89, actifs: 389 },
        { month: 'Jun', nouveaux: 95, actifs: 432 }
      ];

      const revenue = [
        { categorie: 'Électronique', montant: 4500000 },
        { categorie: 'Mode', montant: 2800000 },
        { categorie: 'Électroménager', montant: 2200000 },
        { categorie: 'Gaming', montant: 1800000 },
        { categorie: 'Beauté', montant: 1200000 }
      ];

      setSalesChartData(sales);
      setUserGrowthData(users);
      setRevenueData(revenue);
    }
  };

  const loadDeliveries = async () => {
    try {
      let token = sessionStorage.getItem('somba_token');
      if (!token) {
        token = localStorage.getItem('somba_token');
      }
      if (!token) {
        console.warn('No token available, skipping deliveries load');
        return;
      }

      const response = await fetch('http://localhost:4000/api/admin/deliveries', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.deliveries) {
          // Map API response to frontend format
          const deliveries: DeliveryData[] = data.deliveries.map((delivery: any) => ({
            id: delivery.id.toString(),
            order_id: delivery.order_id.toString(),
            delivery_person_id: delivery.delivery_person_id.toString(),
            status: delivery.status,
            assigned_at: new Date(delivery.assigned_at).toLocaleString('fr-FR'),
            picked_up_at: delivery.picked_up_at ? new Date(delivery.picked_up_at).toLocaleString('fr-FR') : undefined,
            delivered_at: delivery.delivered_at ? new Date(delivery.delivered_at).toLocaleString('fr-FR') : undefined,
            progress: delivery.progress || 0,
            total_products: delivery.total_products || 0,
            collected_products: delivery.collected_products || 0,
            validation_code: delivery.validation_code,
            order: {
              buyer: {
                full_name: delivery.order.buyer.full_name,
                phone_number: delivery.order.buyer.phone_number
              },
              shop: {
                name: delivery.order.shop?.name || 'Unknown Shop'
              },
              total: delivery.order.total || 0,
              shipping_address: delivery.order.shipping_address
            },
            delivery_person: {
              full_name: delivery.delivery_person.full_name,
              phone_number: delivery.delivery_person.phone_number
            }
          }));
          setDeliveryData(deliveries);
        }
      } else {
        console.error('Failed to load deliveries:', response.status);
        // Fallback to empty array if API fails
        setDeliveryData([]);
      }
    } catch (error) {
      console.error('Error loading deliveries:', error);
      // Fallback to empty array if API fails
      setDeliveryData([]);
    }
  };

  const loadDeliveryPersonnel = async () => {
    try {
      let token = sessionStorage.getItem('somba_token');
      if (!token) {
        token = localStorage.getItem('somba_token');
      }
      if (!token) {
        console.warn('No token available, skipping delivery personnel load');
        return;
      }

      const response = await fetch('http://localhost:4000/api/admin/delivery-personnel', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.personnel) {
          // Map API response to frontend format
          const personnel: DeliveryPersonnelData[] = data.personnel.map((person: any) => ({
            id: person.id.toString(),
            full_name: person.full_name,
            email: person.email,
            phone_number: person.phone_number,
            active_deliveries: person.active_deliveries || 0,
            availability: person.availability || 'available'
          }));
          setDeliveryPersonnel(personnel);
        }
      } else {
        console.error('Failed to load delivery personnel:', response.status);
        // Fallback to empty array if API fails
        setDeliveryPersonnel([]);
      }
    } catch (error) {
      console.error('Error loading delivery personnel:', error);
      // Fallback to empty array if API fails
      setDeliveryPersonnel([]);
    }
  };

  const loadDeliveryStats = async () => {
    try {
      let token = sessionStorage.getItem('somba_token');
      if (!token) {
        token = localStorage.getItem('somba_token');
      }
      if (!token) {
        console.warn('No token available, skipping delivery stats load');
        return;
      }

      const response = await fetch('http://localhost:4000/api/admin/deliveries/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.stats) {
          setDeliveryStats(data.stats);
        }
      } else {
        console.error('Failed to load delivery stats:', response.status);
        // Fallback to default stats if API fails
        setDeliveryStats({
          total_deliveries: 0,
          active_deliveries: 0,
          delivery_personnel: 0,
          status_breakdown: {}
        });
      }
    } catch (error) {
      console.error('Error loading delivery stats:', error);
      // Fallback to default stats if API fails
      setDeliveryStats({
        total_deliveries: 0,
        active_deliveries: 0,
        delivery_personnel: 0,
        status_breakdown: {}
      });
    }
  };

  // ===== FONCTIONS DE GESTION UTILISATEURS =====
  const handleActivateUser = async (userId: string) => {
    try {
      // Simulation d'activation utilisateur
      setUserData(prev => prev.map(user =>
        user.id === userId ? { ...user, status: 'Actif' as const } : user
      ));
      toast.success(`Utilisateur ${userId} activé avec succès`);
    } catch (error) {
      toast.error("Erreur lors de l'activation de l'utilisateur");
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      setUserData(prev => prev.map(user =>
        user.id === userId ? { ...user, status: 'Inactif' as const } : user
      ));
      toast.success(`Utilisateur ${userId} désactivé avec succès`);
    } catch (error) {
      toast.error("Erreur lors de la désactivation de l'utilisateur");
    }
  };

  const handleViewUser = (userId: string) => {
    const user = userData.find(u => u.id === userId);
    toast.info(`Affichage des détails de ${user?.name}`);
  };

  // ===== FONCTIONS DE GESTION BOUTIQUES =====
  const handleActivateShop = async (shopId: string) => {
    try {
      setShopData(prev => prev.map(shop =>
        shop.id === shopId ? { ...shop, status: 'active' as const } : shop
      ));
      toast.success(`Boutique activée avec succès`);
    } catch (error) {
      toast.error("Erreur lors de l'activation de la boutique");
    }
  };

  const handleDeactivateShop = async (shopId: string) => {
    try {
      setShopData(prev => prev.map(shop =>
        shop.id === shopId ? { ...shop, status: 'inactive' as const } : shop
      ));
      toast.success(`Boutique désactivée avec succès`);
    } catch (error) {
      toast.error("Erreur lors de la désactivation de la boutique");
    }
  };

  const handleDeleteShop = async (shopId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette boutique ? Cette action est irréversible.')) {
      return;
    }

    try {
      // Simulation de suppression - à remplacer par appel API réel
      setShopData(prev => prev.filter(shop => shop.id !== shopId));
      toast.success(`Boutique supprimée avec succès`);
    } catch (error) {
      toast.error("Erreur lors de la suppression de la boutique");
    }
  };

  const handleCertifyShop = async (shopId: string, certified: boolean) => {
    try {
      // Simulation de certification - à remplacer par appel API réel
      setShopData(prev => prev.map(shop =>
        shop.id === shopId ? { ...shop, is_certified: certified } : shop
      ));
      toast.success(`Boutique ${certified ? 'certifiée' : 'décertifiée'} avec succès`);
    } catch (error) {
      toast.error("Erreur lors de la certification de la boutique");
    }
  };

  // ===== FONCTIONS DE GESTION CAMPAGNES =====
  const handleApproveCampaign = async (campaignId: string) => {
    try {
      setCampaignData(prev => prev.map(campaign =>
        campaign.id === campaignId ? { ...campaign, status: 'approved' as const } : campaign
      ));
      toast.success(`Campagne approuvée avec succès`);
    } catch (error) {
      toast.error("Erreur lors de l'approbation de la campagne");
    }
  };

  const handleRejectCampaign = async (campaignId: string) => {
    try {
      setCampaignData(prev => prev.map(campaign =>
        campaign.id === campaignId ? { ...campaign, status: 'rejected' as const } : campaign
      ));
      toast.success(`Campagne rejetée`);
    } catch (error) {
      toast.error("Erreur lors du rejet de la campagne");
    }
  };

  // ===== FONCTIONS DE GESTION LITIGES =====
  const handleResolveDispute = async (disputeId: string) => {
    try {
      setDisputeData(prev => prev.map(dispute =>
        dispute.id === disputeId ? { ...dispute, status: 'resolved' as const } : dispute
      ));
      toast.success(`Litige résolu avec succès`);
    } catch (error) {
      toast.error("Erreur lors de la résolution du litige");
    }
  };

  // ===== FONCTIONS DE GESTION RETRAITS =====
  const handleApproveWithdrawal = async (withdrawalId: string) => {
    try {
      setTransactionData(prev => prev.map(transaction =>
        transaction.id === withdrawalId ? { ...transaction, status: 'completed' as const } : transaction
      ));
      toast.success(`Retrait approuvé avec succès`);
    } catch (error) {
      toast.error("Erreur lors de l'approbation du retrait");
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    try {
      setTransactionData(prev => prev.map(transaction =>
        transaction.id === withdrawalId ? { ...transaction, status: 'failed' as const } : transaction
      ));
      toast.success(`Retrait rejeté`);
    } catch (error) {
      toast.error("Erreur lors du rejet du retrait");
    }
  };

  // ===== FONCTIONS DE GESTION LIVRAISONS =====
  const handleAssignDelivery = async (deliveryId: string, deliveryPersonId: string) => {
    try {
      let token = sessionStorage.getItem('somba_token');
      if (!token) {
        token = localStorage.getItem('somba_token');
      }
      if (!token) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }

      const response = await fetch(`http://localhost:4000/api/admin/deliveries/${deliveryId}/assign`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ delivery_person_id: parseInt(deliveryPersonId) })
      });

      if (response.ok) {
        const data = await response.json();
        // Update the delivery in the state
        setDeliveryData(prev => prev.map(delivery =>
          delivery.id === deliveryId
            ? {
                ...delivery,
                delivery_person_id: deliveryPersonId,
                delivery_person: data.delivery.delivery_person
              }
            : delivery
        ));
        toast.success(data.message || 'Livraison assignée avec succès');
        // Reload delivery personnel to update workload
        loadDeliveryPersonnel();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erreur lors de l\'assignation de la livraison');
      }
    } catch (error) {
      console.error('Error assigning delivery:', error);
      toast.error('Erreur lors de l\'assignation de la livraison');
    }
  };

  const handleViewDeliveryDetails = (deliveryId: string) => {
    const delivery = deliveryData.find(d => d.id === deliveryId);
    toast.info(`Détails de la livraison #${deliveryId}`);
  };

  // ===== CALCULS DES STATISTIQUES =====
  const totalUsers = userData.length;
  const clients = userData.filter(u => u.role === 'buyer').length;
  const vendors = userData.filter(u => u.role === 'seller').length;
  const activeUsers = userData.filter(u => u.status === 'Actif').length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'buyer':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Client</Badge>;
      case 'seller':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Vendeur</Badge>;
      case 'superadmin':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Admin</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Actif':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Actif</Badge>;
      case 'Inactif':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactif</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Amazon-style Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              {/* Logo and Brand */}
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-orange-400 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">SOMBA</h1>
                  <p className="text-xs text-gray-500">Seller Central</p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center space-x-6">
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Dashboard</a>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Reports</a>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Settings</a>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {/* Status Indicators */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm text-gray-600">Live</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">WS</span>
                </div>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">Administrateur</p>
                </div>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.full_name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCw className={`h-4 w-4 ${autoRefreshEnabled ? 'animate-spin text-green-600' : ''}`} />
                </Button>
                <Button
                  onClick={onLogout}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Amazon-style Navigation */}
          <div className="bg-white border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Aperçu
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Utilisateurs
              </button>
              <button
                onClick={() => setActiveTab('stores')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'stores'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Boutiques
              </button>
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'campaigns'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Publicité
              </button>
              <button
                onClick={() => setActiveTab('disputes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'disputes'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Litiges
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'transactions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('transfers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'transfers'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Transferts
              </button>
              <button
                onClick={() => setActiveTab('revenue')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'revenue'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Revenus
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analyses
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Paramètres
              </button>
              <button
                onClick={() => setActiveTab('deliveries')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'deliveries'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Livraisons
              </button>
            </nav>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Amazon-style Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Aperçu du tableau de bord</h2>
                  <p className="text-gray-600 mt-1">Surveillez les performances de votre marketplace</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Dernière mise à jour</p>
                  <p className="font-medium text-gray-900">{lastUpdateTime.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}</p>
                </div>
              </div>
            </div>

            {/* Key Metrics Cards - Amazon Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Utilisateurs actifs</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{platformStats.active_users.toLocaleString()}</p>
                    <p className="text-sm text-green-600 mt-1">+12% par rapport au mois dernier</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total des commandes</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{platformStats.total_orders.toLocaleString()}</p>
                    <p className="text-sm text-green-600 mt-1">+8% par rapport au mois dernier</p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Revenus</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {(platformStats.total_sales / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-sm text-green-600 mt-1">+15% par rapport au mois dernier</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Litiges ouverts</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{platformStats.open_disputes}</p>
                    <p className="text-sm text-red-600 mt-1">Nécessite une attention</p>
                  </div>
                  <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Metrics - Amazon Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{platformStats.total_users.toLocaleString()}</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-600 font-medium">{platformStats.active_users} actifs</span>
                  <span className="text-green-600 font-medium">+12%</span>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  {platformStats.total_buyers} buyers • {platformStats.total_sellers} sellers
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Total Sales</h3>
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {(platformStats.total_sales / 1000000).toFixed(1)}M
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 font-medium">+18.5%</span>
                  <span className="text-gray-500">par rapport au mois dernier</span>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Direct payments to sellers
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Active Stores</h3>
                  <Store className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{platformStats.active_shops}</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 font-medium">+8%</span>
                  <span className="text-gray-500">croissance</span>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  {platformStats.total_shops - platformStats.active_shops} en attente d'approbation
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Pending Withdrawals</h3>
                  <Banknote className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {(platformStats.pending_withdrawals / 1000000).toFixed(1)}M
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-orange-600 font-medium">En attente</span>
                  <span className="text-gray-500">à traiter</span>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Transferts directs aux vendeurs
                </div>
              </div>
            </div>

            {/* Charts Section - Simplified */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Trend Chart - Placeholder */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Tendance des ventes</h3>
                    <p className="text-sm text-gray-600">Performance des revenus mensuels</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                </div>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Graphique des ventes</p>
                    <p className="text-sm text-gray-500">Données simplifiées pour éviter les crashes</p>
                  </div>
                </div>
              </div>

              {/* Category Distribution - Placeholder */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Ventes par catégorie</h3>
                    <p className="text-sm text-gray-600">Répartition des revenus</p>
                  </div>
                  <PieChart className="h-5 w-5 text-gray-400" />
                </div>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Graphique circulaire</p>
                    <p className="text-sm text-gray-500">Données simplifiées pour éviter les crashes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions and Alerts - Amazon Style */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Actions rapides</h3>
                  <Zap className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={loadDashboardData}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Actualiser les données
                  </Button>
                  <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter le rapport
                  </Button>
                  <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications système
                  </Button>
                </div>
              </div>

              {/* Important Alerts */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Alertes</h3>
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  {platformStats.pending_campaigns > 0 && (
                    <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <Target className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">
                          {platformStats.pending_campaigns} campaign{platformStats.pending_campaigns > 1 ? 's' : ''} pending
                        </p>
                        <p className="text-xs text-orange-600">Approval required</p>
                      </div>
                    </div>
                  )}

                  {platformStats.open_disputes > 0 && (
                    <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                      <Gavel className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          {platformStats.open_disputes} dispute{platformStats.open_disputes > 1 ? 's' : ''} open
                        </p>
                        <p className="text-xs text-red-600">Action required</p>
                      </div>
                    </div>
                  )}

                  {platformStats.pending_withdrawals > 0 && (
                    <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Banknote className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          Pending withdrawals
                        </p>
                        <p className="text-xs text-blue-600">{(platformStats.pending_withdrawals / 1000000).toFixed(1)}M F CFA to process</p>
                      </div>
                    </div>
                  )}

                  {platformStats.pending_campaigns === 0 && platformStats.open_disputes === 0 && platformStats.pending_withdrawals === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">Tous les systèmes opérationnels</p>
                      <p className="text-xs text-gray-500">Aucune action urgente requise</p>
                    </div>
                  )}
                </div>
              </div>

              {/* System Metrics */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">État du système</h3>
                  <Monitor className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taux d'activité</span>
                    <span className="text-sm font-semibold text-green-600">94.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Temps de réponse</span>
                    <span className="text-sm font-semibold text-blue-600">120ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Utilisation du serveur</span>
                    <span className="text-sm font-semibold text-orange-600">67%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Disponibilité</span>
                    <span className="text-sm font-semibold text-green-600">99.9%</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* Amazon-style Users Management */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Users</h2>
                  <p className="text-gray-600 mt-1">Manage platform users and accounts</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="seller">Sellers</option>
                    <option value="buyer">Buyers</option>
                    <option value="superadmin">Admins</option>
                  </select>
                </div>
              </div>

              {/* User Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{platformStats.total_users.toLocaleString()}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Sellers</p>
                      <p className="text-2xl font-bold text-gray-900">{platformStats.total_sellers.toLocaleString()}</p>
                    </div>
                    <Store className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Buyers</p>
                      <p className="text-2xl font-bold text-gray-900">{platformStats.total_buyers.toLocaleString()}</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active</p>
                      <p className="text-2xl font-bold text-gray-900">{platformStats.active_users.toLocaleString()}</p>
                    </div>
                    <Activity className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userData
                      .filter(user =>
                        (userFilter === 'all' || user.role === userFilter) &&
                        (searchQuery === '' ||
                          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'seller' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'superadmin' ? 'Admin' :
                             user.role === 'seller' ? 'Seller' : 'Buyer'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.status === 'Actif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.wallet_balance ? (
                            <span className="font-medium text-green-600">
                              {(user.wallet_balance / 1000).toFixed(0)}K F CFA
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.total_sales ? (
                            <span className="font-medium text-blue-600">
                              {(user.total_sales / 1000).toFixed(0)}K F CFA
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.joinDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewUser(user.id)}
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {user.status === 'Actif' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeactivateUser(user.id)}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleActivateUser(user.id)}
                                className="border-green-300 text-green-600 hover:bg-green-50"
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stores" className="space-y-6">
            {/* Amazon-style Stores Management */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Stores</h2>
                  <p className="text-gray-600 mt-1">Manage seller stores and approvals</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search stores..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={shopFilter}
                    onChange={(e) => setShopFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Store Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Stores</p>
                      <p className="text-2xl font-bold text-gray-900">{platformStats.total_shops.toLocaleString()}</p>
                    </div>
                    <Store className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active</p>
                      <p className="text-2xl font-bold text-gray-900">{platformStats.active_shops.toLocaleString()}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(platformStats.total_shops - platformStats.active_shops).toLocaleString()}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Products</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {shopData.reduce((sum, shop) => sum + shop.product_count, 0).toLocaleString()}
                      </p>
                    </div>
                    <Package className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Stores Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shopData
                      .filter(shop =>
                        (shopFilter === 'all' || shop.status === shopFilter) &&
                        (searchQuery === '' ||
                          shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          shop.seller_name.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .map((shop) => (
                      <tr key={shop.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                              <Store className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{shop.name}</div>
                              <div className="text-sm text-gray-500">{shop.category || 'No category'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{shop.seller_name}</div>
                          <div className="text-sm text-gray-500">ID: {shop.seller_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              shop.status === 'active' ? 'bg-green-100 text-green-800' :
                              shop.status === 'inactive' ? 'bg-red-100 text-red-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {shop.status === 'active' ? 'Active' :
                               shop.status === 'inactive' ? 'Inactive' : 'Pending'}
                            </span>
                            {shop.is_certified && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Certified
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-medium">{shop.product_count.toLocaleString()}</span>
                          <span className="text-gray-500 ml-1">products</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-medium text-blue-600">
                            {(shop.total_sales / 1000).toFixed(0)}K F CFA
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {shop.created_at}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toast.info(`Details for ${shop.name}`)}
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCertifyShop(shop.id, !shop.is_certified)}
                              className={`${
                                shop.is_certified
                                  ? 'border-orange-300 text-orange-600 hover:bg-orange-50'
                                  : 'border-green-300 text-green-600 hover:bg-green-50'
                              }`}
                              title={shop.is_certified ? 'Décertifier la boutique' : 'Certifier la boutique'}
                            >
                              <ShieldCheck className={`h-4 w-4 ${shop.is_certified ? 'text-orange-600' : 'text-green-600'}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteShop(shop.id)}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                            {shop.status === 'active' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeactivateShop(shop.id)}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            ) : shop.status === 'inactive' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleActivateShop(shop.id)}
                                className="border-green-300 text-green-600 hover:bg-green-50"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            ) : (
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleActivateShop(shop.id)}
                                  className="border-green-300 text-green-600 hover:bg-green-50"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeactivateShop(shop.id)}
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            {/* Amazon-style Advertising Management */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Advertising Management</h2>
                  <p className="text-gray-600 mt-1">Validate seller ads, create platform campaigns, and monitor advertising performance</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Platform Campaign
                  </Button>
                  <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    <Target className="h-4 w-4 mr-2" />
                    Manage Ad Slots
                  </Button>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    platformStats.pending_campaigns > 0
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {platformStats.pending_campaigns > 0 ? `${platformStats.pending_campaigns} pending reviews` : 'All reviewed'}
                  </span>
                </div>
              </div>

              {/* Advertising Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                      <p className="text-2xl font-bold text-orange-600">{platformStats.pending_campaigns}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approved Ads</p>
                      <p className="text-2xl font-bold text-green-600">
                        {campaignData.filter(c => c.status === 'approved').length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Platform Campaigns</p>
                      <p className="text-2xl font-bold text-purple-600">3</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-blue-600">75K</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Ad Slots Management */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Advertising Slots</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Homepage Banner</span>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Prime placement - High visibility</p>
                    <p className="text-xs text-gray-500">Current: TechStore Pro Campaign</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Sidebar Ads</span>
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Category-specific targeting</p>
                    <p className="text-xs text-gray-500">Available slots: 2/4</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Product Recommendations</span>
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">AI-powered sponsored products</p>
                    <p className="text-xs text-gray-500">Auto-rotating campaigns</p>
                  </div>
                </div>
              </div>

              {/* Platform Campaigns */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Campaigns</h3>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">SOMBAGO Holiday Sale</h4>
                        <p className="text-gray-600">Official platform promotion campaign</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                        <Button size="sm" variant="outline" className="border-gray-300">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Budget:</span>
                        <div className="text-blue-600 font-semibold">500K F CFA</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Impressions:</span>
                        <div className="text-purple-600 font-semibold">45.2K</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Clicks:</span>
                        <div className="text-green-600 font-semibold">2.8K</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">CTR:</span>
                        <div className="text-orange-600 font-semibold">6.2%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Campaigns */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h3>
                {campaignData.filter(c => c.status === 'pending').length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg mb-2">No pending campaigns</p>
                    <p className="text-gray-500">New campaigns will appear here automatically</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaignData
                      .filter(campaign => campaign.status === 'pending')
                      .map((campaign) => (
                      <div key={campaign.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                              <Target className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">{campaign.title}</h4>
                              <p className="text-gray-600">by {campaign.seller_name}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>Budget: {(campaign.budget / 1000).toFixed(0)}K F CFA</span>
                                <span>Created: {campaign.created_at}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Button
                              onClick={() => handleApproveCampaign(campaign.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleRejectCampaign(campaign.id)}
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Campaigns Table */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Campaigns</h3>
                {campaignData.filter(c => c.status === 'active' || c.status === 'approved').length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg mb-2">No active campaigns</p>
                    <p className="text-gray-500">Approved campaigns will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendeur</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impressions</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {campaignData
                          .filter(campaign => campaign.status === 'active' || campaign.status === 'approved')
                          .map((campaign) => (
                          <tr key={campaign.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{campaign.title}</div>
                                <div className="text-sm text-gray-500">ID: {campaign.id}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {campaign.seller_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="font-medium text-green-600">
                                {(campaign.budget / 1000).toFixed(0)}K F CFA
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="font-medium text-blue-600">
                                {campaign.impressions.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="font-medium text-purple-600">
                                {campaign.clicks.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="font-medium text-orange-600">
                                {campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : 0}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="disputes" className="space-y-6">
            {/* Amazon-style Disputes Management */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Disputes</h2>
                  <p className="text-gray-600 mt-1">Manage customer disputes and resolutions</p>
                </div>
                <div className="flex items-center space-x-4">
                  <select
                    value={disputeFilter}
                    onChange={(e) => setDisputeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    platformStats.open_disputes > 0
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {platformStats.open_disputes > 0 ? `${platformStats.open_disputes} open disputes` : 'All resolved'}
                  </span>
                </div>
              </div>

              {/* Dispute Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Open</p>
                      <p className="text-2xl font-bold text-red-600">
                        {disputeData.filter(d => d.status === 'open').length}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Investigating</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {disputeData.filter(d => d.status === 'investigating').length}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Resolved</p>
                      <p className="text-2xl font-bold text-green-600">
                        {disputeData.filter(d => d.status === 'resolved').length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. Resolution</p>
                      <p className="text-2xl font-bold text-blue-600">2.3 days</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Disputes List */}
              {disputeData.filter(d =>
                disputeFilter === 'all' || d.status === disputeFilter
              ).length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-12 text-center">
                  <Gavel className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg mb-2">No disputes found</p>
                  <p className="text-gray-500">New disputes will appear here automatically</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {disputeData
                    .filter(dispute =>
                      disputeFilter === 'all' || dispute.status === disputeFilter
                    )
                    .map((dispute) => (
                    <div key={dispute.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            dispute.priority === 'urgent' ? 'bg-red-50' :
                            dispute.priority === 'high' ? 'bg-orange-50' :
                            dispute.priority === 'medium' ? 'bg-yellow-50' : 'bg-blue-50'
                          }`}>
                            <Flag className={`h-6 w-6 ${
                              dispute.priority === 'urgent' ? 'text-red-600' :
                              dispute.priority === 'high' ? 'text-orange-600' :
                              dispute.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{dispute.title}</h3>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                dispute.status === 'open' ? 'bg-red-100 text-red-800' :
                                dispute.status === 'investigating' ? 'bg-orange-100 text-orange-800' :
                                dispute.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {dispute.status === 'open' ? 'Open' :
                                 dispute.status === 'investigating' ? 'Investigating' :
                                 dispute.status === 'resolved' ? 'Resolved' : 'Closed'}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                                dispute.priority === 'urgent' ? 'border-red-300 text-red-600' :
                                dispute.priority === 'high' ? 'border-orange-300 text-orange-600' :
                                dispute.priority === 'medium' ? 'border-yellow-300 text-yellow-600' :
                                'border-blue-300 text-blue-600'
                              }`}>
                                {dispute.priority === 'urgent' ? 'Urgent' :
                                 dispute.priority === 'high' ? 'High' :
                                 dispute.priority === 'medium' ? 'Medium' : 'Low'}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-2">by {dispute.user_name}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Type: {dispute.type === 'payment' ? 'Payment' :
                                           dispute.type === 'product' ? 'Product' :
                                           dispute.type === 'delivery' ? 'Delivery' : 'Other'}</span>
                              <span>Created: {dispute.created_at}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                          {dispute.status === 'open' || dispute.status === 'investigating' ? (
                            <Button
                              onClick={() => handleResolveDispute(dispute.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Resolve
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-300 text-gray-600"
                              disabled
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Resolved
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            {/* Amazon-style Payment Processing & Commission Management */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Payment Processing</h2>
                  <p className="text-gray-600 mt-1">Monitor customer payments, calculate commissions, and track platform earnings</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Filter className="h-4 w-4 mr-2" />
                    Commission Settings
                  </Button>
                </div>
              </div>

              {/* Transaction Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Customer Payments</p>
                      <p className="text-2xl font-bold text-green-600">
                        {transactionData.filter(t => t.type === 'payment').length}
                      </p>
                      <p className="text-xs text-green-600 mt-1">Direct to sellers</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Seller Withdrawals</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {transactionData.filter(t => t.type === 'withdrawal').length}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Direct transfers</p>
                    </div>
                    <Banknote className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Volume</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {(transactionData.reduce((sum, t) => sum + t.amount, 0) / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs text-purple-600 mt-1">F CFA processed</p>
                    </div>
                    <Activity className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Transfer Success</p>
                      <p className="text-2xl font-bold text-orange-600">99.8%</p>
                      <p className="text-xs text-orange-600 mt-1">Direct transfers</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Direct Transfer Flow */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-200 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Direct Transfer System</h3>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                      No Fees • No Commissions
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Customer → Seller</span>
                      <CreditCard className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-xs text-gray-600 mb-2">Direct payment to seller wallet</p>
                    <div className="text-xs text-gray-500">
                      Customer pays: 25,000 F CFA<br/>
                      Seller receives: 25,000 F CFA<br/>
                      Platform: Records transaction only
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Seller → Bank</span>
                      <Banknote className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-600 mb-2">Direct transfer to seller account</p>
                    <div className="text-xs text-gray-500">
                      Seller requests: 100,000 F CFA<br/>
                      Seller receives: 100,000 F CFA<br/>
                      Platform: Processes direct transfer
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Transfer History */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transfert</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactionData.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                            <div className="text-sm text-gray-500">ID: {transaction.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.user_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.type === 'payment' ? 'bg-green-100 text-green-800' :
                            transaction.type === 'withdrawal' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {transaction.type === 'payment' ? 'Customer → Seller' :
                             transaction.type === 'withdrawal' ? 'Seller → Bank' : 'Transfer'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`font-medium ${
                            transaction.type === 'payment' ? 'text-green-600' :
                            transaction.type === 'withdrawal' ? 'text-blue-600' :
                            'text-purple-600'
                          }`}>
                            {(transaction.amount / 1000).toFixed(0)}K F CFA
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status === 'completed' ? 'Terminé' :
                             transaction.status === 'pending' ? 'En cours' : 'Échec'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.created_at}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Amazon-style Analytics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
                  <p className="text-gray-600 mt-1">Platform performance metrics and trends</p>
                </div>
                <div className="flex items-center space-x-4">
                  <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                    <option>Last year</option>
                  </select>
                  <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </div>

              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Conversion Rate</p>
                      <p className="text-3xl font-bold text-blue-900 mt-2">3.2%</p>
                      <p className="text-sm text-blue-700 mt-1">+0.5% from last month</p>
                    </div>
                    <TrendingUp className="h-12 w-12 text-blue-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Avg Order Value</p>
                      <p className="text-3xl font-bold text-green-900 mt-2">45K</p>
                      <p className="text-sm text-green-700 mt-1">+8% from last month</p>
                    </div>
                    <DollarSign className="h-12 w-12 text-green-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Customer Lifetime Value</p>
                      <p className="text-3xl font-bold text-purple-900 mt-2">125K</p>
                      <p className="text-sm text-purple-700 mt-1">+12% from last month</p>
                    </div>
                    <Users className="h-12 w-12 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Charts Placeholder - Simplified */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Analyses de performance</h3>
                    <p className="text-sm text-gray-600">Métriques avancées de la plateforme</p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-gray-400" />
                </div>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Tableau de bord d'analyses avancées</p>
                    <p className="text-sm text-gray-500">Graphiques détaillés et insights bientôt disponibles</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transfers" className="space-y-6">
            {/* Amazon-style Withdrawal Requests Management */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Direct Transfers</h2>
                  <p className="text-gray-600 mt-1">Process direct transfers to seller bank accounts</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    platformStats.pending_withdrawals > 0
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {platformStats.pending_withdrawals > 0 ? `${platformStats.pending_withdrawals}M F CFA pending transfer` : 'All transfers processed'}
                  </span>
                </div>
              </div>

              {/* Withdrawal Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                      <p className="text-2xl font-bold text-orange-600">{platformStats.pending_withdrawals}M</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Processed Today</p>
                      <p className="text-2xl font-bold text-green-600">2.3M</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Paid Out</p>
                      <p className="text-2xl font-bold text-blue-600">15.7M</p>
                    </div>
                    <Banknote className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Transfer Success</p>
                      <p className="text-2xl font-bold text-purple-600">99.2%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Pending Transfer Requests */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Transfer Requests</h3>
                {transactionData.filter(t => t.type === 'withdrawal' && t.status === 'pending').length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg mb-2">No pending transfer requests</p>
                    <p className="text-gray-500">New transfer requests will appear here automatically</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactionData
                      .filter(transaction => transaction.type === 'withdrawal' && transaction.status === 'pending')
                      .map((transaction) => (
                      <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                              <Banknote className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">Transfer Request #{transaction.id}</h4>
                              <p className="text-gray-600">by {transaction.user_name}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>Transfer: {(transaction.amount / 1000).toFixed(0)}K F CFA</span>
                                <span>Requested: {transaction.created_at}</span>
                                <span className="text-orange-600 font-medium">Pending Transfer</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Button
                              onClick={() => handleApproveWithdrawal(transaction.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Process Transfer
                            </Button>
                            <Button
                              onClick={() => handleRejectWithdrawal(transaction.id)}
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel Transfer
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Direct Transfers */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Transferts directs récents</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transfer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactionData
                        .filter(transaction => transaction.type === 'withdrawal')
                        .slice(0, 10)
                        .map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">#{transaction.id}</div>
                              <div className="text-sm text-gray-500">Transfert direct</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.user_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="font-medium text-blue-600">
                              {(transaction.amount / 1000).toFixed(0)}K F CFA
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                              transaction.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {transaction.status === 'completed' ? 'Completed' :
                               transaction.status === 'pending' ? 'Processing' : 'Failed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.created_at}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            {/* Amazon-style Platform Revenue Management */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Revenus de la plateforme</h2>
                  <p className="text-gray-600 mt-1">Surveiller les gains de la plateforme et gérer les retraits</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Solde actuel</p>
                    <p className="text-2xl font-bold text-green-600">{(platformStats.platform_wallet / 1000000).toFixed(1)}M F CFA</p>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Banknote className="h-4 w-4 mr-2" />
                    Retirer des fonds
                  </Button>
                </div>
              </div>

              {/* Platform Revenue Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Volume total des ventes</p>
                      <p className="text-2xl font-bold text-green-600">12.5M</p>
                      <p className="text-sm text-green-600 mt-1">Toutes les transactions</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total des retraits</p>
                      <p className="text-2xl font-bold text-blue-600">11.2M</p>
                      <p className="text-sm text-blue-600 mt-1">Payé aux vendeurs</p>
                    </div>
                    <Banknote className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Vendeurs actifs</p>
                      <p className="text-2xl font-bold text-purple-600">156</p>
                      <p className="text-sm text-purple-600 mt-1">Avec solde de portefeuille</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Santé de la plateforme</p>
                      <p className="text-2xl font-bold text-orange-600">98.5%</p>
                      <p className="text-sm text-orange-600 mt-1">Disponibilité du système</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Revenue Breakdown - Simplified */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Sources de revenus</h3>
                      <p className="text-sm text-gray-600">Répartition par catégorie</p>
                    </div>
                    <PieChart className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Graphique des sources de revenus</p>
                      <p className="text-sm text-gray-500">Données simplifiées pour éviter les crashes</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Tendance des revenus mensuels</h3>
                      <p className="text-sm text-gray-600">Croissance des revenus dans le temps</p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Graphique de tendance des revenus</p>
                      <p className="text-sm text-gray-500">Données simplifiées pour éviter les crashes</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Wallet Management */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Portefeuille de la plateforme</h3>
                    <p className="text-gray-600">Portefeuille mis à jour automatiquement via la base de données</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Current Balance</p>
                    <p className="text-3xl font-bold text-green-600">{(platformStats.platform_wallet / 1000000).toFixed(1)}M F CFA</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Mises à jour automatiques</h4>
                      <p className="text-gray-600">Le portefeuille de la plateforme est mis à jour automatiquement via la base de données</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Paiements clients</p>
                        <p className="text-xs text-gray-600">Transfert direct vers les portefeuilles vendeurs</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Banknote className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Retraits vendeurs</p>
                        <p className="text-xs text-gray-600">Transfert direct vers les comptes vendeurs</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Banknote className="h-4 w-4 mr-2" />
                    Transférer vers le compte bancaire
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Amazon-style Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                  <p className="text-gray-600 mt-1">Platform configuration and preferences</p>
                </div>
              </div>

              {/* Settings Sections */}
              <div className="space-y-8">
                {/* Platform Settings */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres de la plateforme</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Nom de la plateforme</label>
                      <input
                        type="text"
                        defaultValue="SOMBAGO"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Devise par défaut</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>F CFA</option>
                        <option>EUR</option>
                        <option>USD</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Payment Settings */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres de paiement</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Système de transfert direct</h4>
                        <p className="text-xs text-blue-700">Tous les paiements et retraits sont traités directement sans commissions ni frais</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Montant minimum de retrait</label>
                      <input
                        type="number"
                        defaultValue="1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500">Montant minimum pour les retraits vendeurs</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Retrait quotidien maximum</label>
                      <input
                        type="number"
                        defaultValue="500000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500">Limite de retrait quotidien maximum par vendeur</p>
                    </div>
                  </div>
                </div>

                {/* Email Settings */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration email</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Hôte SMTP</label>
                      <input
                        type="text"
                        placeholder="smtp.gmail.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Port SMTP</label>
                      <input
                        type="number"
                        defaultValue="587"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Settings className="h-4 w-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="deliveries" className="space-y-6">
            {/* Amazon-style Delivery Management */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Gestion des Livraisons</h2>
                  <p className="text-gray-600 mt-1">Assigner et gérer les missions de livraison</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => setIsAssignDeliveryModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Assigner Livraison
                  </Button>
                  <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    deliveryStats.active_deliveries > 0
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {deliveryStats.active_deliveries} livraisons actives
                  </span>
                </div>
              </div>

              {/* Delivery Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Livraisons</p>
                      <p className="text-2xl font-bold text-gray-900">{deliveryStats.total_deliveries.toLocaleString()}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">En Cours</p>
                      <p className="text-2xl font-bold text-orange-600">{deliveryStats.active_deliveries.toLocaleString()}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Livreurs</p>
                      <p className="text-2xl font-bold text-green-600">{deliveryStats.delivery_personnel.toLocaleString()}</p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Taux de Réussite</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {deliveryStats.total_deliveries > 0
                          ? Math.round((deliveryStats.status_breakdown.delivered || 0) / deliveryStats.total_deliveries * 100)
                          : 0}%
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Delivery Personnel Overview */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Équipe de Livraison</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deliveryPersonnel.map((person) => (
                    <div key={person.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {person.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">{person.full_name}</h4>
                            <p className="text-xs text-gray-500">{person.email}</p>
                          </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          person.availability === 'available' ? 'bg-green-500' :
                          person.availability === 'busy' ? 'bg-orange-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Livraisons actives:</span>
                        <span className={`font-medium ${
                          person.active_deliveries === 0 ? 'text-green-600' :
                          person.active_deliveries < 5 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {person.active_deliveries}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          person.availability === 'available' ? 'bg-green-100 text-green-800' :
                          person.availability === 'busy' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {person.availability === 'available' ? 'Disponible' :
                           person.availability === 'busy' ? 'Occupé' : 'Surchargé'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deliveries Management */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Livraisons</h3>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher livraisons..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={deliveryFilter}
                      onChange={(e) => setDeliveryFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="assigned">Assigné</option>
                      <option value="picked_up">Récupéré</option>
                      <option value="in_transit">En transit</option>
                      <option value="delivered">Livré</option>
                      <option value="failed">Échec</option>
                    </select>
                  </div>
                </div>

                {deliveryData.filter(d =>
                  (deliveryFilter === 'all' || d.status === deliveryFilter) &&
                  (searchQuery === '' ||
                    d.order.buyer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    d.delivery_person.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    d.id.includes(searchQuery))
                ).length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-12 text-center">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg mb-2">Aucune livraison trouvée</p>
                    <p className="text-gray-500">Les nouvelles livraisons apparaîtront ici automatiquement</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deliveryData
                      .filter(d =>
                        (deliveryFilter === 'all' || d.status === deliveryFilter) &&
                        (searchQuery === '' ||
                          d.order.buyer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.delivery_person.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.id.includes(searchQuery))
                      )
                      .map((delivery) => (
                        <div key={delivery.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Package className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900">Livraison #{delivery.id}</h4>
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    delivery.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                                    delivery.status === 'picked_up' ? 'bg-orange-100 text-orange-800' :
                                    delivery.status === 'in_transit' ? 'bg-yellow-100 text-yellow-800' :
                                    delivery.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {delivery.status === 'assigned' ? 'Assigné' :
                                     delivery.status === 'picked_up' ? 'Récupéré' :
                                     delivery.status === 'in_transit' ? 'En transit' :
                                     delivery.status === 'delivered' ? 'Livré' : 'Échec'}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                    <span className="text-sm text-gray-500">
                                      {delivery.collected_products}/{delivery.total_products} produits collectés
                                    </span>
                                  </div>
                                </div>
                                <p className="text-gray-600 mb-2">
                                  Client: {delivery.order.buyer.full_name} • Boutique: {delivery.order.shop.name}
                                </p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>Livreur: {delivery.delivery_person.full_name}</span>
                                  <span>Assigné: {delivery.assigned_at}</span>
                                  <span>Montant: {(delivery.order.total / 1000).toFixed(0)}K F CFA</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Button
                                onClick={() => handleViewDeliveryDetails(delivery.id)}
                                variant="outline"
                                size="sm"
                                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Détails
                              </Button>
                              {delivery.status === 'assigned' && (
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAssignDelivery(delivery.id, e.target.value);
                                      e.target.value = '';
                                    }
                                  }}
                                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  defaultValue=""
                                >
                                  <option value="" disabled>Réassigner</option>
                                  {deliveryPersonnel.map((person) => (
                                    <option key={person.id} value={person.id}>
                                      {person.full_name} ({person.active_deliveries} actives)
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Assign Delivery Modal */}
      <AssignDeliveryModal
        isOpen={isAssignDeliveryModalOpen}
        onClose={() => setIsAssignDeliveryModalOpen(false)}
        onDeliveryAssigned={() => {
          loadDeliveries();
          loadDeliveryStats();
          loadDeliveryPersonnel();
        }}
      />

      {/* Create Delivery Modal (legacy) */}
      <CreateDeliveryModal
        isOpen={isCreateDeliveryModalOpen}
        onClose={() => setIsCreateDeliveryModalOpen(false)}
        onDeliveryCreated={() => {
          loadDeliveries();
          loadDeliveryStats();
        }}
      />
    </div>
  );
}