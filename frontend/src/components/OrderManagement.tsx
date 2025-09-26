import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import {
  Search,
  ShoppingCart,
  Eye,
  MoreHorizontal,
  Filter,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  Phone,
  Mail,
  BarChart3
} from "lucide-react";

interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: 'En attente' | 'Confirmée' | 'En préparation' | 'Expédiée' | 'Livrée' | 'Annulée';
  totalAmount: string;
  orderDate: string;
  deliveryAddress: string;
  storeName: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  price: string;
  total: string;
}

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);

  const [activeTab, setActiveTab] = useState("orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Tous les statuts");
  const [selectedStore, setSelectedStore] = useState("Toutes les boutiques");

  const handleOrderAction = (orderId: number, action: 'view' | 'update' | 'cancel') => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    switch (action) {
      case 'view':
        toast.info(`Consultation de la commande #${order.id}`);
        break;
      case 'update':
        toast.info(`Mise à jour du statut de la commande #${order.id}`);
        break;
      case 'cancel':
        if (window.confirm(`Êtes-vous sûr de vouloir annuler la commande #${order.id} ?`)) {
          toast.success(`Commande #${order.id} annulée`);
        }
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'En attente':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case 'Confirmée':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Confirmée</Badge>;
      case 'En préparation':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">En préparation</Badge>;
      case 'Expédiée':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Expédiée</Badge>;
      case 'Livrée':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Livrée
          </Badge>
        );
      case 'Annulée':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Annulée
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.id.toString().includes(searchQuery);
    const matchesStatus = selectedStatus === "Tous les statuts" || order.status === selectedStatus;
    const matchesStore = selectedStore === "Toutes les boutiques" || order.storeName === selectedStore;

    return matchesSearch && matchesStatus && matchesStore;
  });

  // Calcul des métriques
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(order => order.status === 'Livrée').length;

  // Calcul sécurisé du revenu total
  const totalRevenue = orders.reduce((sum, order) => {
    try {
      const amount = parseInt(order.totalAmount.replace(/[^\d]/g, '')) || 0;
      return sum + amount;
    } catch (error) {
      console.warn(`Erreur de parsing du montant: ${order.totalAmount}`);
      return sum;
    }
  }, 0);

  // Métriques par statut
  const pendingOrders = orders.filter(order => order.status === 'En attente').length;
  const shippedOrders = orders.filter(order => order.status === 'Expédiée').length;
  const deliveredOrdersCount = orders.filter(order => order.status === 'Livrée').length;
  const preparingOrders = orders.filter(order => order.status === 'En préparation').length;
  const cancelledOrders = orders.filter(order => order.status === 'Annulée').length;

  // Formatage des montants
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' F CFA';
  };

  const renderOrdersList = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-somba-text-light" />
          <Input
            type="text"
            placeholder="Rechercher une commande..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-somba-light border-somba-primary/20"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48 bg-somba-light border-somba-primary/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Tous les statuts">Tous les statuts</SelectItem>
            <SelectItem value="En attente">En attente</SelectItem>
            <SelectItem value="Confirmée">Confirmée</SelectItem>
            <SelectItem value="En préparation">En préparation</SelectItem>
            <SelectItem value="Expédiée">Expédiée</SelectItem>
            <SelectItem value="Livrée">Livrée</SelectItem>
            <SelectItem value="Annulée">Annulée</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedStore} onValueChange={setSelectedStore}>
          <SelectTrigger className="w-48 bg-somba-light border-somba-primary/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Toutes les boutiques">Toutes les boutiques</SelectItem>
            <SelectItem value="Zoo Market">Zoo Market</SelectItem>
            <SelectItem value="SuperSonic">SuperSonic</SelectItem>
            <SelectItem value="ETS EAK">ETS EAK</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <Card>
        <CardContent className="p-0">
          <div className="space-y-0">
            {filteredOrders.map((order, index) => (
              <div
                key={order.id}
                className={`p-6 hover:bg-somba-light/50 transition-colors ${
                  index !== filteredOrders.length - 1 ? 'border-b border-somba-primary/10' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="h-5 w-5 text-somba-primary" />
                      <span className="font-semibold text-somba-primary">#{order.id}</span>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-somba-primary">{order.totalAmount}</p>
                    <p className="text-sm text-somba-text-light">{order.orderDate}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-somba-text-light">Client</p>
                    <p className="font-medium text-somba-primary">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-somba-text-light">Email</p>
                    <p className="font-medium text-somba-primary">{order.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-somba-text-light">Téléphone</p>
                    <p className="font-medium text-somba-primary">{order.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-somba-text-light">Boutique</p>
                    <p className="font-medium text-somba-primary">{order.storeName}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-somba-text-light">
                    <MapPin className="h-4 w-4" />
                    <span>{order.deliveryAddress}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
                      onClick={() => handleOrderAction(order.id, 'view')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    <Button
                      size="sm"
                      className="bg-somba-accent hover:bg-somba-accent/90"
                      onClick={() => handleOrderAction(order.id, 'update')}
                    >
                      Modifier
                    </Button>
                    {order.status !== 'Annulée' && order.status !== 'Livrée' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleOrderAction(order.id, 'cancel')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Annuler
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-12 w-12 text-somba-text-light mx-auto mb-4" />
            <h3 className="text-lg font-medium text-somba-primary mb-2">Aucune commande trouvée</h3>
            <p className="text-somba-text-light mb-4">
              Aucune commande ne correspond aux critères de recherche.
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("Tous les statuts");
                setSelectedStore("Toutes les boutiques");
              }}
              className="bg-somba-accent hover:bg-somba-accent/90"
            >
              Réinitialiser les filtres
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderAnalytics = () => {
    // Calcul sécurisé des statistiques par statut
    const calculateRevenue = (statusFilter: (order: Order) => boolean) => {
      return orders
        .filter(statusFilter)
        .reduce((sum, order) => {
          try {
            const amount = parseInt(order.totalAmount.replace(/[^\d]/g, '')) || 0;
            return sum + amount;
          } catch (error) {
            console.warn(`Erreur de parsing du montant: ${order.totalAmount}`);
            return sum;
          }
        }, 0);
    };

    const deliveredRevenue = calculateRevenue(order => order.status === 'Livrée');
    const inProgressRevenue = calculateRevenue(order =>
      order.status === 'En préparation' || order.status === 'Expédiée'
    );
    const cancelledRevenue = calculateRevenue(order => order.status === 'Annulée');

    const inProgressCount = preparingOrders + shippedOrders;
    const cancelledCount = cancelledOrders;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statistiques des commandes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-somba-primary">Statistiques des commandes</CardTitle>
            <p className="text-sm text-somba-text-light">Répartition par statut</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg bg-green-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-somba-primary">Commandes livrées</p>
                    <p className="text-sm text-somba-text-light">Ce mois</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-somba-primary text-lg">{deliveredOrdersCount}</p>
                  <p className="text-sm text-green-600">{totalOrders > 0 ? Math.round((deliveredOrdersCount / totalOrders) * 100) : 0}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg bg-blue-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-somba-primary">En cours</p>
                    <p className="text-sm text-somba-text-light">Commandes actives</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-somba-primary text-lg">{inProgressCount}</p>
                  <p className="text-sm text-blue-600">{totalOrders > 0 ? Math.round((inProgressCount / totalOrders) * 100) : 0}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg bg-red-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-somba-primary">Annulées</p>
                    <p className="text-sm text-somba-text-light">Ce mois</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-somba-primary text-lg">{cancelledCount}</p>
                  <p className="text-sm text-red-600">{totalOrders > 0 ? Math.round((cancelledCount / totalOrders) * 100) : 0}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenus par statut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-somba-primary">Revenus par statut</CardTitle>
            <p className="text-sm text-somba-text-light">Chiffre d'affaires par catégorie</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg bg-green-50">
                <div>
                  <p className="font-semibold text-somba-primary">Livrées</p>
                  <p className="text-sm text-somba-text-light">{deliveredOrdersCount} commandes</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-somba-primary">{formatAmount(deliveredRevenue)}</p>
                  <p className="text-sm text-green-600">{totalRevenue > 0 ? Math.round((deliveredRevenue / totalRevenue) * 100) : 0}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg bg-blue-50">
                <div>
                  <p className="font-semibold text-somba-primary">En cours</p>
                  <p className="text-sm text-somba-text-light">{inProgressCount} commandes</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-somba-primary">{formatAmount(inProgressRevenue)}</p>
                  <p className="text-sm text-blue-600">{totalRevenue > 0 ? Math.round((inProgressRevenue / totalRevenue) * 100) : 0}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg bg-red-50">
                <div>
                  <p className="font-semibold text-somba-primary">Annulées</p>
                  <p className="text-sm text-somba-text-light">{cancelledCount} commandes</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-somba-primary">{formatAmount(cancelledRevenue)}</p>
                  <p className="text-sm text-red-600">{totalRevenue > 0 ? Math.round((cancelledRevenue / totalRevenue) * 100) : 0}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Graphique des commandes par jour */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-somba-primary">Évolution des commandes</CardTitle>
            <p className="text-sm text-somba-text-light">Commandes quotidiennes des 7 derniers jours</p>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <Package className="h-12 w-12 text-somba-text-light mx-auto mb-4" />
                <p className="text-somba-text-light">Graphique d'évolution des commandes</p>
                <p className="text-sm text-somba-text-light mt-2">Affichera les tendances quotidiennes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-somba-primary">Gestion des commandes</h1>
          <p className="text-somba-text-light">Suivez et gérez toutes vos commandes clients</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-somba-text-light">Total commandes</p>
                <p className="text-2xl font-semibold text-somba-primary">{totalOrders}</p>
                <p className="text-sm text-blue-600">+12% ce mois</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-somba-text-light">Commandes livrées</p>
                <p className="text-2xl font-semibold text-somba-primary">{deliveredOrders}</p>
                <p className="text-sm text-green-600">{totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0}% de taux de livraison</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-somba-text-light">Revenus total</p>
                <p className="text-2xl font-semibold text-somba-primary">{formatAmount(totalRevenue)}</p>
                <p className="text-sm text-green-600">+18% ce mois</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Nouvelles métriques par statut */}
        <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-somba-text-light">Commandes en attente</p>
                <p className="text-2xl font-semibold text-somba-primary">{pendingOrders}</p>
                <p className="text-sm text-yellow-600">À traiter</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-somba-text-light">Commandes expédiées</p>
                <p className="text-2xl font-semibold text-somba-primary">{shippedOrders}</p>
                <p className="text-sm text-blue-600">En livraison</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-somba-text-light">Commandes livrées</p>
                <p className="text-2xl font-semibold text-somba-primary">{deliveredOrdersCount}</p>
                <p className="text-sm text-green-600">Terminées</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-somba-text-light">Commandes en préparation</p>
                <p className="text-2xl font-semibold text-somba-primary">{preparingOrders}</p>
                <p className="text-sm text-orange-600">En cours</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-somba-text-light">Commandes annulées</p>
                <p className="text-2xl font-semibold text-somba-primary">{cancelledOrders}</p>
                <p className="text-sm text-red-600">Annulées</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white p-1 border border-somba-primary/10">
          <TabsTrigger
            value="orders"
            className="data-[state=active]:bg-somba-accent data-[state=active]:text-white"
          >
            Liste des commandes
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-somba-accent data-[state=active]:text-white"
          >
            Analytics commandes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          {renderOrdersList()}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {renderAnalytics()}
        </TabsContent>
      </Tabs>
    </div>
  );
}