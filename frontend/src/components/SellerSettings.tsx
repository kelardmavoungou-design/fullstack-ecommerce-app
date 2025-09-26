import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import {
  User,
  Settings,
  CreditCard,
  Truck,
  Shield,
  Bell,
  FileText,
  HelpCircle,
  Camera,
  Eye,
  EyeOff,
  MapPin,
  Phone,
  Mail,
  Building,
  Banknote,
  AlertTriangle,
  Check,
  X,
  Globe,
  Lock,
  Smartphone,
  MessageSquare,
  Loader2
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import api from "../services/api";

interface SellerProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  avatar: string;
  businessName: string;
  businessType: string;
  businessRegistration: string;
  taxId: string;
  verificationStatus: 'verified' | 'pending' | 'rejected';
}

interface NotificationSettings {
  emailOrders: boolean;
  emailMarketing: boolean;
  emailSecurity: boolean;
  smsOrders: boolean;
  smsMarketing: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
}

interface PaymentSettings {
  mobileMoney: boolean;
  airtelMoney: boolean;
  cash: boolean;
  bankAccount: string;
  commissionRate: string;
  paymentFrequency: string;
}

interface ShippingSettings {
  freeShippingThreshold: string;
  standardShippingPrice: string;
  expressShippingPrice: string;
  deliveryZones: string[];
  processingTime: string;
  returnPolicy: string;
}

