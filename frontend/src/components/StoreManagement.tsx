import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  Eye,
  Edit,
  Trash2,
  Save,
  Bell,
  TrendingUp,
  AlertTriangle,
  Package,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Filter,
  Search,
  MoreHorizontal,
  Settings2,
  ShoppingCart,
  DollarSign,
  Users,
  Star,
  Zap
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useProducts } from "./ProductsContext";
import { useStores } from "./StoresContext";
import { ProductModal } from "./ProductModal";
import { FirstProductModal } from "./FirstProductModal";

interface Store {
  id: number;
  name: string;
  category: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  isActive: boolean;
  image: string;
  sellerId: number;
  stats: {
    totalProducts: number;
    totalSales: number;
    monthlyRevenue: number;
  };
}

interface Product {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  category: string;
  image: string;
  boutique: string;
  isOnSale?: boolean;
  rating: number;
  reviews: number;
  inStock?: boolean;
  sizes?: string[];
  colors?: string[];
  specifications?: { [key: string]: string };
  images?: string[];
  sellerId: number;
  storeId?: number;
  region?: string;
  channel?: string;
  stats?: {
    totalSold: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface StoreManagementProps {
  store: Store;
  onBack: () => void;
  onSave: (updatedStore: Store) => void;
}


export function StoreManagement({ store, onBack, onSave }: StoreManagementProps) {
    const { getProductsByStore, getProductsBySeller, addProduct, updateProduct, deleteProduct, refreshProducts } = useProducts();
    const { refreshShops } = useStores();
    const [activeTab, setActiveTab] = useState("info");
    const [editedStore, setEditedStore] = useState<Store>(store);
    const products = getProductsByStore(store.name);
    const sellerProducts = getProductsBySeller(store.sellerId);
    const isFirstProduct = sellerProducts.length === 0;

    const [storeSettings, setStoreSettings] = useState({
      orderNotifications: true,
      autoStockManagement: false,
      publicAnalytics: false
    });
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);

    // Enhanced inventory management state
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [isBulkMode, setIsBulkMode] = useState(false);

  const handleSave = () => {
    onSave(editedStore);
    toast.success('Boutique mise à jour avec succès');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'En stock':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">En stock</Badge>;
      case 'Stock faible':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Stock faible</Badge>;
      case 'Rupture':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rupture</Badge>;
      case 'Masqué':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Masqué</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleProductAction = (productId: number, action: 'hide' | 'edit' | 'delete') => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    switch (action) {
      case 'hide':
        toast.success(`Produit "${product.name}" masqué`);
        break;
      case 'edit':
        toast.info(`Modification du produit "${product.name}"`);
        break;
      case 'delete':
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${product.name}" ?`)) {
          toast.success(`Produit "${product.name}" supprimé`);
        }
        break;
    }
  };

  const handleDeleteStore = () => {
    if (window.confirm(`Êtes-vous vraiment sûr de vouloir supprimer définitivement cette boutique et tous ses produits ?`)) {
      toast.success('Boutique supprimée avec succès');
      onBack();
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product && window.confirm(`Êtes-vous sûr de vouloir supprimer "${product.name}" ?`)) {
      deleteProduct(productId);
      toast.success(`Produit "${product.name}" supprimé avec succès`);
    }
  };

