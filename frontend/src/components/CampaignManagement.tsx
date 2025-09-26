import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Checkbox } from "./ui/checkbox";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Calendar,
  DollarSign,
  Target,
  TrendingUp,
  Users,
  MousePointer,
  Play,
  Pause,
  StopCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  Video,
  Grid3x3,
  MapPin,
  Globe,
  Heart,
  ShoppingBag,
  Zap,
  CheckCircle,
  AlertCircle,
  X,
  Home,
  Sidebar
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Campaign {
  id: number;
  title: string;
  description?: string;
  status: 'draft' | 'pending' | 'active' | 'paused' | 'completed' | 'expired' | 'cancelled';
  budget_type: 'total' | 'daily';
  total_budget: number;
  daily_budget?: number;
  spent_budget: number;
  start_date: string;
  end_date: string;
  created_at: string;
  objective: 'awareness' | 'traffic' | 'conversions' | 'sales';
  shop: {
    name: string;
  };
  product?: {
    id: number;
    name: string;
    image: string;
    price: string;
  };
  audience?: {
    age_min: number;
    age_max: number;
    gender: 'all' | 'male' | 'female';
    location: string[];
    interests: string[];
  };
  creative?: {
    headline: string;
    description: string;
    image_url?: string;
  };
  stats: {
    impressions: number;
    clicks: number;
    ctr: string;
    spent: string;
    remaining: string;
    conversions?: number;
    cost_per_conversion?: string;
    reach?: number;
  };
}

// SOMBA Internal Advertising interfaces
interface CampaignObjective {
  id: 'awareness' | 'engagement' | 'traffic' | 'sales';
  title: string;
  description: string;
  icon: any;
  color: string;
}

interface AdFormat {
  id: 'single_image' | 'video' | 'carousel' | 'collection' | 'dynamic_product' | 'product_showcase' | 'store_visit' | 'lead_generation';
  title: string;
  description: string;
  icon: any;
  preview: string;
}

interface AudiencePreset {
  id: string;
  name: string;
  description: string;
  demographics: {
    age_min: number;
    age_max: number;
    gender: 'all' | 'male' | 'female';
  };
  interests: string[];
  locations: string[];
  behaviors?: string[];
  languages?: string[];
}

interface Placement {
  id: string;
  name: string;
  platform: string;
  description: string;
  icon: any;
  enabled: boolean;
}

interface AdSet {
  id: number;
  name: string;
  audience: AudiencePreset;
  placements: Placement[];
  budget: number;
  schedule: {
    start_date: string;
    end_date: string;
  };
  optimization_goal: string;
}

interface Shop {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  image: string;
  price: string;
  category: string;
  boutique: string;
}

