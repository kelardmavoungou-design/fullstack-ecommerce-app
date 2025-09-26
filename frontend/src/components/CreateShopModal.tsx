import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Card, CardContent } from "./ui/card";
import { Upload, X, Store, MapPin, Phone, Mail, Globe } from "lucide-react";
import { toast } from "sonner";
import sellerService from "../services/sellerService";
import { getImageUrl } from "../services/api";

interface CreateShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShopCreated: () => void;
}

interface ShopFormData {
  name: string;
  description: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  category: string;
}

const shopCategories = [
  "Électronique",
  "Électroménager",
  "Mode & Accessoires",
  "Informatique",
  "Gaming",
  "Sport & Loisirs",
  "Maison & Jardin",
  "Beauté & Santé",
  "Alimentation",
  "Automobile",
  "Livres & Médias",
  "Autre"
];

export function CreateShopModal({ isOpen, onClose, onShopCreated }: CreateShopModalProps) {
  const [formData, setFormData] = useState<ShopFormData>({
    name: "",
    description: "",
    logo: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    category: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const handleInputChange = (field: keyof ShopFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For demo purposes, we'll use a placeholder URL
      // In a real app, you'd upload to a cloud storage service
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setFormData(prev => ({
          ...prev,
          logo: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Le nom de la boutique est requis");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("La description de la boutique est requise");
      return;
    }

    if (!formData.category) {
      toast.error("Veuillez sélectionner une catégorie");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await sellerService.createShop({
        name: formData.name,
        description: formData.description,
        logo: formData.logo
      });

      if (response.success) {
        toast.success("🎉 Boutique créée avec succès !");
        onShopCreated();
        onClose();

        // Reset form
        setFormData({
          name: "",
          description: "",
          logo: "",
          address: "",
          phone: "",
          email: "",
          website: "",
          category: ""
        });
        setLogoPreview("");
      } else {
        toast.error(response.error || "Erreur lors de la création de la boutique");
      }
    } catch (error) {
      toast.error("Erreur lors de la création de la boutique");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Store className="h-6 w-6 text-somba-accent" />
            Créer votre boutique
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations de votre boutique. Tous les champs marqués d'un * sont obligatoires.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload Section */}
          <Card>
            <CardContent className="p-6">
              <Label className="text-base font-semibold mb-4 block">Logo de la boutique</Label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                    {logoPreview ? (
                      <img
                        src={getImageUrl(logoPreview)}
                        alt="Logo preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Upload className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview("");
                        setFormData(prev => ({ ...prev, logo: "" }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="text-sm text-gray-600">
                        Cliquez pour télécharger une image ou glissez-déposez
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        PNG, JPG jusqu'à 5MB
                      </div>
                    </div>
                  </Label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardContent className="p-6">
              <Label className="text-base font-semibold mb-4 block">Informations de base</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shop-name">Nom de la boutique *</Label>
                  <Input
                    id="shop-name"
                    placeholder="Ex: Ma Super Boutique"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shop-category">Catégorie *</Label>
                  <select
                    id="shop-category"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-somba-accent"
                    value={formData.category}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    required
                  >
                    <option value="">Sélectionnez une catégorie</option>
                    {shopCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="shop-description">Description de la boutique *</Label>
                <Textarea
                  id="shop-description"
                  placeholder="Décrivez votre boutique, vos produits, vos services..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardContent className="p-6">
              <Label className="text-base font-semibold mb-4 block">Informations de contact</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shop-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email de contact
                  </Label>
                  <Input
                    id="shop-email"
                    type="email"
                    placeholder="contact@monsite.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shop-phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Téléphone
                  </Label>
                  <Input
                    id="shop-phone"
                    placeholder="+225 XX XX XX XX XX"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shop-website" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Site web (optionnel)
                  </Label>
                  <Input
                    id="shop-website"
                    placeholder="https://monsite.com"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shop-address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Adresse
                  </Label>
                  <Input
                    id="shop-address"
                    placeholder="Abidjan, Côte d'Ivoire"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-somba-accent hover:bg-somba-accent/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création en cours...
                </>
              ) : (
                <>
                  <Store className="h-4 w-4 mr-2" />
                  Créer la boutique
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}