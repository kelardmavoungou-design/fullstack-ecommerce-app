import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { toast } from "sonner";
import { 
  Search,
  Users,
  Crown,
  TrendingUp,
  ShoppingCart,
  Eye,
  MessageSquare,
  MoreHorizontal,
  Filter,
  UserPlus,
  Star,
  MapPin,
  Calendar,
  Phone,
  Mail
} from "lucide-react";
import exampleImage from 'figma:asset/8c87039bc6e41b9619c818d5d7beb09ad161830a.png';
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: 'VIP' | 'Régulier' | 'Nouveau';
  avatar: string;
  lastPurchase: string;
  totalOrders: number;
  totalSpent: string;
  preferredStore: string;
  rating: number;
}


const storeRevenueData = [
  { name: "Zoo Market", clients: 2, revenue: " " },
  { name: "SuperSonic", clients: 2, revenue: "390 000 F " },
  { name: "ETS EAK", clients: 1, revenue: "180 000 F CFA" }
];

export function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeTab, setActiveTab] = useState("clients");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("Tous les types");
  const [selectedStore, setSelectedStore] = useState("Toutes les boutiques");

  const handleClientAction = (clientId: number, action: 'view' | 'contact' | 'more') => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    switch (action) {
      case 'view':
        toast.info(`Consultation du profil de ${client.name}`);
        break;
      case 'contact':
        toast.info(`Ouverture de la conversation avec ${client.name}`);
        break;
      case 'more':
        toast.info(`Menu d'options pour ${client.name}`);
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VIP':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Crown className="h-3 w-3 mr-1" />
            VIP
          </Badge>
        );
      case 'Régulier':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Régulier</Badge>;
      case 'Nouveau':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Nouveau</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          client.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "Tous les types" || client.status === selectedType;
    const matchesStore = selectedStore === "Toutes les boutiques" || client.preferredStore === selectedStore;

    return matchesSearch && matchesType && matchesStore;
  });

  const renderClientsList = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-somba-text-light" />
          <Input
            type="text"
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-somba-light border-somba-primary/20"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-48 bg-somba-light border-somba-primary/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Tous les types">Tous les types</SelectItem>
            <SelectItem value="VIP">VIP</SelectItem>
            <SelectItem value="Régulier">Régulier</SelectItem>
            <SelectItem value="Nouveau">Nouveau</SelectItem>
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

      {/* Clients List */}
      <Card>
        <CardContent className="p-0">
          <div className="space-y-0">
            {filteredClients.map((client, index) => (
              <div 
                key={client.id} 
                className={`flex items-center justify-between p-6 hover:bg-somba-light/50 transition-colors ${
                  index !== filteredClients.length - 1 ? 'border-b border-somba-primary/10' : ''
                }`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={client.avatar} alt={client.name} />
                    <AvatarFallback className="bg-somba-accent text-white">
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h4 className="font-semibold text-somba-primary">{client.name}</h4>
                      {getStatusBadge(client.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-somba-text-light">
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span>{client.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Client depuis {client.lastPurchase}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3" />
                        <span>{client.phone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{client.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <p className="font-semibold text-somba-primary">{client.totalOrders}</p>
                    <p className="text-xs text-somba-text-light">Commandes</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-somba-primary">{client.totalSpent}</p>
                    <p className="text-xs text-somba-text-light">Total dépensé</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-somba-primary">{client.preferredStore}</p>
                    <p className="text-xs text-somba-text-light">Boutique préférée</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
                      onClick={() => handleClientAction(client.id, 'view')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    <Button
                      size="sm"
                      className="bg-somba-accent hover:bg-somba-accent/90"
                      onClick={() => handleClientAction(client.id, 'contact')}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Contact
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-somba-primary/30 text-somba-primary hover:bg-somba-light"
                      onClick={() => handleClientAction(client.id, 'more')}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      {filteredClients.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-somba-text-light mx-auto mb-4" />
            <h3 className="text-lg font-medium text-somba-primary mb-2">Aucun client trouvé</h3>
            <p className="text-somba-text-light mb-4">
              Aucun client ne correspond aux critères de recherche.
            </p>
            <Button 
              onClick={() => {
                setSearchQuery("");
                setSelectedType("Tous les types");
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

  const renderAnalytics = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top 5 meilleurs clients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Top 5 meilleurs clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clients
              .sort((a, b) => parseInt(b.totalSpent.replace(/[^0-9]/g, '')) - parseInt(a.totalSpent.replace(/[^0-9]/g, '')))
              .slice(0, 5)
              .map((client, index) => (
                <div key={client.id} className="flex items-center justify-between p-3 border border-somba-primary/10 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-somba-accent text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={client.avatar} alt={client.name} />
                      <AvatarFallback className="bg-somba-accent text-white">
                        {client.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-somba-primary">{client.name}</p>
                      <p className="text-sm text-somba-text-light">{client.totalOrders} commandes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-somba-primary">{client.totalSpent}</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Clients par boutique */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Clients par boutique</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {storeRevenueData.map((store, index) => (
              <div key={store.name} className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg">
                <div>
                  <p className="font-semibold text-somba-primary">{store.name}</p>
                  <p className="text-sm text-somba-text-light">{store.clients} clients</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-somba-primary">{store.revenue}</p>
                  <p className="text-sm text-somba-text-light">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSegmentation = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Clients VIP */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary flex items-center">
            <Crown className="h-5 w-5 mr-2 text-yellow-600" />
            Clients VIP
          </CardTitle>
          <CardDescription>
            Clients avec plus de 20 commandes ou 400 000 F CFA dépensés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clients
              .filter(client => client.status === 'VIP')
              .map(client => (
                <div key={client.id} className="flex items-center space-x-3 p-2 border border-somba-primary/10 rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={client.avatar} alt={client.name} />
                    <AvatarFallback className="bg-somba-accent text-white text-sm">
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-somba-primary text-sm">{client.name}</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Clients réguliers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Clients réguliers</CardTitle>
          <CardDescription>
            Clients avec 5-20 commandes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clients
              .filter(client => client.status === 'Régulier')
              .map(client => (
                <div key={client.id} className="flex items-center space-x-3 p-2 border border-somba-primary/10 rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={client.avatar} alt={client.name} />
                    <AvatarFallback className="bg-somba-accent text-white text-sm">
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-somba-primary text-sm">{client.name}</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Nouveaux clients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Nouveaux clients</CardTitle>
          <CardDescription>
            Clients avec moins de 5 commandes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clients
              .filter(client => client.status === 'Nouveau')
              .map(client => (
                <div key={client.id} className="flex items-center space-x-3 p-2 border border-somba-primary/10 rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={client.avatar} alt={client.name} />
                    <AvatarFallback className="bg-somba-accent text-white text-sm">
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-somba-primary text-sm">{client.name}</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-somba-primary">Gestion des clients</h1>
          <p className="text-somba-text-light">Gérez vos relations clients et analysez leurs comportements</p>
        </div>

      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-somba-text-light">Total clients</p>
                <p className="text-2xl font-semibold text-somba-primary"></p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-somba-text-light">Clients VIP</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-semibold text-somba-primary"></p>
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">gamma</Badge>
                </div>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Crown className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-somba-text-light">Revenus total</p>
                <p className="text-2xl font-semibold text-somba-primary"> </p>
                <p className="text-xs text-somba-text-light">F CFA</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-somba-text-light">Panier moyen</p>
                <p className="text-2xl font-semibold text-somba-primary"> </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white p-1 border border-somba-primary/10">
          <TabsTrigger 
            value="clients" 
            className="data-[state=active]:bg-somba-accent data-[state=active]:text-white"
          >
            Liste des clients
          </TabsTrigger>
          <TabsTrigger 
            value="analytics"
            className="data-[state=active]:bg-somba-accent data-[state=active]:text-white"
          >
            Analytics clients
          </TabsTrigger>
          <TabsTrigger 
            value="segmentation"
            className="data-[state=active]:bg-somba-accent data-[state=active]:text-white"
          >
            Segmentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-6">
          {renderClientsList()}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {renderAnalytics()}
        </TabsContent>

        <TabsContent value="segmentation" className="space-y-6">
          {renderSegmentation()}
        </TabsContent>
      </Tabs>
    </div>
  );
}