  const handleSaveProduct = async (productData: any) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        toast.success(`Produit "${productData.name}" modifié avec succès`);
      } else {
        await addProduct({ ...productData, storeId: store.id, sellerId: store.sellerId });
        // Refresh products and shops to ensure the new product appears and shop stats are updated
        await refreshProducts();
        await refreshShops();
        toast.success(`Produit "${productData.name}" ajouté avec succès`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Erreur lors de la sauvegarde du produit');
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  // Enhanced inventory management functions
  const getFilteredProducts = () => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" ||
                           (statusFilter === "in-stock" && product.inStock) ||
                           (statusFilter === "out-of-stock" && !product.inStock) ||
                           (statusFilter === "low-stock" && product.inStock && (product.stats?.totalSold || 0) < 5);
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  };

  const handleSelectProduct = (productId: number, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleSelectAllProducts = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(getFilteredProducts().map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) return;

    const productNames = selectedProducts.map(id => products.find(p => p.id === id)?.name).join(', ');
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedProducts.length} produit(s) : ${productNames} ?`)) {
      selectedProducts.forEach(productId => deleteProduct(productId));
      setSelectedProducts([]);
      setIsBulkMode(false);
      toast.success(`${selectedProducts.length} produit(s) supprimé(s) avec succès`);
    }
  };

  const handleBulkStatusChange = (newStatus: boolean) => {
    selectedProducts.forEach(productId => {
      const product = products.find(p => p.id === productId);
      if (product) {
        updateProduct(productId, { ...product, inStock: newStatus });
      }
    });
    setSelectedProducts([]);
    toast.success(`${selectedProducts.length} produit(s) ${newStatus ? 'mis en stock' : 'retiré du stock'}`);
  };

  const getStockStatus = (product: any) => {
    if (!product.inStock) return { status: 'out-of-stock', label: 'Rupture', color: 'red' };
    if ((product.stats?.totalSold || 0) < 5) return { status: 'low-stock', label: 'Stock faible', color: 'orange' };
    return { status: 'in-stock', label: 'En stock', color: 'green' };
  };

  const getStockLevel = (product: any) => {
    // Simulate stock levels based on sales data
    const sold = product.stats?.totalSold || 0;
    const estimatedStock = Math.max(0, 50 - sold); // Assume initial stock of 50
    return estimatedStock;
  };

  const renderStoreInfo = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Store Name */}
          <div className="space-y-2">
            <Label>Nom de la boutique</Label>
            <Input
              value={editedStore.name}
              onChange={(e) => setEditedStore({ ...editedStore, name: e.target.value })}
              placeholder="Nom de votre boutique"
              className="bg-somba-light border-somba-primary/20"
            />
          </div>

          {/* Store Type */}
          <div className="space-y-2">
            <Label>Type de boutique</Label>
            <Select 
              value={editedStore.category} 
              onValueChange={(value) => setEditedStore({ ...editedStore, category: value })}
            >
              <SelectTrigger className="bg-somba-light border-somba-primary/20">
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Électroménager">Électroménager</SelectItem>
                <SelectItem value="Électronique">Électronique</SelectItem>
                <SelectItem value="Mode">Mode</SelectItem>
                <SelectItem value="Gaming">Gaming</SelectItem>
                <SelectItem value="Sport">Sport</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={editedStore.description}
              onChange={(e) => setEditedStore({ ...editedStore, description: e.target.value })}
              placeholder="Spécialisé dans les appareils électroménagers de qualité"
              className="bg-somba-light border-somba-primary/20 min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Image */}
        <Card>
          <CardHeader>
            <CardTitle className="text-somba-primary">Image de la boutique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="aspect-video overflow-hidden rounded-lg border border-somba-primary/20">
                <ImageWithFallback
                  src={editedStore.image}
                  alt={editedStore.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="store-image-upload" className="cursor-pointer">
                  <Button
                    variant="outline"
                    className="w-full border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
                    asChild
                  >
                    <span>
                      <Camera className="h-4 w-4 mr-2" />
                      Changer l'image
                    </span>
                  </Button>
                </Label>
                <input
                  id="store-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const result = e.target?.result as string;
                        setEditedStore({ ...editedStore, image: result });
                        toast.success('Image mise à jour avec succès');
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-somba-primary">Statut de la boutique</CardTitle>
            <CardDescription>Contrôlez la visibilité de votre boutique</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {store.isActive ? "Boutique activée" : "Boutique désactivée"}
                </p>
                <p className="text-xs text-somba-text-light">
                  {store.isActive
                    ? "Vos produits sont visibles par les clients"
                    : "Vos produits ne sont pas visibles par les clients"
                  }
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className={store.isActive ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                  {store.isActive ? "Active" : "Inactive"}
                </Badge>
                <Switch
                  checked={editedStore.isActive}
                  onCheckedChange={(checked) => setEditedStore({ ...editedStore, isActive: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderProductManagement = () => {
    const filteredProducts = getFilteredProducts();
    const lowStockProducts = products.filter(p => getStockLevel(p) < 10 && getStockLevel(p) > 0);
    const outOfStockProducts = products.filter(p => !p.inStock || getStockLevel(p) === 0);

    return (
      <div className="space-y-6">

        {/* Header with Stats */}
        <div className="bg-gradient-to-r from-somba-primary to-somba-accent p-6 rounded-xl text-white">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-2xl font-bold">Gestion des produits</h3>
              <p className="text-somba-light/90">Gérez l'inventaire et le stock de votre boutique</p>
            </div>
            <Button onClick={handleAddProduct} className="bg-white text-somba-primary hover:bg-gray-100 font-semibold px-6 py-3">
              <Plus className="h-5 w-5 mr-2" />
              Nouveau produit
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-somba-light/70">Total produits</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
                <Package className="h-8 w-8 text-somba-light/60" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-somba-light/70">En stock</p>
                  <p className="text-2xl font-bold">{products.filter(p => p.inStock).length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-300" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-somba-light/70">Stock faible</p>
                  <p className="text-2xl font-bold">{lowStockProducts.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-300" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-somba-light/70">Rupture</p>
                  <p className="text-2xl font-bold">{outOfStockProducts.length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Stock Alerts */}
        {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
          <div className="space-y-3">
            {lowStockProducts.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-orange-800">Stock faible détecté</p>
                      <p className="text-sm text-orange-700">
                        {lowStockProducts.length} produit(s) ont un stock inférieur à 10 unités
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="border-orange-300 text-orange-700">
                      Voir détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {outOfStockProducts.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-800">Rupture de stock</p>
                      <p className="text-sm text-red-700">
                        {outOfStockProducts.length} produit(s) sont en rupture de stock
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="border-red-300 text-red-700">
                      Réapprovisionner
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-lg border border-somba-primary/10">
          <div className="flex items-center space-x-4">
            <Button
              variant={isBulkMode ? "default" : "outline"}
              onClick={() => setIsBulkMode(!isBulkMode)}
              className={isBulkMode ? "bg-somba-accent" : "border-somba-primary text-somba-primary"}
              size="sm"
            >
              {isBulkMode ? 'Quitter sélection' : 'Sélection multiple'}
            </Button>
            <span className="text-sm text-somba-text-light">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} affiché{filteredProducts.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-somba-text-light" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-48 border-somba-primary/20"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 border-somba-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="in-stock">En stock</SelectItem>
                <SelectItem value="low-stock">Stock faible</SelectItem>
                <SelectItem value="out-of-stock">Rupture</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40 border-somba-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {Array.from(new Set(products.map(p => p.category))).map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {isBulkMode && selectedProducts.length > 0 && (
          <Card className="border-somba-accent/50 bg-somba-accent/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="font-semibold text-somba-primary">
                    {selectedProducts.length} produit{selectedProducts.length > 1 ? 's' : ''} sélectionné{selectedProducts.length > 1 ? 's' : ''}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSelectAllProducts(selectedProducts.length !== filteredProducts.length)}
                    className="text-somba-primary border-somba-primary"
                  >
                    {selectedProducts.length === filteredProducts.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusChange(true)}
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mettre en stock
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusChange(false)}
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Retirer du stock
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkDelete}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsBulkMode(false);
                      setSelectedProducts([]);
                    }}
                    className="text-gray-500"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product);
            const stockLevel = getStockLevel(product);

            return (
              <Card key={product.id} className={`group overflow-hidden hover:shadow-xl transition-all duration-300 border-l-4 ${
                stockStatus.color === 'red' ? 'border-l-red-500' :
                stockStatus.color === 'orange' ? 'border-l-orange-500' :
                'border-l-green-500'
              } ${selectedProducts.includes(product.id) ? 'ring-2 ring-somba-accent shadow-somba-accent/20' : ''}`}>

                {/* Bulk Selection Checkbox */}
                {isBulkMode && (
                  <div className="absolute top-3 left-3 z-10">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                      className="w-4 h-4 text-somba-accent border-gray-300 rounded focus:ring-somba-accent"
                    />
                  </div>
                )}

                {/* Product Image */}
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Stock Status Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className={`${
                      stockStatus.color === 'red' ? 'bg-red-500 text-white' :
                      stockStatus.color === 'orange' ? 'bg-orange-500 text-white' :
                      'bg-green-500 text-white'
                    } shadow-lg`}>
                      {stockStatus.label}
                    </Badge>
                  </div>

                  {/* Quick Actions Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white text-somba-primary"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white text-somba-primary"
                        onClick={() => toast.info(`Produit "${product.name}" masqué`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-4">
                  {/* Product Info */}
                  <div className="mb-3">
                    <h3 className="font-bold text-lg text-somba-primary mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-somba-text-light">{product.category}</p>
                  </div>

                  {/* Price and Rating */}
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xl font-bold text-somba-primary">{product.price}</p>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-somba-text-light">
                        {product.rating} ({product.reviews})
                      </span>
                    </div>
                  </div>

                  {/* Stock Information */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-somba-text-light">Stock disponible</span>
                      <span className={`font-semibold ${
                        stockLevel === 0 ? 'text-red-600' :
                        stockLevel < 10 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {stockLevel} unités
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          stockLevel === 0 ? 'bg-red-500' :
                          stockLevel < 10 ? 'bg-orange-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((stockLevel / 50) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-center">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700 font-medium">Vendus</p>
                      <p className="text-lg font-bold text-blue-800">{product.stats?.totalSold || 0}</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-700 font-medium">Revenus</p>
                      <p className="text-sm font-bold text-green-800">
                        {((product.stats?.totalSold || 0) * 25000).toLocaleString()} F
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 borUIder-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
                      onClick={() => handleEditProduct(product)}
                    >
                      <Settings2 className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <Card className="border-2 border-dashed border-somba-primary/20">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-somba-text-light mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-somba-primary mb-2">
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Aucun produit trouvé'
                  : 'Aucun produit dans votre boutique'
                }
              </h3>
              <p className="text-somba-text-light mb-6">
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Commencez par ajouter votre premier produit'
                }
              </p>
              {(!searchQuery && statusFilter === 'all' && categoryFilter === 'all') && (
                <Button onClick={handleAddProduct} className="bg-somba-accent hover:bg-somba-accent/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un produit
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Paramètres de la boutique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notifications */}
          <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-somba-primary" />
              <div>
                <p className="font-medium text-somba-primary">Notifications commandes</p>
                <p className="text-sm text-somba-text-light">Recevoir des notifications pour les nouvelles commandes</p>
              </div>
            </div>
            <Switch
              checked={storeSettings.orderNotifications}
              onCheckedChange={(checked) => 
                setStoreSettings({ ...storeSettings, orderNotifications: checked })
              }
            />
          </div>

          {/* Auto Stock Management */}
          <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg">
            <div className="flex items-center space-x-3">
              <Package className="h-5 w-5 text-somba-primary" />
              <div>
                <p className="font-medium text-somba-primary">Gestion automatique du stock</p>
                <p className="text-sm text-somba-text-light">Masquer automatiquement les produits en rupture</p>
              </div>
            </div>
            <Switch
              checked={storeSettings.autoStockManagement}
              onCheckedChange={(checked) => 
                setStoreSettings({ ...storeSettings, autoStockManagement: checked })
              }
            />
          </div>

          {/* Public Analytics */}
          <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-5 w-5 text-somba-primary" />
              <div>
                <p className="font-medium text-somba-primary">Analytics publiques</p>
                <p className="text-sm text-somba-text-light">Permettre aux clients de voir les statistiques de vente</p>
              </div>
            </div>
            <Switch
              checked={storeSettings.publicAnalytics}
              onCheckedChange={(checked) => 
                setStoreSettings({ ...storeSettings, publicAnalytics: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-600">Zone de danger</CardTitle>
          </div>
          <CardDescription>
            Supprimer définitivement cette boutique et tous ses produits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive"
            onClick={handleDeleteStore}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer la boutique
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-somba-light">
      {/* Header */}
      <div className="bg-white border-b border-somba-primary/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-somba-primary">{store.name}</h1>
                <p className="text-sm text-somba-text-light">Gérez les informations et produits de votre boutique</p>
              </div>
            </div>
            <Button onClick={handleSave} className="bg-somba-accent hover:bg-somba-accent/90">
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 border border-somba-primary/10">
            <TabsTrigger 
              value="info" 
              className="data-[state=active]:bg-somba-accent data-[state=active]:text-white"
            >
              Informations boutique
            </TabsTrigger>
            <TabsTrigger 
              value="products"
              className="data-[state=active]:bg-somba-accent data-[state=active]:text-white"
            >
              Gestion produits
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="data-[state=active]:bg-somba-accent data-[state=active]:text-white"
            >
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            {renderStoreInfo()}
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            {renderProductManagement()}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {renderSettings()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Modal */}
      {isFirstProduct && !editingProduct ? (
        <FirstProductModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          sellerId={store.sellerId}
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
          sellerId={store.sellerId}
        />
      )}
    </div>
  );
}