export function CampaignManagement() {
   const [campaigns, setCampaigns] = useState<Campaign[]>([]);
   const [shops, setShops] = useState<Shop[]>([]);
   const [products, setProducts] = useState<Product[]>([]);
   const [searchQuery, setSearchQuery] = useState("");
   const [selectedStatus, setSelectedStatus] = useState<string>("Tous");
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
   const [showCampaignDetail, setShowCampaignDetail] = useState(false);

   // Facebook-style wizard states
   const [currentStep, setCurrentStep] = useState(1);
   const [selectedObjective, setSelectedObjective] = useState<CampaignObjective | null>(null);
   const [selectedAdFormat, setSelectedAdFormat] = useState<AdFormat | null>(null);
   const [selectedAudiencePreset, setSelectedAudiencePreset] = useState<AudiencePreset | null>(null);
   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
   const [selectedPlacements, setSelectedPlacements] = useState<Placement[]>([]);
   const [uploadedImages, setUploadedImages] = useState<File[]>([]);
   const [uploadedVideos, setUploadedVideos] = useState<File[]>([]);
   const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
   const [isUploading, setIsUploading] = useState(false);

   // Enhanced Facebook-style features
   const [activeTab, setActiveTab] = useState<'campaigns' | 'catalog' | 'adsets' | 'ads' | 'audiences' | 'creatives'>('campaigns');
   const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);
   const [showBulkActions, setShowBulkActions] = useState(false);
   const [dateRange, setDateRange] = useState('last_30_days');
   const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
   const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
   const [showQuickBoostModal, setShowQuickBoostModal] = useState(false);
   const [boostingProduct, setBoostingProduct] = useState<Product | null>(null);
   const [enableABTesting, setEnableABTesting] = useState(false);
   const [abTestVariations, setAbTestVariations] = useState<any[]>([]);

  // SOMBA Internal Advertising constants
  const campaignObjectives: CampaignObjective[] = [
    {
      id: 'awareness',
      title: 'Visibilité',
      description: 'Faites découvrir vos produits aux utilisateurs de SOMBA',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      id: 'engagement',
      title: 'Engagement',
      description: 'Augmentez l\'interaction avec vos produits',
      icon: Heart,
      color: 'bg-pink-500'
    },
    {
      id: 'traffic',
      title: 'Trafic boutique',
      description: 'Dirigez les visiteurs vers votre boutique',
      icon: MousePointer,
      color: 'bg-green-500'
    },
    {
      id: 'sales',
      title: 'Ventes',
      description: 'Boostez les ventes de vos produits sur SOMBA',
      icon: ShoppingBag,
      color: 'bg-orange-500'
    }
  ];

  const adFormats: AdFormat[] = [
    {
      id: 'single_image',
      title: 'Image unique',
      description: 'Une belle image avec votre message',
      icon: ImageIcon,
      preview: '📷'
    },
    {
      id: 'video',
      title: 'Vidéo',
      description: 'Vidéo engageante pour captiver l\'attention',
      icon: Video,
      preview: '🎥'
    },
    {
      id: 'carousel',
      title: 'Carrousel',
      description: 'Plusieurs images dans un format défilant',
      icon: Grid3x3,
      preview: '📱'
    },
    {
      id: 'collection',
      title: 'Collection',
      description: 'Présentez plusieurs produits dans une collection',
      icon: ShoppingBag,
      preview: '🛍️'
    },
    {
      id: 'dynamic_product',
      title: 'Produit dynamique',
      description: 'Annonces automatiques optimisées pour vos produits',
      icon: Zap,
      preview: '⚡'
    },
    {
      id: 'product_showcase',
      title: 'Vitrine produit',
      description: 'Mettez en avant un produit spécifique avec détails',
      icon: ShoppingBag,
      preview: '🏪'
    },
    {
      id: 'store_visit',
      title: 'Visite en boutique',
      description: 'Encouragez les visites physiques avec promotions',
      icon: MapPin,
      preview: '📍'
    },
    {
      id: 'lead_generation',
      title: 'Génération de leads',
      description: 'Collectez des contacts intéressés par vos produits',
      icon: Users,
      preview: '📝'
    }
  ];

  const audiencePresets: AudiencePreset[] = [
    {
      id: 'broad',
      name: 'Tous les utilisateurs',
      description: 'Atteignez tous les utilisateurs actifs de SOMBA',
      demographics: { age_min: 18, age_max: 65, gender: 'all' },
      interests: [],
      locations: ['Congo'],
      behaviors: [],
      languages: ['fr', 'en']
    },
    {
      id: 'lookalike',
      name: 'Utilisateurs similaires',
      description: 'Utilisateurs similaires à vos meilleurs clients SOMBA',
      demographics: { age_min: 25, age_max: 45, gender: 'all' },
      interests: ['shopping', 'e-commerce'],
      locations: ['Congo'],
      behaviors: ['Acheteurs fréquents', 'Utilisateurs actifs'],
      languages: ['fr']
    },
    {
      id: 'interests',
      name: 'Centres d\'intérêt',
      description: 'Utilisateurs intéressés par vos catégories de produits',
      demographics: { age_min: 18, age_max: 55, gender: 'all' },
      interests: ['mode', 'technologie', 'maison', 'shopping'],
      locations: ['Congo', 'France', 'Canada'],
      behaviors: ['Acheteurs en ligne', 'Intérêt pour les promotions'],
      languages: ['fr', 'en']
    },
    {
      id: 'demographic',
      name: 'Profil démographique',
      description: 'Ciblez selon l\'âge, le genre et la localisation',
      demographics: { age_min: 25, age_max: 35, gender: 'female' },
      interests: ['beauté', 'mode', 'shopping'],
      locations: ['Congo', 'France'],
      behaviors: ['Acheteuses fréquentes'],
      languages: ['fr']
    },
    {
      id: 'custom_audience',
      name: 'Audience personnalisée',
      description: 'Utilisez votre liste de clients existants',
      demographics: { age_min: 18, age_max: 65, gender: 'all' },
      interests: [],
      locations: [],
      behaviors: ['Clients existants'],
      languages: ['fr']
    },
    {
      id: 'retargeting',
      name: 'Reciblage',
      description: 'Utilisateurs ayant visité vos produits sans acheter',
      demographics: { age_min: 18, age_max: 65, gender: 'all' },
      interests: ['shopping'],
      locations: ['Congo'],
      behaviors: ['Visiteurs de produits', 'Panier abandonné'],
      languages: ['fr', 'en']
    },
    {
      id: 'engagement',
      name: 'Utilisateurs engagés',
      description: 'Utilisateurs très actifs sur SOMBA',
      demographics: { age_min: 18, age_max: 45, gender: 'all' },
      interests: ['shopping', 'e-commerce', 'mode'],
      locations: ['Congo', 'France', 'Canada'],
      behaviors: ['Acheteurs fréquents', 'Commentateurs actifs'],
      languages: ['fr']
    }
  ];

  const placements: Placement[] = [
    {
      id: 'home_feed',
      name: 'Fil d\'accueil',
      platform: 'SOMBA',
      description: 'Annonces dans le fil d\'actualité principal',
      icon: Home,
      enabled: true
    },
    {
      id: 'search_results',
      name: 'Résultats de recherche',
      platform: 'SOMBA',
      description: 'Annonces dans les résultats de recherche',
      icon: Search,
      enabled: true
    },
    {
      id: 'category_pages',
      name: 'Pages catégories',
      platform: 'SOMBA',
      description: 'Annonces dans les pages de catégories',
      icon: Grid3x3,
      enabled: true
    },
    {
      id: 'product_recommendations',
      name: 'Recommandations produits',
      platform: 'SOMBA',
      description: 'Annonces dans les sections de recommandations',
      icon: Heart,
      enabled: true
    },
    {
      id: 'sidebar',
      name: 'Barre latérale',
      platform: 'SOMBA',
      description: 'Annonces dans la barre latérale',
      icon: Sidebar,
      enabled: false
    }
  ];

  // Form states for campaign creation
  const [formData, setFormData] = useState({
    shop_id: "",
    product_id: "",
    objective: "sales",
    title: "",
    description: "",
    budget_type: "total",
    total_budget: "",
    daily_budget: "",
    bidding_strategy: "lowest_cost",
    start_date: "",
    end_date: "",
    // Audience targeting
    age_min: "18",
    age_max: "65",
    gender: "all",
    location: "",
    interests: "",
    // Creative
    headline: "",
    ad_description: "",
    image_url: ""
  });

  // Load campaigns, shops, and products
  useEffect(() => {
    loadCampaigns();
    loadShops();
    loadProducts();
  }, []);

  const loadCampaigns = async () => {
    try {
      const token = localStorage.getItem('somba_token');
      const response = await fetch('http://localhost:4000/api/ad-campaigns', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns);
      } else {
        toast.error("Erreur lors du chargement des campagnes");
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur lors du chargement des campagnes");
    }
  };

  const loadShops = async () => {
    try {
      const token = localStorage.getItem('somba_token');
      const response = await fetch('http://localhost:4000/api/ad-campaigns/user/shops', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setShops(data.shops || []);
      } else {
        console.error('Erreur lors du chargement des boutiques:', response.status);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des boutiques:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const token = localStorage.getItem('somba_token');
      const response = await fetch('http://localhost:4000/api/ad-campaigns/user/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        console.error('Erreur lors du chargement des produits:', response.status);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('somba_token');

      // Prepare audience data from selected preset
      const audienceData = selectedAudiencePreset ? {
        age_min: selectedAudiencePreset.demographics.age_min,
        age_max: selectedAudiencePreset.demographics.age_max,
        gender: selectedAudiencePreset.demographics.gender,
        location: selectedAudiencePreset.locations,
        interests: selectedAudiencePreset.interests
      } : {
        age_min: 18,
        age_max: 65,
        gender: 'all',
        location: ['Congo'],
        interests: []
      };

      const response = await fetch('http://localhost:4000/api/ad-campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shop_id: parseInt(formData.shop_id),
          product_id: selectedProduct ? selectedProduct.id : undefined,
          objective: selectedObjective?.id || 'sales',
          title: formData.title,
          description: formData.description || `${selectedObjective?.title} - ${selectedProduct?.name || 'Campagne publicitaire'}`,
          budget_type: formData.budget_type,
          total_budget: parseFloat(formData.total_budget),
          daily_budget: formData.daily_budget ? parseFloat(formData.daily_budget) : undefined,
          start_date: formData.start_date,
          end_date: formData.end_date,
          audience: audienceData,
          creative: {
            headline: formData.headline,
            description: formData.ad_description,
            image_url: formData.image_url || selectedProduct?.image || undefined,
            ad_format: selectedAdFormat?.id
          },
          placements: selectedPlacements.map(p => p.id)
        })
      });

      if (response.ok) {
        toast.success("Campagne créée et soumise pour validation ! Elle sera examinée par un administrateur.");
        setIsCreateModalOpen(false);
        // Reset all wizard state
        setCurrentStep(1);
        setSelectedObjective(null);
        setSelectedAdFormat(null);
        setSelectedAudiencePreset(null);
        setSelectedProduct(null);
        setSelectedPlacements([]);
        setUploadedImages([]);
        setUploadedVideos([]);
        setUploadedImageUrls([]);
        setFormData({
          shop_id: "",
          product_id: "",
          objective: "sales",
          title: "",
          description: "",
          budget_type: "total",
          total_budget: "",
          daily_budget: "",
          bidding_strategy: "lowest_cost",
          start_date: "",
          end_date: "",
          age_min: "18",
          age_max: "65",
          gender: "all",
          location: "",
          interests: "",
          headline: "",
          ad_description: "",
          image_url: ""
        });
        loadCampaigns();
      } else {
        const error = await response.json();
        toast.error(error.message || "Erreur lors de la création de la campagne");
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur lors de la création de la campagne");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCampaignStatus = async (campaignId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('somba_token');
      const response = await fetch(`http://localhost:4000/api/ad-campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success("Statut de la campagne mis à jour");
        loadCampaigns();
      } else {
        toast.error("Erreur lors de la mise à jour du statut");
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const handleDeleteCampaign = async (campaignId: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette campagne ?")) {
      return;
    }

    try {
      const token = localStorage.getItem('somba_token');
      const response = await fetch(`http://localhost:4000/api/ad-campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success("Campagne supprimée avec succès");
        loadCampaigns();
      } else {
        toast.error("Erreur lors de la suppression de la campagne");
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur lors de la suppression de la campagne");
    }
  };

  const handleViewCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowCampaignDetail(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Brouillon' },
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente validation' },
      'active': { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      'paused': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'En pause' },
      'completed': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Terminée' },
      'expired': { bg: 'bg-red-100', text: 'text-red-800', label: 'Expirée' },
      'cancelled': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejetée' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <Badge className={`${config.bg} ${config.text}`}>
        {config.label}
      </Badge>
    );
  };

  const getStatusActions = (campaign: Campaign) => {
    const actions = [];

    // Pour les campagnes en attente, pas d'actions disponibles pour le vendeur
    if (campaign.status === 'pending') {
      return [
        <span key="waiting" className="text-sm text-orange-600 font-medium">
          En attente de validation
        </span>
      ];
    }

    if (campaign.status === 'active') {
      actions.push(
        <Button
          key="pause"
          size="sm"
          variant="outline"
          onClick={() => handleUpdateCampaignStatus(campaign.id, 'paused')}
          className="border-orange-300 text-orange-600 hover:bg-orange-50"
        >
          <Pause className="h-4 w-4 mr-1" />
          Pause
        </Button>
      );
    }

    if (campaign.status === 'paused') {
      actions.push(
        <Button
          key="resume"
          size="sm"
          onClick={() => handleUpdateCampaignStatus(campaign.id, 'active')}
          className="bg-green-600 hover:bg-green-700"
        >
          <Play className="h-4 w-4 mr-1" />
          Reprendre
        </Button>
      );
    }

    if (['active', 'paused'].includes(campaign.status)) {
      actions.push(
        <Button
          key="stop"
          size="sm"
          variant="outline"
          onClick={() => handleUpdateCampaignStatus(campaign.id, 'cancelled')}
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          <StopCircle className="h-4 w-4 mr-1" />
          Arrêter
        </Button>
      );
    }

    return actions;
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch =
      campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.shop.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === "Tous" || campaign.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    'Tous': campaigns.length,
    'draft': campaigns.filter(c => c.status === 'draft').length,
    'pending': campaigns.filter(c => c.status === 'pending').length,
    'active': campaigns.filter(c => c.status === 'active').length,
    'paused': campaigns.filter(c => c.status === 'paused').length,
    'completed': campaigns.filter(c => c.status === 'completed').length,
    'expired': campaigns.filter(c => c.status === 'expired').length,
    'cancelled': campaigns.filter(c => c.status === 'cancelled').length
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const token = localStorage.getItem('somba_token');
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://localhost:4000/api/ad-campaigns/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedImageUrls(prev => [...prev, data.image_url]);
        setFormData(prev => ({ ...prev, image_url: data.image_url }));
        toast.success("Image uploadée avec succès");
      } else {
        const error = await response.json();
        toast.error(error.message || "Erreur lors de l'upload de l'image");
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur lors de l'upload de l'image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast.error("Le fichier est trop volumineux (max 10MB)");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("Seules les images sont autorisées");
        return;
      }
      handleImageUpload(file);
    }
  };

  if (showCampaignDetail && selectedCampaign) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowCampaignDetail(false)}
              className="border-somba-primary text-somba-primary"
            >
              ← Retour
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-somba-primary">
                {selectedCampaign.title}
              </h1>
              <p className="text-somba-text-light">
                Boutique: {selectedCampaign.shop.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(selectedCampaign.status)}
            {getStatusActions(selectedCampaign)}
          </div>
        </div>

        {/* Campaign Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Impressions</p>
                  <p className="text-2xl font-semibold text-gray-900">{selectedCampaign.stats.impressions.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">+12%</span>
                  </div>
                </div>
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Clics</p>
                  <p className="text-2xl font-semibold text-gray-900">{selectedCampaign.stats.clicks.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">+8%</span>
                  </div>
                </div>
                <MousePointer className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux de clics</p>
                  <p className="text-2xl font-semibold text-gray-900">{selectedCampaign.stats.ctr}%</p>
                  <div className="flex items-center mt-1">
                    <span className={`text-xs ${parseFloat(selectedCampaign.stats.ctr) > 2 ? 'text-green-600' : 'text-orange-600'}`}>
                      {parseFloat(selectedCampaign.stats.ctr) > 2 ? 'Excellent' : 'À améliorer'}
                    </span>
                  </div>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Budget dépensé</p>
                  <p className="text-2xl font-semibold text-gray-900">{selectedCampaign.stats.spent} F CFA</p>
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {((parseFloat(selectedCampaign.stats.spent.replace(/[^\d]/g, '')) / selectedCampaign.total_budget) * 100).toFixed(1)}% du budget
                    </span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-somba-primary flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance par jour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Clics quotidiens moyens</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {Math.round(selectedCampaign.stats.clicks / 7)} clics/jour
                    </p>
                  </div>
                  <div className="w-16 h-16 relative">
                    <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">
                        {((selectedCampaign.stats.clicks / selectedCampaign.stats.impressions) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Coût par clic</p>
                    <p className="text-lg font-semibold text-green-600">
                      {((parseFloat(selectedCampaign.stats.spent.replace(/[^\d]/g, '')) / selectedCampaign.stats.clicks) || 0).toFixed(0)} F CFA
                    </p>
                  </div>
                  <div className="text-xs text-green-700">
                    {((parseFloat(selectedCampaign.stats.spent.replace(/[^\d]/g, '')) / selectedCampaign.stats.clicks) || 0) < 100 ? 'Excellent' :
                     ((parseFloat(selectedCampaign.stats.spent.replace(/[^\d]/g, '')) / selectedCampaign.stats.clicks) || 0) < 200 ? 'Bon' : 'À optimiser'}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Portée atteinte</p>
                    <p className="text-lg font-semibold text-purple-600">
                      {selectedCampaign.stats.reach?.toLocaleString() || 'N/A'} personnes
                    </p>
                  </div>
                  <div className="text-xs text-purple-700">
                    {selectedCampaign.stats.reach ? `${((selectedCampaign.stats.reach / selectedCampaign.stats.impressions) * 100).toFixed(1)}% de fréquence` : 'Données indisponibles'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-somba-primary flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tendances de performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-blue-900">Évolution du CTR</h4>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">+15%</span>
                    </div>
                  </div>
                  <p className="text-sm text-blue-700">
                    Votre taux de clics s'améliore grâce à l'optimisation automatique
                  </p>
                  <div className="mt-3 flex items-center space-x-2">
                    <div className="flex-1 bg-blue-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">75%</span>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-green-900">Efficacité budgétaire</h4>
                    <div className="flex items-center space-x-1">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Optimale</span>
                    </div>
                  </div>
                  <p className="text-sm text-green-700">
                    Votre budget est utilisé efficacement pour atteindre vos objectifs
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-green-600">Hier</p>
                      <p className="text-sm font-semibold text-green-900">+8%</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600">Aujourd'hui</p>
                      <p className="text-sm font-semibold text-green-900">+12%</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600">Prévision</p>
                      <p className="text-sm font-semibold text-green-900">+15%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Insights de performance
            </CardTitle>
            <CardDescription className="text-orange-700">
              Analyse automatique de vos résultats et recommandations d'optimisation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">CTR excellent</h4>
                  <p className="text-sm text-gray-600">Votre taux de clics de {selectedCampaign.stats.ctr}% est supérieur à la moyenne du secteur.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">Audience à élargir</h4>
                  <p className="text-sm text-gray-600">Considérez d'ajouter des centres d'intérêt similaires pour atteindre plus d'utilisateurs.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">Budget optimisé</h4>
                  <p className="text-sm text-gray-600">Votre stratégie d'enchères génère de bons résultats à coût contrôlé.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
                <Target className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">Créatif performant</h4>
                  <p className="text-sm text-gray-600">Votre image et texte convertissent bien. Testez des variations pour optimiser davantage.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-2">Recommandations d'optimisation</h4>
              <ul className="space-y-2 text-sm text-orange-800">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                  Augmentez légèrement votre budget quotidien pour atteindre plus de conversions
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                  Testez des horaires de diffusion différents pour optimiser l'engagement
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                  Ajoutez des emplacements supplémentaires pour élargir votre portée
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-somba-primary">Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-somba-text-light">Description</Label>
                <p className="text-somba-primary">{selectedCampaign.description || 'Aucune description'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-somba-text-light">Budget total</Label>
                  <p className="text-somba-primary">{selectedCampaign.total_budget.toLocaleString()} F CFA</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-somba-text-light">Budget restant</Label>
                  <p className="text-somba-primary">{selectedCampaign.stats.remaining} F CFA</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-somba-text-light">Date de début</Label>
                  <p className="text-somba-primary">{new Date(selectedCampaign.start_date).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-somba-text-light">Date de fin</Label>
                  <p className="text-somba-primary">{new Date(selectedCampaign.end_date).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-somba-primary">Statut et actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-somba-text-light">Statut actuel</Label>
                  <div className="mt-2">
                    {getStatusBadge(selectedCampaign.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-somba-text-light">Actions disponibles</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getStatusActions(selectedCampaign)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SOMBA Internal Advertising Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Promotion de produits</h1>
                <p className="text-gray-600 text-sm">Boostez la visibilité de vos produits sur SOMBA</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analyses
              </Button>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Users className="h-4 w-4 mr-2" />
                Audience
              </Button>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                + Nouvelle campagne
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Facebook-style Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-transparent h-auto p-0">
              <TabsTrigger
                value="campaigns"
                className="flex items-center space-x-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50"
              >
                <Target className="h-4 w-4" />
                <span>Campagnes</span>
              </TabsTrigger>
              <TabsTrigger
                value="catalog"
                className="flex items-center space-x-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Catalogue</span>
              </TabsTrigger>
              <TabsTrigger
                value="adsets"
                className="flex items-center space-x-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50"
              >
                <Grid3x3 className="h-4 w-4" />
                <span>Ensembles de pubs</span>
              </TabsTrigger>
              <TabsTrigger
                value="ads"
                className="flex items-center space-x-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50"
              >
                <ImageIcon className="h-4 w-4" />
                <span>Publicités</span>
              </TabsTrigger>
              <TabsTrigger
                value="audiences"
                className="flex items-center space-x-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50"
              >
                <Users className="h-4 w-4" />
                <span>Audiences</span>
              </TabsTrigger>
              <TabsTrigger
                value="creatives"
                className="flex items-center space-x-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50"
              >
                <Zap className="h-4 w-4" />
                <span>Créatifs</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Facebook-style Campaign Creation Wizard */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        if (!open) {
          // Reset wizard state when closing
          setCurrentStep(1);
          setSelectedObjective(null);
          setSelectedAdFormat(null);
          setSelectedAudiencePreset(null);
          setSelectedProduct(null);
          setSelectedPlacements([]);
          setUploadedImages([]);
          setUploadedVideos([]);
          setUploadedImageUrls([]);
          setFormData({
            shop_id: "",
            product_id: "",
            objective: "sales",
            title: "",
            description: "",
            budget_type: "total",
            total_budget: "",
            daily_budget: "",
            bidding_strategy: "lowest_cost",
            start_date: "",
            end_date: "",
            age_min: "18",
            age_max: "65",
            gender: "all",
            location: "",
            interests: "",
            headline: "",
            ad_description: "",
            image_url: ""
          });
        }
        setIsCreateModalOpen(open);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-orange-500" />
              Créer une campagne de promotion
            </DialogTitle>
            <DialogDescription>
              Boostez la visibilité de vos produits sur SOMBA en quelques étapes
            </DialogDescription>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Étape {currentStep} sur 9</span>
              <span>{Math.round((currentStep / 9) * 100)}% terminé</span>
            </div>
            <Progress value={(currentStep / 9) * 100} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Quel est l'objectif de votre campagne ?</h3>
                  <p className="text-gray-600 mb-4">Choisissez comment vous voulez promouvoir vos produits sur SOMBA</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {campaignObjectives.map((objective) => (
                    <Card
                      key={objective.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedObjective?.id === objective.id ? 'ring-2 ring-orange-500 border-orange-500' : ''
                      }`}
                      onClick={() => setSelectedObjective(objective)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${objective.color} text-white`}>
                            <objective.icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{objective.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{objective.description}</p>
                          </div>
                          {selectedObjective?.id === objective.id && (
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Choisissez le format de votre annonce</h3>
                  <p className="text-gray-600 mb-4">Sélectionnez comment votre produit sera présenté aux utilisateurs SOMBA</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {adFormats.map((format) => (
                    <Card
                      key={format.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedAdFormat?.id === format.id ? 'ring-2 ring-orange-500 border-orange-500' : ''
                      }`}
                      onClick={() => setSelectedAdFormat(format)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{format.preview}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{format.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                          </div>
                          {selectedAdFormat?.id === format.id && (
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Définissez votre audience cible</h3>
                  <p className="text-gray-600 mb-4">Quels utilisateurs SOMBA souhaitez-vous atteindre ?</p>
                </div>

                {/* Audience Size Estimator */}
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-orange-900">Taille estimée de l'audience</h4>
                        <p className="text-sm text-orange-700">
                          {selectedAudiencePreset ? '800 - 1,500 utilisateurs actifs' : 'Sélectionnez une audience pour voir l\'estimation'}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Audience Insights */}
                {selectedAudiencePreset && (
                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader>
                      <CardTitle className="text-purple-900 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Insights avancés de l'audience
                      </CardTitle>
                      <CardDescription className="text-purple-700">
                        Analyse détaillée de votre audience cible
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-3 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-purple-900">Âge moyen</span>
                            <span className="text-lg font-bold text-purple-600">
                              {Math.round((selectedAudiencePreset.demographics.age_min + selectedAudiencePreset.demographics.age_max) / 2)} ans
                            </span>
                          </div>
                          <div className="w-full bg-purple-100 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-purple-900">Genre principal</span>
                            <span className="text-lg font-bold text-purple-600">
                              {selectedAudiencePreset.demographics.gender === 'all' ? 'Mixte' :
                               selectedAudiencePreset.demographics.gender === 'female' ? 'Féminin' : 'Masculin'}
                            </span>
                          </div>
                          <div className="w-full bg-purple-100 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-purple-900">Potentiel d'achat</span>
                            <span className="text-lg font-bold text-purple-600">Élevé</span>
                          </div>
                          <div className="w-full bg-purple-100 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-purple-200">
                        <h5 className="font-semibold text-purple-900 mb-3">Recommandations d'optimisation</h5>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Audience bien ciblée</p>
                              <p className="text-xs text-gray-600">Cette audience correspond parfaitement à votre objectif de ventes</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Considérez l'expansion</p>
                              <p className="text-xs text-gray-600">Ajoutez des centres d'intérêt similaires pour atteindre plus de personnes</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Audience lookalike disponible</p>
                              <p className="text-xs text-gray-600">Créez une audience similaire pour étendre votre portée</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {audiencePresets.map((preset) => (
                    <Card
                      key={preset.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedAudiencePreset?.id === preset.id ? 'ring-2 ring-orange-500 border-orange-500' : ''
                      }`}
                      onClick={() => setSelectedAudiencePreset(preset)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{preset.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{preset.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Âge: {preset.demographics.age_min}-{preset.demographics.age_max}</span>
                              <span>Genre: {preset.demographics.gender === 'all' ? 'Tous' : preset.demographics.gender}</span>
                              <span>{preset.locations.length > 0 ? preset.locations.join(', ') : 'Toutes localisations'}</span>
                            </div>
                            {preset.interests.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500">Centres d'intérêt: {preset.interests.join(', ')}</p>
                              </div>
                            )}
                            {(preset.behaviors && preset.behaviors.length > 0) && (
                              <div className="mt-1">
                                <p className="text-xs text-gray-500">Comportements: {preset.behaviors.join(', ')}</p>
                              </div>
                            )}
                          </div>
                          {selectedAudiencePreset?.id === preset.id && (
                            <CheckCircle className="h-5 w-5 text-blue-500 ml-4" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Advanced Targeting Options */}
                {selectedAudiencePreset && (
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-base">Options de ciblage avancées</CardTitle>
                      <CardDescription>
                        Affinez votre audience avec des critères supplémentaires
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Tranche d'âge</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Input
                              type="number"
                              placeholder="18"
                              className="w-20"
                              value={selectedAudiencePreset.demographics.age_min}
                              readOnly
                            />
                            <span className="text-gray-500">-</span>
                            <Input
                              type="number"
                              placeholder="65"
                              className="w-20"
                              value={selectedAudiencePreset.demographics.age_max}
                              readOnly
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Genre</Label>
                          <Select value={selectedAudiencePreset.demographics.gender}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tous</SelectItem>
                              <SelectItem value="male">Homme</SelectItem>
                              <SelectItem value="female">Femme</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Localisations</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedAudiencePreset.locations.map((location, index) => (
                            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                              {location}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Centres d'intérêt</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedAudiencePreset.interests.map((interest, index) => (
                            <Badge key={index} variant="outline" className="border-gray-300">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Choisissez vos emplacements</h3>
                  <p className="text-gray-600 mb-4">Où souhaitez-vous afficher vos annonces dans SOMBA ?</p>
                </div>
                <div className="space-y-4">
                  {placements.map((placement) => (
                    <Card
                      key={placement.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedPlacements.some(p => p.id === placement.id) ? 'ring-2 ring-orange-500 border-orange-500' : ''
                      }`}
                      onClick={() => {
                        setSelectedPlacements(prev =>
                          prev.some(p => p.id === placement.id)
                            ? prev.filter(p => p.id !== placement.id)
                            : [...prev, placement]
                        );
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-orange-100">
                              <placement.icon className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{placement.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{placement.description}</p>
                              <p className="text-xs text-gray-500 mt-1">SOMBA</p>
                            </div>
                          </div>
                          <Checkbox
                            checked={selectedPlacements.some(p => p.id === placement.id)}
                            onChange={() => {}}
                            className="ml-4"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {selectedPlacements.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Sélectionnez au moins un emplacement</p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 5 && selectedObjective?.id === 'sales' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Sélectionnez le produit à promouvoir</h3>
                  <p className="text-gray-600 mb-4">Choisissez le produit que vous souhaitez mettre en avant</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {products.map((product) => (
                    <Card
                      key={product.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedProduct?.id === product.id ? 'ring-2 ring-orange-500 border-orange-500' : ''
                      }`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <ImageWithFallback
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{product.name}</h4>
                            <p className="text-sm text-gray-600">{product.price}</p>
                            <p className="text-xs text-gray-500">{product.category}</p>
                          </div>
                          {selectedProduct?.id === product.id && (
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Créez votre contenu publicitaire</h3>
                  <p className="text-gray-600 mb-4">Rédigez un message accrocheur et ajoutez des visuels</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Creative Form */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="headline">Titre accrocheur *</Label>
                      <Input
                        id="headline"
                        value={formData.headline}
                        onChange={(e) => setFormData({...formData, headline: e.target.value})}
                        placeholder="Ex: Découvrez notre nouvelle collection !"
                        maxLength={40}
                      />
                      <p className="text-xs text-gray-500 mt-1">{formData.headline.length}/40 caractères</p>
                    </div>

                    <div>
                      <Label htmlFor="ad_description">Description *</Label>
                      <Textarea
                        id="ad_description"
                        value={formData.ad_description}
                        onChange={(e) => setFormData({...formData, ad_description: e.target.value})}
                        placeholder="Décrivez les avantages de votre produit..."
                        rows={3}
                        maxLength={125}
                      />
                      <p className="text-xs text-gray-500 mt-1">{formData.ad_description.length}/125 caractères</p>
                    </div>

                    <div>
                      <Label>Images ou vidéos</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Glissez-déposez vos images ou vidéos ici, ou cliquez pour sélectionner
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="image-upload"
                          disabled={isUploading}
                        />
                        <label htmlFor="image-upload">
                          <Button variant="outline" size="sm" asChild disabled={isUploading}>
                            <span className="cursor-pointer">
                              <Upload className="h-4 w-4 mr-2" />
                              {isUploading ? 'Upload en cours...' : 'Sélectionner des fichiers'}
                            </span>
                          </Button>
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          Formats acceptés: JPG, PNG. Taille max: 10MB
                        </p>
                      </div>

                      {/* Affichage des images uploadées */}
                      {uploadedImageUrls.length > 0 && (
                        <div className="mt-4">
                          <Label className="text-sm font-medium">Images uploadées</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                            {uploadedImageUrls.map((url, index) => (
                              <div key={index} className="relative">
                                <ImageWithFallback
                                  src={url}
                                  alt={`Image ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg border"
                                />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="absolute top-1 right-1 h-6 w-6 p-0"
                                  onClick={() => {
                                    setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));
                                    if (formData.image_url === url) {
                                      setFormData(prev => ({ ...prev, image_url: '' }));
                                    }
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ad Preview */}
                  <div className="space-y-4">
                    <div>
                      <Label>Aperçu de l'annonce</Label>
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="text-xs text-gray-500 mb-2">SOMBA - Fil d'actualité</div>
                        <Card className="max-w-sm">
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">SOMBA</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm">SOMBA</span>
                                  <span className="text-xs text-gray-500">Sponsorisé</span>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">2 h</p>
                                <p className="text-sm mb-2">
                                  {formData.headline || "Votre titre accrocheur apparaîtra ici"}
                                </p>
                                <p className="text-xs text-gray-700 mb-3">
                                  {formData.ad_description || "Votre description apparaîtra ici..."}
                                </p>
                                {selectedProduct && (
                                  <div className="border border-gray-200 rounded-lg p-2 bg-white">
                                    <div className="flex items-center gap-2">
                                      <ImageWithFallback
                                        src={selectedProduct.image}
                                        alt={selectedProduct.name}
                                        className="w-12 h-12 object-cover rounded"
                                      />
                                      <div className="flex-1">
                                        <p className="text-xs font-semibold">{selectedProduct.name}</p>
                                        <p className="text-xs text-gray-600">{selectedProduct.price}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                                  <span>J'aime</span>
                                  <span>Commenter</span>
                                  <span>Partager</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Dynamic Creative Optimization */}
                    <Card className="border-yellow-200 bg-yellow-50">
                      <CardHeader>
                        <CardTitle className="text-yellow-900 flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          Optimisation créative dynamique
                        </CardTitle>
                        <CardDescription className="text-yellow-700">
                          Facebook teste automatiquement différentes combinaisons pour optimiser vos résultats
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                            <div>
                              <h5 className="font-medium text-gray-900">Images optimisées</h5>
                              <p className="text-sm text-gray-600">Test automatique des meilleures images</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-green-600 font-medium">Activé</span>
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                            <div>
                              <h5 className="font-medium text-gray-900">Textes variés</h5>
                              <p className="text-sm text-gray-600">Titres et descriptions optimisés</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-green-600 font-medium">Activé</span>
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                            <div>
                              <h5 className="font-medium text-gray-900">Formats adaptés</h5>
                              <p className="text-sm text-gray-600">Sélection automatique du meilleur format</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-green-600 font-medium">Activé</span>
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                            <div>
                              <h5 className="font-medium text-gray-900">Audiences ciblées</h5>
                              <p className="text-sm text-gray-600">Optimisation par segment d'audience</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-green-600 font-medium">Activé</span>
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border border-yellow-300">
                          <div className="flex items-center space-x-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-900">Résultats attendus</span>
                          </div>
                          <p className="text-sm text-yellow-800 mb-3">
                            L'optimisation dynamique peut améliorer vos performances jusqu'à 25%
                          </p>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-xs text-yellow-700">CTR</p>
                              <p className="text-lg font-bold text-yellow-900">+15-25%</p>
                            </div>
                            <div>
                              <p className="text-xs text-yellow-700">Conversions</p>
                              <p className="text-lg font-bold text-yellow-900">+20-30%</p>
                            </div>
                            <div>
                              <p className="text-xs text-yellow-700">ROAS</p>
                              <p className="text-lg font-bold text-yellow-900">+10-20%</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 7 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Budget et calendrier</h3>
                  <p className="text-gray-600 mb-4">Définissez votre budget et la durée de votre campagne</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="shop_id">Boutique *</Label>
                      <Select value={formData.shop_id} onValueChange={(value) => setFormData({...formData, shop_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une boutique" />
                        </SelectTrigger>
                        <SelectContent>
                          {shops.map((shop) => (
                            <SelectItem key={shop.id} value={shop.id.toString()}>
                              {shop.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="budget_type">Type de budget *</Label>
                      <Select value={formData.budget_type} onValueChange={(value) => setFormData({...formData, budget_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="total">Budget total</SelectItem>
                          <SelectItem value="daily">Budget quotidien</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="bidding_strategy">Stratégie d'enchères *</Label>
                      <Select value={formData.bidding_strategy} onValueChange={(value) => setFormData({...formData, bidding_strategy: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lowest_cost">Coût le plus bas</SelectItem>
                          <SelectItem value="target_cost">Coût cible</SelectItem>
                          <SelectItem value="cost_cap">Limite de coût</SelectItem>
                          <SelectItem value="bid_cap">Plafond d'enchère</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.bidding_strategy === 'lowest_cost' && 'Optimise automatiquement pour obtenir le meilleur résultat au coût le plus bas'}
                        {formData.bidding_strategy === 'target_cost' && 'Maintient un coût cible spécifique'}
                        {formData.bidding_strategy === 'cost_cap' && 'Limite le coût maximum par résultat'}
                        {formData.bidding_strategy === 'bid_cap' && 'Définit un plafond pour vos enchères'}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="total_budget">Budget total (F CFA) *</Label>
                      <Input
                        id="total_budget"
                        type="number"
                        value={formData.total_budget}
                        onChange={(e) => setFormData({...formData, total_budget: e.target.value})}
                        placeholder="10000"
                        min="1000"
                        step="500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum 1,000 F CFA</p>
                    </div>

                    {formData.budget_type === 'daily' && (
                      <div>
                        <Label htmlFor="daily_budget">Budget quotidien (F CFA)</Label>
                        <Input
                          id="daily_budget"
                          type="number"
                          value={formData.daily_budget}
                          onChange={(e) => setFormData({...formData, daily_budget: e.target.value})}
                          placeholder="500"
                          min="100"
                          step="50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum 100 F CFA par jour</p>
                      </div>
                    )}

                    {/* Budget Recommendations */}
                    <Card className="bg-orange-50 border-orange-200">
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-800">Recommandations budgétaires</span>
                        </div>
                        <p className="text-xs text-orange-700 mt-1">
                          Pour votre objectif "{selectedObjective?.title}", nous recommandons un budget minimum de 5,000 F CFA pour des résultats optimaux.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="start_date">Date de début *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div>
                      <Label htmlFor="end_date">Date de fin *</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                        min={formData.start_date || new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div>
                      <Label htmlFor="title">Nom de la campagne *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="Ma campagne produit"
                      />
                    </div>

                    {/* Campaign Summary */}
                    <Card className="bg-orange-50 border-orange-200">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-orange-900 mb-2">Résumé de la campagne</h4>
                        <div className="space-y-1 text-sm text-orange-800">
                          <p><strong>Objectif:</strong> {selectedObjective?.title}</p>
                          <p><strong>Format:</strong> {selectedAdFormat?.title}</p>
                          <p><strong>Audience:</strong> {selectedAudiencePreset?.name}</p>
                          <p><strong>Emplacements:</strong> {selectedPlacements.length} sélectionnés</p>
                          {selectedProduct && <p><strong>Produit:</strong> {selectedProduct.name}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 8 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Test A/B (Optionnel)</h3>
                  <p className="text-gray-600 mb-4">Testez différentes versions de votre publicité pour optimiser les performances</p>
                </div>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-blue-900">Test A/B automatique</h4>
                        <p className="text-sm text-blue-700">Facebook teste automatiquement différentes combinaisons pour optimiser vos résultats</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-blue-700">Activé</span>
                        <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                          <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <h5 className="font-medium text-gray-900">Images et vidéos</h5>
                          <p className="text-sm text-gray-600">Test automatique des meilleures images</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <h5 className="font-medium text-gray-900">Textes publicitaires</h5>
                          <p className="text-sm text-gray-600">Optimisation automatique des titres et descriptions</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <h5 className="font-medium text-gray-900">Formats d'annonces</h5>
                          <p className="text-sm text-gray-600">Test des meilleurs formats pour votre audience</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Optimisation automatique activée</span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        Facebook optimisera automatiquement votre campagne pour maximiser les résultats.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Sauter le test A/B</h4>
                    <p className="text-sm text-gray-600">Continuer avec la configuration actuelle</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(9)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Sauter cette étape
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep === 1) {
                  setIsCreateModalOpen(false);
                } else {
                  setCurrentStep(currentStep - 1);
                }
              }}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {currentStep === 1 ? 'Annuler' : 'Précédent'}
            </Button>

            <Button
              onClick={() => {
                if (currentStep === 8) {
                  handleCreateCampaign(new Event('submit') as any);
                } else {
                  setCurrentStep(currentStep + 1);
                }
              }}
              disabled={
                (currentStep === 1 && !selectedObjective) ||
                (currentStep === 2 && !selectedAdFormat) ||
                (currentStep === 3 && !selectedAudiencePreset) ||
                (currentStep === 4 && selectedPlacements.length === 0) ||
                (currentStep === 5 && selectedObjective?.id === 'sales' && !selectedProduct) ||
                (currentStep === 6 && (!formData.headline || !formData.ad_description)) ||
                (currentStep === 7 && (!formData.shop_id || !formData.title || !formData.total_budget || !formData.start_date || !formData.end_date))
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {currentStep === 8 ? (
                isLoading ? 'Création...' : 'Créer la campagne'
              ) : (
                <>
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Boost Modal */}
      <Dialog open={showQuickBoostModal} onOpenChange={setShowQuickBoostModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-blue-600" />
              Booster le produit
            </DialogTitle>
            <DialogDescription>
              Créez rapidement une campagne publicitaire pour promouvoir ce produit
            </DialogDescription>
          </DialogHeader>

          {boostingProduct && (
            <div className="space-y-4">
              {/* Product Preview */}
              <Card className="border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <ImageWithFallback
                      src={boostingProduct.image}
                      alt={boostingProduct.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{boostingProduct.name}</h4>
                      <p className="text-sm text-gray-600">{boostingProduct.price}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Boost Options */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Objectif de la campagne</Label>
                  <Select defaultValue="sales">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Promouvoir les ventes</SelectItem>
                      <SelectItem value="traffic">Générer du trafic</SelectItem>
                      <SelectItem value="awareness">Augmenter la notoriété</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Budget quotidien (F CFA)</Label>
                  <Select defaultValue="5000">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2500">2,500 F CFA</SelectItem>
                      <SelectItem value="5000">5,000 F CFA</SelectItem>
                      <SelectItem value="10000">10,000 F CFA</SelectItem>
                      <SelectItem value="25000">25,000 F CFA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Durée de la campagne</Label>
                  <Select defaultValue="7">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 jours</SelectItem>
                      <SelectItem value="7">7 jours</SelectItem>
                      <SelectItem value="14">14 jours</SelectItem>
                      <SelectItem value="30">30 jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Estimated Reach */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-900 text-sm">Portée estimée</h4>
                      <p className="text-sm text-blue-700">1,200 - 2,500 personnes</p>
                    </div>
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowQuickBoostModal(false)}>
              Annuler
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                // Here you would create the campaign with the selected options
                toast.success("Campagne de boost créée avec succès !");
                setShowQuickBoostModal(false);
                setBoostingProduct(null);
              }}
            >
              <Zap className="h-4 w-4 mr-2" />
              Lancer le boost
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsContent value="campaigns" className="space-y-6">
            {/* Facebook-style Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
              {Object.entries(statusCounts).map(([status, count]) => {
                const statusConfig = {
                  'Tous': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                  'draft': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
                  'pending': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
                  'active': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
                  'paused': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
                  'completed': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                  'expired': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
                  'cancelled': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
                };

                const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Tous;

                return (
                  <Card
                    key={status}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedStatus === status ? `ring-2 ring-orange-500 ${config.border}` : config.border
                    } ${config.bg}`}
                    onClick={() => setSelectedStatus(status)}
                  >
                    <CardContent className="p-4 text-center">
                      <p className={`text-2xl font-bold ${config.text}`}>{count}</p>
                      <p className={`text-sm font-medium ${config.text} mt-1`}>
                        {status === 'Tous' ? 'Total' :
                         status === 'draft' ? 'Brouillons' :
                         status === 'pending' ? 'En attente' :
                         status === 'active' ? 'Actives' :
                         status === 'paused' ? 'En pause' :
                         status === 'completed' ? 'Terminées' :
                         status === 'expired' ? 'Expirées' : 'Rejetées'}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Search and Filters - Facebook Style */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Rechercher des campagnes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Aujourd'hui</SelectItem>
                    <SelectItem value="yesterday">Hier</SelectItem>
                    <SelectItem value="last_7_days">7 derniers jours</SelectItem>
                    <SelectItem value="last_30_days">30 derniers jours</SelectItem>
                    <SelectItem value="last_90_days">90 derniers jours</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedCampaigns.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedCampaigns.length} campagne{selectedCampaigns.length > 1 ? 's' : ''} sélectionnée{selectedCampaigns.length > 1 ? 's' : ''}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      onClick={() => setSelectedCampaigns([])}
                    >
                      Désélectionner
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                      <Play className="h-4 w-4 mr-1" />
                      Activer
                    </Button>
                    <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                      <Pause className="h-4 w-4 mr-1" />
                      Mettre en pause
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                      <StopCircle className="h-4 w-4 mr-1" />
                      Arrêter
                    </Button>
                    <Button size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Campaigns List */}
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Checkbox
                          checked={selectedCampaigns.includes(campaign.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCampaigns(prev => [...prev, campaign.id]);
                            } else {
                              setSelectedCampaigns(prev => prev.filter(id => id !== campaign.id));
                            }
                          }}
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
                          <p className="text-sm text-gray-600">{campaign.shop.name}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(campaign.status)}
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-6 text-center">
                          <div>
                            <p className="text-sm text-gray-600">Impressions</p>
                            <p className="font-semibold text-gray-900">{campaign.stats.impressions.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Clics</p>
                            <p className="font-semibold text-gray-900">{campaign.stats.clicks.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">CTR</p>
                            <p className="font-semibold text-gray-900">{campaign.stats.ctr}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Dépensé</p>
                            <p className="font-semibold text-gray-900">{campaign.stats.spent} F CFA</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            onClick={() => handleViewCampaign(campaign)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>

                          {getStatusActions(campaign)}

                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Campaign Progress */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Progression du budget</span>
                        <span className="text-sm text-gray-900">
                          {campaign.stats.spent} / {campaign.total_budget.toLocaleString()} F CFA
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(parseFloat(campaign.stats.spent.replace(/[^\d]/g, '')) / campaign.total_budget) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredCampaigns.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune campagne trouvée</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery ? 'Essayez de modifier vos critères de recherche' : 'Commencez par créer votre première campagne publicitaire'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer ma première campagne
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="catalog" className="space-y-6">
            {/* Product Catalog Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Catalogue de produits</h2>
                <p className="text-gray-600">Promouvez vos produits avec des campagnes publicitaires ciblées</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Upload className="h-4 w-4 mr-2" />
                  Importer catalogue
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un produit
                </Button>
              </div>
            </div>

            {/* Catalog Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Produits actifs</p>
                      <p className="text-2xl font-semibold text-gray-900">{products.length}</p>
                    </div>
                    <ShoppingBag className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Campagnes actives</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {campaigns.filter(c => c.status === 'active').length}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Budget total</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {campaigns.reduce((sum, c) => sum + c.total_budget, 0).toLocaleString()} F CFA
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Performance moyenne</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {campaigns.length > 0 ? (campaigns.reduce((sum, c) => sum + parseFloat(c.stats.ctr), 0) / campaigns.length).toFixed(1) : '0'}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Rechercher des produits..."
                    className="pl-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes catégories</SelectItem>
                    <SelectItem value="mode">Mode</SelectItem>
                    <SelectItem value="technologie">Technologie</SelectItem>
                    <SelectItem value="maison">Maison</SelectItem>
                    <SelectItem value="beauté">Beauté</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => {
                const productCampaigns = campaigns.filter(c => c.product?.id === product.id);
                const activeCampaign = productCampaigns.find(c => c.status === 'active');
                const totalSpent = productCampaigns.reduce((sum, c) => sum + parseFloat(c.stats.spent.replace(/[^\d]/g, '')), 0);

                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <ImageWithFallback
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                      {activeCampaign && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-100 text-green-800">
                            <Play className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{product.name}</h3>
                          <p className="text-lg font-bold text-blue-600">{product.price}</p>
                          <p className="text-xs text-gray-500">{product.category}</p>
                        </div>

                        {/* Performance Stats */}
                        {productCampaigns.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-gray-600">Campagnes</p>
                              <p className="font-semibold">{productCampaigns.length}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-gray-600">Dépensé</p>
                              <p className="font-semibold">{totalSpent.toLocaleString()} F CFA</p>
                            </div>
                          </div>
                        )}

                        {/* Quick Actions */}
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => {
                              setBoostingProduct(product);
                              setShowQuickBoostModal(true);
                            }}
                          >
                            <Zap className="h-4 w-4 mr-1" />
                            Booster
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsCreateModalOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Campagne
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Empty State */}
            {products.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun produit dans le catalogue</h3>
                  <p className="text-gray-600 mb-4">
                    Ajoutez vos premiers produits pour commencer à créer des campagnes publicitaires
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un produit
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="adsets" className="space-y-6">
            <Card>
              <CardContent className="p-8 text-center">
                <Grid3x3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ensembles de publicités</h3>
                <p className="text-gray-600 mb-4">
                  Gérez vos ensembles de publicités pour optimiser vos campagnes
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un ensemble
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ads" className="space-y-6">
            <Card>
              <CardContent className="p-8 text-center">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Publicités</h3>
                <p className="text-gray-600 mb-4">
                  Créez et gérez vos publicités individuelles
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une publicité
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audiences" className="space-y-6">
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Audiences</h3>
                <p className="text-gray-600 mb-4">
                  Créez et gérez vos audiences personnalisées
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une audience
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="creatives" className="space-y-6">
            <Card>
              <CardContent className="p-8 text-center">
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Créatifs</h3>
                <p className="text-gray-600 mb-4">
                  Gérez vos éléments créatifs et variations
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau créatif
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}