import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';
import { Store } from './StoresContext';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { X, Store as StoreIcon, Upload, Camera } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getImageUrl } from '../services/api';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (store: Omit<Store, 'id' | 'createdAt' | 'updatedAt' | 'stats'>) => void;
  store?: Store | null;
  sellerId: number;
}

const storeTypes = [
  "Électronique & Électroménager",
  "Mode & Accessoires", 
  "Gaming & Divertissement",
  "Maison & Décoration",
  "Sport & Loisirs",
  "Beauté & Santé",
  "Alimentaire & Boissons",
  "Auto & Moto",
  "Livres & Papeterie",
  "Jouets & Enfants"
];

export function StoreModal({ isOpen, onClose, onSave, store, sellerId }: StoreModalProps) {
  const { user } = useAuth();
  const actualSellerId = user?.id ? parseInt(user.id.toString()) : sellerId;
   const [currentStep, setCurrentStep] = useState<number>(1);
   const totalSteps = 4;

   const [formData, setFormData] = useState({
      name: '',
      description: '',
      category: '',
      image: '',
      logo: '',
      address: '',
      phone: '',
      email: '',
      openingHours: '',
      facebook_url: '',
      twitter_url: '',
      instagram_url: '',
      youtube_url: '',
      footer_description: '',
      rating: 0,
      reviewsCount: 0,
      isVerified: false,
      isActive: true,
      sellerId: sellerId
    });

    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [logoPreview, setLogoPreview] = useState<string>("");
    const [imagePreview, setImagePreview] = useState<string>("");
    const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name,
        description: store.description,
        category: store.category,
        image: store.image,
        logo: store.logo,
        address: store.address,
        phone: store.phone,
        email: store.email,
        openingHours: store.openingHours,
        facebook_url: '',
        twitter_url: '',
        instagram_url: '',
        youtube_url: '',
        footer_description: '',
        rating: store.rating,
        reviewsCount: store.reviewsCount,
        isVerified: store.isVerified,
        isActive: store.isActive,
        sellerId: store.sellerId
      });
      setLogoPreview(store.logo);
      setImagePreview(store.image);
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        image: '',
        logo: '',
        address: '',
        phone: '',
        email: '',
        openingHours: '',
        facebook_url: '',
        twitter_url: '',
        instagram_url: '',
        youtube_url: '',
        footer_description: '',
        rating: 0,
        reviewsCount: 0,
        isVerified: false,
        isActive: true,
        sellerId: actualSellerId
      });
      setLogoPreview('');
      setImagePreview('');
    }
    setErrors({});
    setCurrentStep(1); // Reset to first step when modal opens
  }, [store, actualSellerId, isOpen]);

  const validateStep = (step: number) => {
    const newErrors: {[key: string]: string} = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = "Le nom de la boutique est requis";
      }
      if (!formData.description.trim()) {
        newErrors.description = "La description est requise";
      }
      if (!formData.category) {
        newErrors.category = "Le type de boutique est requis";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom de la boutique est requis";
    }

    if (!formData.description.trim()) {
      newErrors.description = "La description est requise";
    }

    if (!formData.category) {
      newErrors.category = "Le type de boutique est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep < totalSteps) {
      handleNext();
      return;
    }

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    onSave(formData);
    toast.success(store ? "Boutique modifiée avec succès" : "Boutique créée avec succès");
    onClose();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Image file selected:', file.name, file.type, file.size);
      setIsUploadingImage(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log('Image loaded successfully');
        setImagePreview(result);
        setFormData(prev => ({
          ...prev,
          logo: result, // Send image data in logo field for backend compatibility
          image: result // Keep image field for frontend consistency
        }));
        setIsUploadingImage(false);
        toast.success('Image ajoutée avec succès');
      };
      reader.onerror = (error) => {
        console.error('Error reading image file:', error);
        setIsUploadingImage(false);
        toast.error('Erreur lors du chargement de l\'image');
      };
      reader.readAsDataURL(file);

      // Reset the input so the same file can be selected again
      event.target.value = '';
    } else {
      console.log('No file selected');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto bg-white rounded-xl shadow-xl border border-gray-200 p-0 overflow-hidden">
        {/* Header - Dashboard style */}
        <div className="bg-gradient-to-r from-somba-primary to-somba-accent px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <StoreIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {store ? 'Modifier la boutique' : 'Créer une boutique'}
                </h2>
                <p className="text-white/90 text-sm">
                  {store ? 'Mettez à jour les informations' : 'Configurez votre nouvelle boutique'}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg w-8 h-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-somba-primary">
              Étape {currentStep} sur {totalSteps}
            </span>
            <span className="text-sm text-somba-text-light">
              {Math.round((currentStep / totalSteps) * 100)}% terminé
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-somba-accent h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i + 1}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  i + 1 <= currentStep
                    ? 'bg-somba-accent text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Form - Dashboard style with sections */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Section 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-somba-primary text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <h3 className="text-lg font-semibold text-somba-primary">Informations de base</h3>
              </div>

              {/* Store Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-somba-primary">
                  Nom de la boutique <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-somba-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent text-sm"
                  placeholder="Entrez le nom de votre boutique"
                  required
                />
                {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Store Category */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-somba-primary">
                  Catégorie <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-somba-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent text-sm bg-white"
                  required
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {storeTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-red-600 text-xs mt-1">{errors.category}</p>}
              </div>

              {/* Store Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-somba-primary">
                  Description de la boutique
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-somba-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent text-sm resize-none"
                  placeholder="Décrivez brièvement votre boutique..."
                />
                {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description}</p>}
              </div>
            </div>
          )}

          {/* Section 2: Contact Information */}
          {currentStep === 2 && (
            <div className="space-y-4 border-t border-somba-primary/10 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-somba-primary text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <h3 className="text-lg font-semibold text-somba-primary">Informations de contact</h3>
              </div>

              {/* Store Address */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-somba-primary">
                  Adresse de la boutique
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-somba-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent text-sm"
                  placeholder="Ex: Abidjan, Côte d'Ivoire"
                />
              </div>

              {/* Store Phone */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-somba-primary">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-somba-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent text-sm"
                  placeholder="Ex: +225 XX XX XX XX"
                />
              </div>

              {/* Store Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-somba-primary">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-somba-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent text-sm"
                  placeholder="contact@boutique.ci"
                />
              </div>
            </div>
          )}

          {/* Section 3: Business Information */}
          {currentStep === 3 && (
            <div className="space-y-4 border-t border-somba-primary/10 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-somba-primary text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <h3 className="text-lg font-semibold text-somba-primary">Informations commerciales</h3>
              </div>

              {/* Opening Hours */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-somba-primary">
                  Horaires d'ouverture
                </label>
                <input
                  type="text"
                  value={formData.openingHours}
                  onChange={(e) => handleInputChange('openingHours', e.target.value)}
                  className="w-full px-3 py-2 border border-somba-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent text-sm"
                  placeholder="Ex: Lun-Ven: 8h-18h, Sam: 8h-16h"
                />
              </div>

              {/* Store Image Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-somba-primary">
                  Image de la boutique
                </label>
                <div className="border border-somba-primary/20 rounded-lg p-4 bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center bg-white hover:bg-gray-50 transition-all duration-200 ${
                        isUploadingImage ? 'border-somba-accent animate-pulse' : 'border-somba-primary/30'
                      }`}>
                        {isUploadingImage ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-somba-accent"></div>
                        ) : imagePreview ? (
                          <img
                            src={getImageUrl(imagePreview)}
                            alt="Store image preview"
                            className="w-full h-full object-cover rounded-lg shadow-sm"
                          />
                        ) : (
                          <StoreIcon className="h-6 w-6 text-somba-primary/50" />
                        )}
                      </div>
                      {imagePreview && !isUploadingImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview("");
                            setFormData(prev => ({ ...prev, image: "", logo: "" }));
                            toast.success('Image supprimée');
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm transition-all duration-200 hover:scale-110"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <div className="flex-1">
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="border border-somba-primary/20 rounded-lg p-3 hover:bg-somba-light/30 transition-colors">
                          <div className="text-sm text-somba-primary font-medium">
                            {isUploadingImage ? 'Chargement...' : imagePreview ? 'Changer l\'image' : 'Ajouter une image'}
                          </div>
                          <div className="text-xs text-somba-text-light mt-1">
                            {isUploadingImage ? 'Veuillez patienter...' : 'Tous formats d\'images acceptés • Toutes tailles acceptées'}
                          </div>
                        </div>
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-somba-primary">
                  Description du pied de page (optionnel)
                </label>
                <textarea
                  value={formData.footer_description}
                  onChange={(e) => handleInputChange('footer_description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-somba-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent text-sm resize-none"
                  placeholder="Description qui apparaîtra dans le pied de page de votre boutique..."
                />
              </div>
            </div>
          )}

          {/* Section 4: Social Media */}
          {currentStep === 4 && (
            <div className="space-y-4 border-t border-somba-primary/10 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-somba-primary text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <h3 className="text-lg font-semibold text-somba-primary">Réseaux sociaux (optionnel)</h3>
              </div>

              <div className="space-y-3">
                <input
                  type="url"
                  value={formData.facebook_url}
                  onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                  className="w-full px-3 py-2 border border-somba-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent text-sm"
                  placeholder="URL Facebook"
                />

                <input
                  type="url"
                  value={formData.instagram_url}
                  onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                  className="w-full px-3 py-2 border border-somba-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent text-sm"
                  placeholder="URL Instagram"
                />

                <input
                  type="url"
                  value={formData.twitter_url}
                  onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                  className="w-full px-3 py-2 border border-somba-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent text-sm"
                  placeholder="URL Twitter/X"
                />

                <input
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => handleInputChange('youtube_url', e.target.value)}
                  className="w-full px-3 py-2 border border-somba-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-somba-accent text-sm"
                  placeholder="URL YouTube"
                />
              </div>
            </div>
          )}

          {/* Action Buttons - Dashboard style with navigation */}
          <div className="flex gap-3 pt-6 border-t border-somba-primary/10 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
            >
              Annuler
            </Button>

            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                className="border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
              >
                Précédent
              </Button>
            )}

            {currentStep < totalSteps ? (
              <Button
                type="submit"
                className="flex-1 bg-somba-accent hover:bg-somba-accent/90 text-white"
              >
                Suivant
              </Button>
            ) : (
              <Button
                type="submit"
                className="flex-1 bg-somba-accent hover:bg-somba-accent/90 text-white"
              >
                {store ? 'Enregistrer les modifications' : 'Créer la boutique'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}