import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { X, Package, Upload, Image as ImageIcon, CheckCircle, ArrowRight, ArrowLeft, Sparkles, Star } from 'lucide-react';
import { useStores } from './StoresContext';
import { useProducts } from './ProductsContext';

interface FirstProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: any) => void;
  sellerId: number;
}

const categories = [
  "Électronique",
  "Mode",
  "Gaming",
  "Électroménager",
  "Sport",
  "Beauté",
  "Maison",
  "Auto",
  "Livres",
  "Jouets"
];

const steps = [
  { id: 1, title: "Bienvenue", description: "Créons votre premier produit" },
  { id: 2, title: "Informations de base", description: "Nom, catégorie et description" },
  { id: 3, title: "Prix et boutique", description: "Définissez vos tarifs" },
  { id: 4, title: "Image et détails", description: "Ajoutez une belle photo" },
  { id: 5, title: "Finalisation", description: "Vérifiez et publiez" }
];

export function FirstProductModal({ isOpen, onClose, onSave, sellerId }: FirstProductModalProps) {
  const { getStoresBySeller } = useStores();
  const { getProductsBySeller } = useProducts();
  const sellerStores = getStoresBySeller(sellerId);
  const existingProducts = getProductsBySeller(sellerId);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    originalPrice: '',
    image: '',
    boutique: '',
    sizes: '',
    colors: '',
    inStock: true,
    isOnSale: false
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sellerStores.length > 0 && !formData.boutique) {
      setFormData(prev => ({ ...prev, boutique: sellerStores[0].name }));
    }
  }, [sellerStores, formData.boutique]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        originalPrice: '',
        image: '',
        boutique: '',
        sizes: '',
        colors: '',
        inStock: true,
        isOnSale: false
      });
      setImagePreview('');
      setSelectedImage(null);
      setErrors({});
    }
  }, [isOpen]);

  const validateStep = (step: number) => {
    const newErrors: {[key: string]: string} = {};

    if (step === 2) {
      if (!formData.name.trim()) {
        newErrors.name = "Le nom du produit est requis";
      }
      if (!formData.category) {
        newErrors.category = "La catégorie est requise";
      }
      if (!formData.description.trim()) {
        newErrors.description = "La description est requise";
      }
    }

    if (step === 3) {
      if (!formData.price.trim()) {
        newErrors.price = "Le prix est requis";
      } else if (isNaN(parseFloat(formData.price))) {
        newErrors.price = "Le prix doit être un nombre valide";
      }
      if (!formData.boutique) {
        newErrors.boutique = "Vous devez sélectionner une boutique";
      }
    }

    if (step === 4) {
      if (!imagePreview && !selectedImage) {
        newErrors.image = "L'image du produit est requise";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    } else {
      toast.error("Veuillez corriger les erreurs avant de continuer");
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    // Find the selected store to get its ID
    const selectedStore = sellerStores.find(store => store.name === formData.boutique);

    // Format the data
    const productData = {
      ...formData,
      id: Date.now(),
      storeId: selectedStore?.id, // Add the store ID
      image: imagePreview || formData.image,
      price: `${parseFloat(formData.price).toLocaleString()} F CFA`,
      originalPrice: formData.originalPrice ? `${parseFloat(formData.originalPrice).toLocaleString()} F CFA` : undefined,
      sizes: formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(s => s) : undefined,
      colors: formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(c => c) : undefined,
      rating: (Math.random() * 1.5 + 3.5).toFixed(1),
      reviews: Math.floor(Math.random() * 50) + 5
    };

    onSave(productData);
    toast.success("Félicitations ! Votre premier produit a été créé avec succès 🎉");
    onClose();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Veuillez sélectionner un fichier image valide");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 5MB");
        return;
      }

      setSelectedImage(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, image: result }));

        if (errors.image) {
          setErrors(prev => ({ ...prev, image: '' }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const progress = (currentStep / steps.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6 py-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-somba-primary to-somba-accent rounded-full flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-somba-primary">
                Bienvenue dans votre boutique !
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Créons ensemble votre premier produit. Nous allons vous guider pas à pas pour mettre en valeur vos articles.
              </p>
            </div>
            <div className="bg-somba-light/30 rounded-lg p-6 max-w-md mx-auto">
              <div className="flex items-center gap-3 text-somba-primary">
                <Star className="h-5 w-5" />
                <span className="font-medium">Astuce :</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Une belle photo et une description détaillée augmentent vos ventes de 40% !
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-somba-primary mb-2">
                Informations de base
              </h3>
              <p className="text-gray-600">
                Donnez un nom accrocheur et décrivez votre produit
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-somba-primary">
                  Nom du produit *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`h-12 border-gray-200 focus:border-somba-accent focus:ring-somba-accent/20 ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Ex: Smartphone Samsung Galaxy S24"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="category" className="text-sm font-medium text-somba-primary">
                  Catégorie *
                </Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger className={`h-12 border-gray-200 focus:border-somba-accent focus:ring-somba-accent/20 ${errors.category ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Choisissez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-somba-primary">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`min-h-[100px] border-gray-200 focus:border-somba-accent focus:ring-somba-accent/20 resize-none ${errors.description ? 'border-red-500' : ''}`}
                  placeholder="Décrivez votre produit en détail : caractéristiques, avantages, dimensions..."
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-somba-primary mb-2">
                Prix et boutique
              </h3>
              <p className="text-gray-600">
                Définissez vos tarifs attractifs
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="price" className="text-sm font-medium text-somba-primary">
                  Prix de vente (F CFA) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className={`h-12 border-gray-200 focus:border-somba-accent focus:ring-somba-accent/20 ${errors.price ? 'border-red-500' : ''}`}
                  placeholder="25000"
                />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              </div>

              <div>
                <Label htmlFor="originalPrice" className="text-sm font-medium text-somba-primary">
                  Prix original (optionnel)
                </Label>
                <Input
                  id="originalPrice"
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                  className="h-12 border-gray-200 focus:border-somba-accent focus:ring-somba-accent/20"
                  placeholder="30000"
                />
                <p className="text-xs text-gray-500 mt-1">Pour afficher une promotion</p>
              </div>

              <div>
                <Label htmlFor="boutique" className="text-sm font-medium text-somba-primary">
                  Boutique *
                </Label>
                <Select value={formData.boutique} onValueChange={(value) => handleInputChange('boutique', value)}>
                  <SelectTrigger className={`h-12 border-gray-200 focus:border-somba-accent focus:ring-somba-accent/20 ${errors.boutique ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Sélectionnez votre boutique" />
                  </SelectTrigger>
                  <SelectContent>
                    {sellerStores.map((store) => (
                      <SelectItem key={store.id} value={store.name}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.boutique && <p className="text-red-500 text-xs mt-1">{errors.boutique}</p>}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-somba-primary mb-2">
                Photo du produit
              </h3>
              <p className="text-gray-600">
                Une belle image attire plus de clients
              </p>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium text-somba-primary">
                Image principale *
              </Label>

              {imagePreview ? (
                <div className="relative mx-auto w-48 h-48 border-2 border-gray-200 rounded-xl overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Aperçu du produit"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview('');
                        setFormData(prev => ({ ...prev, image: '' }));
                      }}
                      className="h-10 w-10 p-0"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={handleImageUploadClick}
                  className={`relative mx-auto w-48 h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-somba-accent hover:bg-somba-light/30 ${
                    errors.image ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 bg-somba-light rounded-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-somba-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-somba-primary">
                        Cliquez pour ajouter une photo
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, JPEG • Max 5MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {errors.image && <p className="text-red-500 text-xs text-center">{errors.image}</p>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sizes" className="text-sm font-medium text-somba-primary">
                    Tailles disponibles
                  </Label>
                  <Input
                    id="sizes"
                    value={formData.sizes}
                    onChange={(e) => handleInputChange('sizes', e.target.value)}
                    className="h-12 border-gray-200 focus:border-somba-accent focus:ring-somba-accent/20"
                    placeholder="S, M, L, XL"
                  />
                  <p className="text-xs text-gray-500 mt-1">Séparez par des virgules</p>
                </div>

                <div>
                  <Label htmlFor="colors" className="text-sm font-medium text-somba-primary">
                    Couleurs disponibles
                  </Label>
                  <Input
                    id="colors"
                    value={formData.colors}
                    onChange={(e) => handleInputChange('colors', e.target.value)}
                    className="h-12 border-gray-200 focus:border-somba-accent focus:ring-somba-accent/20"
                    placeholder="Rouge, Bleu, Noir"
                  />
                  <p className="text-xs text-gray-500 mt-1">Séparez par des virgules</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-somba-primary mb-2">
                Prêt à publier !
              </h3>
              <p className="text-gray-600">
                Vérifiez les informations avant de publier votre produit
              </p>
            </div>

            <Card className="border-somba-primary/20">
              <CardHeader>
                <CardTitle className="text-lg text-somba-primary">
                  Récapitulatif de votre produit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Nom</p>
                    <p className="text-sm text-somba-primary">{formData.name || 'Non défini'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Catégorie</p>
                    <p className="text-sm text-somba-primary">{formData.category || 'Non définie'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Prix</p>
                    <p className="text-sm text-somba-primary">
                      {formData.price ? `${parseFloat(formData.price).toLocaleString()} F CFA` : 'Non défini'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Boutique</p>
                    <p className="text-sm text-somba-primary">{formData.boutique || 'Non définie'}</p>
                  </div>
                </div>

                {imagePreview && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Image</p>
                    <img
                      src={imagePreview}
                      alt="Produit"
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                  </div>
                )}

                <div className="bg-somba-light/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-somba-primary">
                    <Star className="h-4 w-4" />
                    <span className="text-sm font-medium">Conseil :</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Vous pourrez modifier ces informations à tout moment depuis votre tableau de bord.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto bg-white rounded-xl shadow-xl border border-gray-200 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-somba-primary to-somba-accent text-white">
          <DialogTitle className="sr-only">Créer votre premier produit</DialogTitle>
          <DialogDescription className="sr-only">
            Assistant de création de produit en {steps.length} étapes pour vous aider à créer votre premier produit sur Sombango
          </DialogDescription>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Créer votre premier produit
                </h2>
                <p className="text-white/90 text-sm">
                  Étape {currentStep} sur {steps.length}
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

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progress} className="h-2 bg-white/20" />
            <div className="flex justify-between mt-2 text-xs text-white/80">
              {steps.map((step) => (
                <span
                  key={step.id}
                  className={`${
                    step.id <= currentStep ? 'text-white font-medium' : 'text-white/60'
                  }`}
                >
                  {step.id === currentStep ? step.title : step.id < currentStep ? '✓' : step.id.toString()}
                </span>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-6 min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex-1 border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>

          {currentStep < steps.length ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex-1 bg-somba-accent hover:bg-somba-accent/90 text-white"
            >
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Publier le produit
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}