export function SellerSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<SellerProfile>({
    firstName: " ",
    lastName: "",
    email: " ",
    phone: " ",
    address: " ",
    city: " ",
    country: " ",
    avatar: " ",
    businessName: " ",
    businessType: " ",
    businessRegistration: " ",
    taxId: " ",
    verificationStatus: "verified"
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailOrders: true,
    emailMarketing: false,
    emailSecurity: true,
    smsOrders: true,
    smsMarketing: false,
    pushNotifications: true,
    weeklyReports: true,
    monthlyReports: true
  });

  const [payments, setPayments] = useState<PaymentSettings>({
    mobileMoney: true,
    airtelMoney: true,
    cash: true,
    bankAccount: " ",
    commissionRate: "3.5%",
    paymentFrequency: "weekly"
  });

  const [shipping, setShipping] = useState<ShippingSettings>({
    freeShippingThreshold: "50000",
    standardShippingPrice: "2000",
    expressShippingPrice: "5000",
    deliveryZones: ["Abidjan", "Bouaké", "San-Pédro"],
    processingTime: "1-2 jours",
    returnPolicy: "14 jours"
  });

  // Load seller profile on component mount
  useEffect(() => {
    const loadSellerProfile = async () => {
      try {
        const response = await api.get('/seller/profile');
        const profileData = response.data.profile;

        setProfile({
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
          address: profileData.address || "",
          city: profileData.city || "",
          country: profileData.country || "Côte d'Ivoire",
          avatar: profileData.avatar || "",
          businessName: profileData.businessName || "",
          businessType: profileData.businessType || "",
          businessRegistration: profileData.businessRegistration || "",
          taxId: profileData.taxId || "",
          verificationStatus: profileData.verificationStatus || "verified"
        });
      } catch (error) {
        console.error('Error loading seller profile:', error);
        toast.error("Erreur lors du chargement du profil");
      } finally {
        setLoading(false);
      }
    };

    loadSellerProfile();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/seller/profile', {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        country: profile.country,
        businessName: profile.businessName,
        businessType: profile.businessType,
        businessRegistration: profile.businessRegistration,
        taxId: profile.taxId
      });
      toast.success("Profil mis à jour avec succès");
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error("Erreur lors de la sauvegarde du profil");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image valide");
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2MB");
      return;
    }

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        try {
          const response = await api.post('/seller/profile/avatar', {
            avatar: base64
          });

          // Update profile with new avatar URL
          setProfile(prev => ({
            ...prev,
            avatar: response.data.avatar
          }));

          toast.success("Photo de profil mise à jour avec succès");
        } catch (error) {
          console.error('Error uploading avatar:', error);
          toast.error("Erreur lors du téléchargement de la photo");
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error("Erreur lors du traitement de l'image");
    }
  };

  const handleSaveNotifications = () => {
    toast.success("Préférences de notification sauvegardées");
  };

  const handleSavePayments = () => {
    toast.success("Paramètres de paiement mis à jour");
  };

  const handleSaveShipping = () => {
    toast.success("Paramètres de livraison sauvegardés");
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    toast.success("Mot de passe modifié avec succès");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <Check className="h-3 w-3 mr-1" />
            Vérifié
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
            <AlertTriangle className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <X className="h-3 w-3 mr-1" />
            Rejeté
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const renderProfile = () => (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Informations personnelles</CardTitle>
          <CardDescription>Gérez vos informations de profil vendeur</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar} alt={profile.firstName} />
              <AvatarFallback className="bg-somba-accent text-white text-lg">
                {profile.firstName[0]}{profile.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button
                variant="outline"
                className="border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
                onClick={() => document.getElementById('avatar-input')?.click()}
              >
                <Camera className="h-4 w-4 mr-2" />
                Changer la photo
              </Button>
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <p className="text-sm text-somba-text-light mt-1">
                Formats acceptés : JPG, PNG. Taille max : 2MB
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Prénom</Label>
              <Input
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                className="bg-somba-light border-somba-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                className="bg-somba-light border-somba-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="bg-somba-light border-somba-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="bg-somba-light border-somba-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="bg-somba-light border-somba-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label>Pays</Label>
              <Select value={profile.country} onValueChange={(value) => setProfile({ ...profile, country: value })}>
                <SelectTrigger className="bg-somba-light border-somba-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Côte d'Ivoire">Côte d'Ivoire</SelectItem>
                  <SelectItem value="Ghana">Ghana</SelectItem>
                  <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                  <SelectItem value="Mali">Mali</SelectItem>
                  <SelectItem value="Sénégal">Sénégal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Adresse complète</Label>
            <Textarea
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="bg-somba-light border-somba-primary/20"
            />
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="bg-somba-accent hover:bg-somba-accent/90"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              "Sauvegarder les modifications"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary flex items-center justify-between">
            Informations d'entreprise
            {getVerificationBadge(profile.verificationStatus)}
          </CardTitle>
          <CardDescription>Informations légales de votre entreprise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Nom de l'entreprise</Label>
              <Input
                value={profile.businessName}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                className="bg-somba-light border-somba-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label>Type d'entreprise</Label>
              <Select value={profile.businessType} onValueChange={(value) => setProfile({ ...profile, businessType: value })}>
                <SelectTrigger className="bg-somba-light border-somba-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Société à responsabilité limitée">SARL</SelectItem>
                  <SelectItem value="Société anonyme">SA</SelectItem>
                  <SelectItem value="Entreprise individuelle">Entreprise individuelle</SelectItem>
                  <SelectItem value="Auto-entrepreneur">Auto-entrepreneur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Numéro d'enregistrement</Label>
              <Input
                value={profile.businessRegistration}
                onChange={(e) => setProfile({ ...profile, businessRegistration: e.target.value })}
                className="bg-somba-light border-somba-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label>Numéro fiscal</Label>
              <Input
                value={profile.taxId}
                onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
                className="bg-somba-light border-somba-primary/20"
              />
            </div>
          </div>

          {profile.verificationStatus !== 'verified' && (
            <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <p className="font-medium text-orange-800">Vérification requise</p>
              </div>
              <p className="text-sm text-orange-700 mb-3">
                Votre compte nécessite une vérification pour accéder à toutes les fonctionnalités.
              </p>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                <FileText className="h-4 w-4 mr-2" />
                Soumettre les documents
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Moyens de paiement</CardTitle>
          <CardDescription>Configurez les méthodes de paiement acceptées</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5 text-somba-primary" />
                <div>
                  <p className="font-medium text-somba-primary">Mobile Money</p>
                  <p className="text-sm text-somba-text-light">Orange Money, MTN Money</p>
                </div>
              </div>
              <Switch
                checked={payments.mobileMoney}
                onCheckedChange={(checked) => setPayments({ ...payments, mobileMoney: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5 text-somba-primary" />
                <div>
                  <p className="font-medium text-somba-primary">Airtel Money</p>
                  <p className="text-sm text-somba-text-light">Paiements via Airtel Money</p>
                </div>
              </div>
              <Switch
                checked={payments.airtelMoney}
                onCheckedChange={(checked) => setPayments({ ...payments, airtelMoney: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <Banknote className="h-5 w-5 text-somba-primary" />
                <div>
                  <p className="font-medium text-somba-primary">Paiement en espèces</p>
                  <p className="text-sm text-somba-text-light">Livraison contre remboursement</p>
                </div>
              </div>
              <Switch
                checked={payments.cash}
                onCheckedChange={(checked) => setPayments({ ...payments, cash: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Compte bancaire</CardTitle>
          <CardDescription>Compte pour recevoir vos paiements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Numéro de compte bancaire</Label>
            <Input
              value={payments.bankAccount}
              onChange={(e) => setPayments({ ...payments, bankAccount: e.target.value })}
              className="bg-somba-light border-somba-primary/20"
              placeholder="CI05 CI000 XXXX XXXX XXXX XXXX XX"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Taux de commission</Label>
              <Input
                value={payments.commissionRate}
                disabled
                className="bg-gray-100 border-somba-primary/20"
              />
              <p className="text-xs text-somba-text-light">
                Taux fixé par la plateforme
              </p>
            </div>
            <div className="space-y-2">
              <Label>Fréquence de paiement</Label>
              <Select value={payments.paymentFrequency} onValueChange={(value) => setPayments({ ...payments, paymentFrequency: value })}>
                <SelectTrigger className="bg-somba-light border-somba-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="biweekly">Bi-hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSavePayments} className="bg-somba-accent hover:bg-somba-accent/90">
            Sauvegarder les paramètres
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderShipping = () => (
    <div className="space-y-6">
      {/* Shipping Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Tarifs de livraison</CardTitle>
          <CardDescription>Configurez vos prix et zones de livraison</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Seuil livraison gratuite</Label>
              <Input
                value={shipping.freeShippingThreshold}
                onChange={(e) => setShipping({ ...shipping, freeShippingThreshold: e.target.value })}
                className="bg-somba-light border-somba-primary/20"
                placeholder="50000"
              />
              <p className="text-xs text-somba-text-light">En F CFA</p>
            </div>
            <div className="space-y-2">
              <Label>Livraison standard</Label>
              <Input
                value={shipping.standardShippingPrice}
                onChange={(e) => setShipping({ ...shipping, standardShippingPrice: e.target.value })}
                className="bg-somba-light border-somba-primary/20"
                placeholder="2000"
              />
              <p className="text-xs text-somba-text-light">En F CFA</p>
            </div>
            <div className="space-y-2">
              <Label>Livraison express</Label>
              <Input
                value={shipping.expressShippingPrice}
                onChange={(e) => setShipping({ ...shipping, expressShippingPrice: e.target.value })}
                className="bg-somba-light border-somba-primary/20"
                placeholder="5000"
              />
              <p className="text-xs text-somba-text-light">En F CFA</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Délai de traitement</Label>
              <Select value={shipping.processingTime} onValueChange={(value) => setShipping({ ...shipping, processingTime: value })}>
                <SelectTrigger className="bg-somba-light border-somba-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Même jour">Même jour</SelectItem>
                  <SelectItem value="1-2 jours">1-2 jours</SelectItem>
                  <SelectItem value="2-3 jours">2-3 jours</SelectItem>
                  <SelectItem value="3-5 jours">3-5 jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Politique de retour</Label>
              <Select value={shipping.returnPolicy} onValueChange={(value) => setShipping({ ...shipping, returnPolicy: value })}>
                <SelectTrigger className="bg-somba-light border-somba-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7 jours">7 jours</SelectItem>
                  <SelectItem value="14 jours">14 jours</SelectItem>
                  <SelectItem value="30 jours">30 jours</SelectItem>
                  <SelectItem value="Pas de retour">Pas de retour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Zones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Zones de livraison</CardTitle>
          <CardDescription>Gérez les zones où vous livrez vos produits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {shipping.deliveryZones.map((zone, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-somba-primary/10 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-somba-primary" />
                  <span className="font-medium text-somba-primary">{zone}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    const newZones = shipping.deliveryZones.filter((_, i) => i !== index);
                    setShipping({ ...shipping, deliveryZones: newZones });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            className="w-full border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
            onClick={() => {
              const newZone = prompt("Entrez le nom de la nouvelle zone de livraison:");
              if (newZone) {
                setShipping({ ...shipping, deliveryZones: [...shipping.deliveryZones, newZone] });
              }
            }}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Ajouter une zone
          </Button>

          <Button onClick={handleSaveShipping} className="bg-somba-accent hover:bg-somba-accent/90">
            Sauvegarder les paramètres
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Changer le mot de passe</CardTitle>
          <CardDescription>Assurez-vous d'utiliser un mot de passe fort</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mot de passe actuel</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-somba-light border-somba-primary/20 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nouveau mot de passe</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-somba-light border-somba-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label>Confirmer le nouveau mot de passe</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-somba-light border-somba-primary/20"
            />
          </div>

          <Button onClick={handleChangePassword} className="bg-somba-accent hover:bg-somba-accent/90">
            <Lock className="h-4 w-4 mr-2" />
            Changer le mot de passe
          </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Authentification à deux facteurs</CardTitle>
          <CardDescription>Renforcez la sécurité de votre compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-somba-primary" />
              <div>
                <p className="font-medium text-somba-primary">2FA via SMS</p>
                <p className="text-sm text-somba-text-light">
                  {twoFactorEnabled ? "Activé" : "Désactivé"} - Code de vérification par SMS
                </p>
              </div>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={(checked) => {
                setTwoFactorEnabled(checked);
                toast.success(checked ? "2FA activé" : "2FA désactivé");
              }}
            />
          </div>

          {twoFactorEnabled && (
            <div className="p-4 border border-green-200 rounded-lg bg-green-50">
              <div className="flex items-center space-x-2 mb-2">
                <Check className="h-5 w-5 text-green-600" />
                <p className="font-medium text-green-800">Authentification à deux facteurs activée</p>
              </div>
              <p className="text-sm text-green-700">
                Votre compte est maintenant protégé par l'authentification à deux facteurs.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Sessions actives</CardTitle>
          <CardDescription>Gérez vos connexions sur différents appareils</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-somba-primary/10 rounded-lg bg-green-50">
              <div>
                <p className="font-medium text-somba-primary">Session actuelle</p>
                <p className="text-sm text-somba-text-light">Chrome sur Windows • Abidjan, CI</p>
                <p className="text-xs text-somba-text-light">Connecté maintenant</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Actuel</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-somba-primary/10 rounded-lg">
              <div>
                <p className="font-medium text-somba-primary">Mobile Chrome</p>
                <p className="text-sm text-somba-text-light">Android • Abidjan, CI</p>
                <p className="text-xs text-somba-text-light">Il y a 2 heures</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Déconnecter
              </Button>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full border-red-300 text-red-600 hover:bg-red-50"
          >
            Déconnecter tous les autres appareils
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Notifications par email</CardTitle>
          <CardDescription>Configurez vos préférences de notifications email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-somba-primary" />
                <div>
                  <p className="font-medium text-somba-primary">Nouvelles commandes</p>
                  <p className="text-sm text-somba-text-light">Recevoir un email pour chaque nouvelle commande</p>
                </div>
              </div>
              <Switch
                checked={notifications.emailOrders}
                onCheckedChange={(checked) => setNotifications({ ...notifications, emailOrders: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-somba-primary" />
                <div>
                  <p className="font-medium text-somba-primary">Marketing et promotions</p>
                  <p className="text-sm text-somba-text-light">Conseils, nouveautés et offres spéciales</p>
                </div>
              </div>
              <Switch
                checked={notifications.emailMarketing}
                onCheckedChange={(checked) => setNotifications({ ...notifications, emailMarketing: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-somba-primary" />
                <div>
                  <p className="font-medium text-somba-primary">Alertes de sécurité</p>
                  <p className="text-sm text-somba-text-light">Connexions suspectes et modifications du compte</p>
                </div>
              </div>
              <Switch
                checked={notifications.emailSecurity}
                onCheckedChange={(checked) => setNotifications({ ...notifications, emailSecurity: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Notifications SMS</CardTitle>
          <CardDescription>Recevez des notifications importantes par SMS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-somba-primary" />
                <div>
                  <p className="font-medium text-somba-primary">Commandes urgentes</p>
                  <p className="text-sm text-somba-text-light">SMS pour les commandes importantes</p>
                </div>
              </div>
              <Switch
                checked={notifications.smsOrders}
                onCheckedChange={(checked) => setNotifications({ ...notifications, smsOrders: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-somba-primary" />
                <div>
                  <p className="font-medium text-somba-primary">Promotions SMS</p>
                  <p className="text-sm text-somba-text-light">Offres spéciales par SMS</p>
                </div>
              </div>
              <Switch
                checked={notifications.smsMarketing}
                onCheckedChange={(checked) => setNotifications({ ...notifications, smsMarketing: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Rapports automatiques</CardTitle>
          <CardDescription>Recevez des rapports de performance réguliers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-somba-primary" />
                <div>
                  <p className="font-medium text-somba-primary">Rapport hebdomadaire</p>
                  <p className="text-sm text-somba-text-light">Résumé des ventes et performances</p>
                </div>
              </div>
              <Switch
                checked={notifications.weeklyReports}
                onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-somba-primary/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-somba-primary" />
                <div>
                  <p className="font-medium text-somba-primary">Rapport mensuel</p>
                  <p className="text-sm text-somba-text-light">Analyse détaillée du mois</p>
                </div>
              </div>
              <Switch
                checked={notifications.monthlyReports}
                onCheckedChange={(checked) => setNotifications({ ...notifications, monthlyReports: checked })}
              />
            </div>
          </div>

          <Button onClick={handleSaveNotifications} className="bg-somba-accent hover:bg-somba-accent/90">
            Sauvegarder les préférences
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderSupport = () => (
    <div className="space-y-6">
      {/* Help Center */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Centre d'aide</CardTitle>
          <CardDescription>Trouvez rapidement les réponses à vos questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4 border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
            >
              <div className="text-left">
                <div className="flex items-center space-x-2 mb-1">
                  <HelpCircle className="h-5 w-5" />
                  <span className="font-medium">Guide du vendeur</span>
                </div>
                <p className="text-sm opacity-70">Comment bien vendre sur SOMBA</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto p-4 border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
            >
              <div className="text-left">
                <div className="flex items-center space-x-2 mb-1">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Paiements & Commissions</span>
                </div>
                <p className="text-sm opacity-70">Comprendre les frais et paiements</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto p-4 border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
            >
              <div className="text-left">
                <div className="flex items-center space-x-2 mb-1">
                  <Truck className="h-5 w-5" />
                  <span className="font-medium">Livraison & Logistique</span>
                </div>
                <p className="text-sm opacity-70">Optimiser vos livraisons</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto p-4 border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
            >
              <div className="text-left">
                <div className="flex items-center space-x-2 mb-1">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">Politiques & CGV</span>
                </div>
                <p className="text-sm opacity-70">Conditions générales de vente</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Contacter le support</CardTitle>
          <CardDescription>Notre équipe est là pour vous aider</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-somba-primary/10 rounded-lg">
              <Phone className="h-8 w-8 text-somba-accent mx-auto mb-2" />
              <p className="font-medium text-somba-primary">Téléphone</p>
              <p className="text-sm text-somba-text-light">+225 27 XX XX XX XX</p>
              <p className="text-xs text-somba-text-light mt-1">Lun-Ven 8h-18h</p>
            </div>

            <div className="text-center p-4 border border-somba-primary/10 rounded-lg">
              <Mail className="h-8 w-8 text-somba-accent mx-auto mb-2" />
              <p className="font-medium text-somba-primary">Email</p>
              <p className="text-sm text-somba-text-light">vendeurs@somba.ci</p>
              <p className="text-xs text-somba-text-light mt-1">Réponse sous 24h</p>
            </div>

            <div className="text-center p-4 border border-somba-primary/10 rounded-lg">
              <MessageSquare className="h-8 w-8 text-somba-accent mx-auto mb-2" />
              <p className="font-medium text-somba-primary">Chat en direct</p>
              <p className="text-sm text-somba-text-light">Support instantané</p>
              <Button size="sm" className="bg-somba-accent hover:bg-somba-accent/90 mt-2">
                Démarrer le chat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-somba-primary">Informations de la plateforme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-somba-text-light">Version de l'application</span>
            <span className="font-medium text-somba-primary">v2.1.0</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-somba-text-light">Dernière mise à jour</span>
            <span className="font-medium text-somba-primary">15 Janvier 2024</span>
          </div>
          <Separator />
          <div className="flex space-x-4">
            <Button variant="outline" size="sm" className="border-somba-primary text-somba-primary">
              <FileText className="h-4 w-4 mr-2" />
              Conditions d'utilisation
            </Button>
            <Button variant="outline" size="sm" className="border-somba-primary text-somba-primary">
              <Shield className="h-4 w-4 mr-2" />
              Politique de confidentialité
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-somba-primary">Paramètres du compte</h1>
          <p className="text-somba-text-light">Gérez vos préférences et paramètres de vendeur</p>
        </div>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-somba-primary" />
          <span className="ml-2 text-somba-primary">Chargement du profil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-somba-primary">Paramètres du compte</h1>
        <p className="text-somba-text-light">Gérez vos préférences et paramètres de vendeur</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white p-1 border border-somba-primary/10 flex-wrap h-auto">
          <TabsTrigger 
            value="profile" 
            className="data-[state=active]:bg-somba-accent data-[state=active]:text-white flex items-center space-x-2"
          >
            <User className="h-4 w-4" />
            <span>Profil</span>
          </TabsTrigger>
          <TabsTrigger 
            value="payments"
            className="data-[state=active]:bg-somba-accent data-[state=active]:text-white flex items-center space-x-2"
          >
            <CreditCard className="h-4 w-4" />
            <span>Paiements</span>
          </TabsTrigger>
          <TabsTrigger 
            value="shipping"
            className="data-[state=active]:bg-somba-accent data-[state=active]:text-white flex items-center space-x-2"
          >
            <Truck className="h-4 w-4" />
            <span>Livraison</span>
          </TabsTrigger>
          <TabsTrigger 
            value="security"
            className="data-[state=active]:bg-somba-accent data-[state=active]:text-white flex items-center space-x-2"
          >
            <Shield className="h-4 w-4" />
            <span>Sécurité</span>
          </TabsTrigger>
          <TabsTrigger 
            value="notifications"
            className="data-[state=active]:bg-somba-accent data-[state=active]:text-white flex items-center space-x-2"
          >
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger 
            value="support"
            className="data-[state=active]:bg-somba-accent data-[state=active]:text-white flex items-center space-x-2"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Support</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {renderProfile()}
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {renderPayments()}
        </TabsContent>

        <TabsContent value="shipping" className="space-y-6">
          {renderShipping()}
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {renderSecurity()}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          {renderNotifications()}
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          {renderSupport()}
        </TabsContent>
      </Tabs>
    </div>
  );
}