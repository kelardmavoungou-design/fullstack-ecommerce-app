import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { X, Package, Upload, Image as ImageIcon, Trash2, Plus, Minus, ChevronRight, ChevronLeft, DollarSign, Truck, Settings, Tag, BarChart3, CheckSquare } from 'lucide-react';
import { useStores } from './StoresContext';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: any) => void;
  product?: any | null;
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

export function ProductModal({ isOpen, onClose, onSave, product, sellerId }: ProductModalProps) {
  const { getStoresBySeller } = useStores();
  const sellerStores = getStoresBySeller(sellerId);
  
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    description: '',
    category: '',
    brand: '',
    model: '',
    keywords: '',

    // Images
    images: [] as string[],
    mainImage: '',

    // Pricing
    price: '',
    originalPrice: '',
    promotionalPrice: '',
    bulkPricing: [] as { minQuantity: number; price: number }[],

    // Inventory & Variations
    stock: '',
    trackInventory: true,
    variations: [] as { name: string; values: string[] }[],
    sizes: '',
    colors: '',

    // Shipping
    weight: '',
    weightUnit: 'kg',
    dimensions: { length: '', width: '', height: '' },
    dimensionUnit: 'cm',
    shippingMethods: [] as string[],

    // Specifications
    specifications: [] as { name: string; value: string }[],

    // Store
    boutique: '',

    // Status
    inStock: true,
    isOnSale: false,
    isActive: true
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);
  const [currentSubStep, setCurrentSubStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    {
      id: 'basic',
      title: 'Informations de base',
      icon: Package,
      subSteps: [
        { title: 'Informations générales', description: 'Nom, catégorie et boutique' },
        { title: 'Détails du produit', description: 'Marque, modèle et description' },
        { title: 'Optimisation SEO', description: 'Mots-clés pour la recherche' }
      ]
    },
    {
      id: 'images',
      title: 'Images',
      icon: ImageIcon,
      subSteps: [
        { title: 'Image principale', description: 'Photo principale du produit' },
        { title: 'Images supplémentaires', description: 'Galerie de photos' }
      ]
    },
    {
      id: 'pricing',
      title: 'Prix',
      icon: DollarSign,
      subSteps: [
        { title: 'Tarification de base', description: 'Prix de vente et promotion' },
        { title: 'Statut du produit', description: 'Visibilité et disponibilité' }
      ]
    },
    {
      id: 'inventory',
      title: 'Stock',
      icon: BarChart3,
      subSteps: [
        { title: 'Gestion des stocks', description: 'Quantité et suivi d\'inventaire' },
        { title: 'Variations', description: 'Tailles et couleurs disponibles' }
      ]
    },
    {
      id: 'shipping',
      title: 'Livraison',
      icon: Truck,
      subSteps: [
        { title: 'Caractéristiques physiques', description: 'Poids et dimensions' },
        { title: 'Options de livraison', description: 'Méthodes d\'expédition' }
      ]
    },
    {
      id: 'specs',
      title: 'Spécifications',
      icon: Settings,
      subSteps: [
        { title: 'Caractéristiques techniques', description: 'Spécifications du produit' }
      ]
    }
  ];

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        brand: product.brand || '',
        model: product.model || '',
        keywords: product.keywords || '',
        images: product.images || [product.image].filter(Boolean),
        mainImage: product.mainImage || product.image || '',
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        promotionalPrice: product.promotionalPrice || '',
        bulkPricing: product.bulkPricing || [],
        stock: product.stock || '',
        trackInventory: product.trackInventory !== false,
        variations: product.variations || [],
        sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : '',
        colors: Array.isArray(product.colors) ? product.colors.join(', ') : '',
        weight: product.weight || '',
        weightUnit: product.weightUnit || 'kg',
        dimensions: product.dimensions || { length: '', width: '', height: '' },
        dimensionUnit: product.dimensionUnit || 'cm',
        shippingMethods: product.shippingMethods || [],
        specifications: product.specifications || [],
        boutique: product.boutique || '',
        inStock: product.inStock !== false,
        isOnSale: product.isOnSale || false,
        isActive: product.isActive !== false
      });
      setImagePreview(product.mainImage || product.image || '');
      setSelectedImage(null);
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        brand: '',
        model: '',
        keywords: '',
        images: [],
        mainImage: '',
        price: '',
        originalPrice: '',
        promotionalPrice: '',
        bulkPricing: [],
        stock: '',
        trackInventory: true,
        variations: [],
        sizes: '',
        colors: '',
        weight: '',
        weightUnit: 'kg',
        dimensions: { length: '', width: '', height: '' },
        dimensionUnit: 'cm',
        shippingMethods: [],
        specifications: [],
        boutique: '',
        inStock: true,
        isOnSale: false,
        isActive: true
      });
      setImagePreview('');
      setSelectedImage(null);
    }
    setErrors({});
  }, [product]);

  // Set default store when not editing and stores are available
  useEffect(() => {
    if (!product && sellerStores.length > 0 && !formData.boutique) {
      setFormData(prev => ({ ...prev, boutique: sellerStores[0].name }));
    }
  }, [product, sellerStores, formData.boutique]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Only validate numeric fields for format, not required fields
    // Allow sellers to save incomplete products

    // Pricing validation - only check format if provided
    if (formData.price.trim() && isNaN(parseFloat(formData.price))) {
      newErrors.price = "Le prix doit être un nombre valide";
    }

    if (formData.promotionalPrice && isNaN(parseFloat(formData.promotionalPrice))) {
      newErrors.promotionalPrice = "Le prix promotionnel doit être un nombre valide";
    }

    // Inventory validation - only check format if provided
    if (formData.stock && isNaN(parseInt(formData.stock))) {
      newErrors.stock = "Le stock doit être un nombre valide";
    }

    // Shipping validation - only check format if provided
    if (formData.weight && isNaN(parseFloat(formData.weight))) {
      newErrors.weight = "Le poids doit être un nombre valide";
    }

    if (formData.dimensions.length && isNaN(parseFloat(formData.dimensions.length))) {
      newErrors.dimensions = "La longueur doit être un nombre valide";
    }

    if (formData.dimensions.width && isNaN(parseFloat(formData.dimensions.width))) {
      newErrors.dimensions = "La largeur doit être un nombre valide";
    }

    if (formData.dimensions.height && isNaN(parseFloat(formData.dimensions.height))) {
      newErrors.dimensions = "La hauteur doit être un nombre valide";
    }

    setErrors(newErrors);
    // Always allow saving - don't block on missing required fields
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form (only format validation, not required fields)
    validateForm();

    // Find the selected store to get its ID
    const selectedStore = sellerStores.find(store => store.name === formData.boutique);

    // Format the data - allow incomplete information
    const productData = {
      ...formData,
      id: product?.id || Date.now(),
      storeId: selectedStore?.id, // Add the store ID
      mainImage: imagePreview || formData.mainImage,
      images: formData.images.length > 0 ? formData.images : [imagePreview].filter(Boolean),
      price: formData.price ? `${parseFloat(formData.price).toLocaleString()} F CFA` : '',
      originalPrice: formData.originalPrice ? `${parseFloat(formData.originalPrice).toLocaleString()} F CFA` : undefined,
      promotionalPrice: formData.promotionalPrice ? `${parseFloat(formData.promotionalPrice).toLocaleString()} F CFA` : undefined,
      sizes: formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(s => s) : undefined,
      colors: formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(c => c) : undefined,
      rating: product?.rating || (Math.random() * 1.5 + 3.5).toFixed(1),
      reviews: product?.reviews || Math.floor(Math.random() * 200) + 10
    };

    // Add safe price formatting
    if (formData.price && !isNaN(parseFloat(formData.price))) {
      productData.price = `${parseFloat(formData.price).toLocaleString()} F CFA`;
    }

    if (formData.originalPrice && !isNaN(parseFloat(formData.originalPrice))) {
      productData.originalPrice = `${parseFloat(formData.originalPrice).toLocaleString()} F CFA`;
    }

    if (formData.promotionalPrice && !isNaN(parseFloat(formData.promotionalPrice))) {
      productData.promotionalPrice = `${parseFloat(formData.promotionalPrice).toLocaleString()} F CFA`;
    }

    onSave(productData);
    toast.success(product ? "Produit modifié avec succès" : "Produit créé avec succès");
    onClose();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast.error("Veuillez sélectionner un fichier image valide");
        return;
      }

      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 5MB");
        return;
      }

      setSelectedImage(file);

      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, image: result }));
        
        // Clear image error if exists
        if (errors.image) {
          setErrors(prev => ({ ...prev, image: '' }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleNext = () => {
    const currentStepData = steps[currentStep];
    const maxSubSteps = currentStepData.subSteps.length - 1;

    if (currentSubStep < maxSubSteps) {
      // Move to next sub-step in current step
      setCurrentSubStep(currentSubStep + 1);
    } else if (currentStep < steps.length - 1) {
      // Move to next main step, reset sub-step to 0
      setCurrentStep(currentStep + 1);
      setCurrentSubStep(0);
    }
  };

  const handlePrevious = () => {
    if (currentSubStep > 0) {
      // Move to previous sub-step in current step
      setCurrentSubStep(currentSubStep - 1);
    } else if (currentStep > 0) {
      // Move to previous main step, set to last sub-step
      const prevStepData = steps[currentStep - 1];
      setCurrentStep(currentStep - 1);
      setCurrentSubStep(prevStepData.subSteps.length - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
      setCurrentSubStep(0);
    }
  };

  // Calculate total progress
  const getTotalSteps = () => {
    return steps.reduce((total, step) => total + step.subSteps.length, 0);
  };

  const getCurrentStepNumber = () => {
    let totalSteps = 0;
    for (let i = 0; i < currentStep; i++) {
      totalSteps += steps[i].subSteps.length;
    }
    return totalSteps + currentSubStep + 1;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl mx-auto bg-white rounded-xl shadow-2xl border-0 p-0 overflow-hidden max-h-[95vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>{product ? 'Modifier le produit' : 'Ajouter un produit'}</DialogTitle>
          <DialogDescription>Créez une fiche produit complète et professionnelle</DialogDescription>
        </DialogHeader>

        {/* Header - Clean Alibaba style */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {product ? 'Modifier le produit' : 'Ajouter un produit'}
                </h1>
                <p className="text-gray-600 text-sm">
                  Créez une fiche produit complète et professionnelle
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg w-8 h-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Step-by-Step Wizard */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Progress Indicator */}
          <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">
                Étape {getCurrentStepNumber()} sur {getTotalSteps()}
              </h3>
              <span className="text-sm text-gray-500">
                {Math.round((getCurrentStepNumber() / getTotalSteps()) * 100)}% terminé
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(getCurrentStepNumber() / getTotalSteps()) * 100}%` }}
              ></div>
            </div>

            {/* Current Step Title */}
            <div className="text-center">
              <h4 className="text-lg font-bold text-gray-900">{steps[currentStep].title}</h4>
              <p className="text-gray-600 text-sm mt-1">
                {steps[currentStep].subSteps[currentSubStep]?.description || "Complétez cette étape"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {steps[currentStep].subSteps[currentSubStep]?.title}
              </p>
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* Step Content - Basic Information */}
            {currentStep === 0 && (
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Sub-step 1: General Information */}
                {currentSubStep === 0 && (
                  <div className="space-y-6">
                    {/* Product Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-900">
                        Nom du produit <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 ${errors.name ? 'border-red-500' : ''}`}
                        placeholder="Ex: Smartphone Samsung Galaxy S23"
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                      <p className="text-xs text-gray-500">Choisissez un nom clair et descriptif pour votre produit</p>
                    </div>

                    {/* Category and Store */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-sm font-medium text-gray-900">
                          Catégorie <span className="text-red-500">*</span>
                        </Label>
                        <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                          <SelectTrigger className={`h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 ${errors.category ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Sélectionner une catégorie" />
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

                      <div className="space-y-2">
                        <Label htmlFor="boutique" className="text-sm font-medium text-gray-900">
                          Boutique <span className="text-red-500">*</span>
                        </Label>
                        <Select value={formData.boutique} onValueChange={(value) => handleInputChange('boutique', value)}>
                          <SelectTrigger className={`h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 ${errors.boutique ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Sélectionner une boutique" />
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
                )}

                {/* Sub-step 2: Product Details */}
                {currentSubStep === 1 && (
                  <div className="space-y-6">
                    {/* Brand and Model */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="brand" className="text-sm font-medium text-gray-900">
                          Marque
                        </Label>
                        <Input
                          id="brand"
                          value={formData.brand}
                          onChange={(e) => handleInputChange('brand', e.target.value)}
                          className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
                          placeholder="Ex: Samsung"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="model" className="text-sm font-medium text-gray-900">
                          Modèle
                        </Label>
                        <Input
                          id="model"
                          value={formData.model}
                          onChange={(e) => handleInputChange('model', e.target.value)}
                          className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
                          placeholder="Ex: Galaxy S23 Ultra"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium text-gray-900">
                        Description détaillée <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className={`min-h-[100px] border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 resize-none ${errors.description ? 'border-red-500' : ''}`}
                        placeholder="Décrivez votre produit en détail : caractéristiques techniques, avantages, utilisation recommandée..."
                      />
                      {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                      <p className="text-xs text-gray-500">Une description détaillée aide les clients à mieux comprendre votre produit</p>
                    </div>
                  </div>
                )}

                {/* Sub-step 3: SEO Optimization */}
                {currentSubStep === 2 && (
                  <div className="space-y-6">
                    {/* Keywords */}
                    <div className="space-y-2">
                      <Label htmlFor="keywords" className="text-sm font-medium text-gray-900">
                        Mots-clés SEO
                      </Label>
                      <Input
                        id="keywords"
                        value={formData.keywords}
                        onChange={(e) => handleInputChange('keywords', e.target.value)}
                        className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
                        placeholder="Séparez par des virgules : smartphone, android, samsung"
                      />
                      <p className="text-xs text-gray-500">Ces mots-clés aident les clients à trouver votre produit lors de leurs recherches</p>
                    </div>

                    {/* SEO Tips */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs">💡</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-blue-900 mb-1">Conseils pour l'optimisation SEO</h4>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Utilisez des mots-clés pertinents pour votre produit</li>
                            <li>• Incluez la marque et le modèle dans les mots-clés</li>
                            <li>• Pensez aux termes que vos clients pourraient rechercher</li>
                            <li>• Évitez les mots-clés trop génériques</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step Content - Images */}
            {currentStep === 1 && (
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Sub-step 1: Main Image */}
                {currentSubStep === 0 && (
                  <>
                    {/* Main Image Upload */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-gray-900">Image principale</h3>
                        <span className="text-red-500">*</span>
                      </div>

                      {imagePreview ? (
                        <div className="relative">
                          <div className="w-48 h-48 border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                            <img
                              src={imagePreview}
                              alt="Image principale du produit"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleImageUploadClick}
                                  className="bg-white text-gray-700 hover:bg-gray-100"
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Changer
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={handleImageRemove}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">Image principale - sera affichée en premier</p>
                        </div>
                      ) : (
                        <div
                          onClick={handleImageUploadClick}
                          className={`w-48 h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 hover:border-orange-400 hover:bg-orange-50 flex flex-col items-center justify-center ${
                            errors.mainImage ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                          }`}
                        >
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                            <ImageIcon className="h-6 w-6 text-gray-500" />
                          </div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Ajouter l'image principale</p>
                          <p className="text-xs text-gray-500 text-center px-4">
                            PNG, JPG, JPEG<br />
                            Max 5MB • 800x800px recommandé
                          </p>
                        </div>
                      )}

                      {errors.mainImage && <p className="text-red-500 text-sm mt-2">{errors.mainImage}</p>}
                    </div>

                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </>
                )}

                {/* Sub-step 2: Additional Images */}
                {currentSubStep === 1 && (
                  <>
                    {/* Additional Images */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Images supplémentaires</h3>
                      <p className="text-gray-600">Ajoutez jusqu'à 8 images pour montrer différents angles de votre produit</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Placeholder for additional images */}
                        {Array.from({ length: 8 }, (_, index) => (
                          <div
                            key={index}
                            onClick={handleImageUploadClick}
                            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition-all duration-200 hover:border-orange-400 hover:bg-orange-50 flex flex-col items-center justify-center"
                          >
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                              <Plus className="h-4 w-4 text-gray-500" />
                            </div>
                            <p className="text-xs text-gray-500 text-center">Image {index + 1}</p>
                          </div>
                        ))}
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs">ℹ</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-blue-900 mb-1">Conseils pour de meilleures photos</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                              <li>• Utilisez un fond neutre et bien éclairé</li>
                              <li>• Montrez le produit sous différents angles</li>
                              <li>• Incluez des photos avec le produit en main pour l'échelle</li>
                              <li>• Évitez les filtres et retouches excessives</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </>
                )}
              </div>
            )}

            {/* Step Content - Pricing */}
            {currentStep === 2 && (
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Sub-step 1: Basic Pricing */}
                {currentSubStep === 0 && (
                  <>
                    {/* Basic Pricing */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="price" className="text-sm font-semibold text-gray-900">
                            Prix de vente (F CFA) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="price"
                            type="number"
                            value={formData.price}
                            onChange={(e) => handleInputChange('price', e.target.value)}
                            className={`h-12 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 ${errors.price ? 'border-red-500' : ''}`}
                            placeholder="25000"
                          />
                          {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                          <p className="text-sm text-gray-500">Prix affiché aux clients sur la plateforme</p>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="originalPrice" className="text-sm font-semibold text-gray-900">
                            Prix original (F CFA)
                          </Label>
                          <Input
                            id="originalPrice"
                            type="number"
                            value={formData.originalPrice}
                            onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                            className="h-12 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
                            placeholder="30000"
                          />
                          <p className="text-sm text-gray-500">Prix barré pour montrer une réduction</p>
                        </div>
                      </div>
                    </div>

                    {/* Promotional Pricing */}
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="promotionalPrice" className="text-sm font-semibold text-gray-900">
                          Prix spécial (F CFA)
                        </Label>
                        <Input
                          id="promotionalPrice"
                          type="number"
                          value={formData.promotionalPrice}
                          onChange={(e) => handleInputChange('promotionalPrice', e.target.value)}
                          className={`h-12 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 ${errors.promotionalPrice ? 'border-red-500' : ''}`}
                          placeholder="20000"
                        />
                        {errors.promotionalPrice && <p className="text-red-500 text-sm mt-1">{errors.promotionalPrice}</p>}
                        <p className="text-sm text-gray-500">Prix appliqué pendant les périodes de promotion</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Sub-step 2: Product Status */}
                {currentSubStep === 1 && (
                  <>
                    {/* Product Status */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium text-gray-900">Statut du produit</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <Label htmlFor="isOnSale" className="text-sm font-medium text-gray-900 cursor-pointer">
                              En promotion
                            </Label>
                            <p className="text-sm text-gray-500">Produit affiché en promotion</p>
                          </div>
                          <Checkbox
                            id="isOnSale"
                            checked={formData.isOnSale}
                            onCheckedChange={(checked) => handleInputChange('isOnSale', checked)}
                            className="w-5 h-5"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <Label htmlFor="isActive" className="text-sm font-medium text-gray-900 cursor-pointer">
                              Produit actif
                            </Label>
                            <p className="text-sm text-gray-500">Produit visible par les clients</p>
                          </div>
                          <Checkbox
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                            className="w-5 h-5"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pricing Tips */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs">💡</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-green-900 mb-1">Conseils de tarification</h4>
                          <ul className="text-sm text-green-800 space-y-1">
                            <li>• Analysez les prix de vos concurrents sur la plateforme</li>
                            <li>• Considérez vos coûts de production et de livraison</li>
                            <li>• Utilisez les promotions pour booster les ventes</li>
                            <li>• Pensez à la marge bénéficiaire souhaitée</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step Content - Inventory */}
            {currentStep === 3 && (
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Sub-step 1: Inventory Tracking */}
                {currentSubStep === 0 && (
                  <>
                    {/* Inventory Tracking */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <Label htmlFor="trackInventory" className="text-sm font-medium text-gray-900 cursor-pointer">
                            Activer le suivi d'inventaire
                          </Label>
                          <p className="text-sm text-gray-500">Permet de suivre automatiquement le stock disponible</p>
                        </div>
                        <Checkbox
                          id="trackInventory"
                          checked={formData.trackInventory}
                          onCheckedChange={(checked) => handleInputChange('trackInventory', checked)}
                          className="w-5 h-5"
                        />
                      </div>

                      {formData.trackInventory && (
                        <div className="space-y-3">
                          <Label htmlFor="stock" className="text-sm font-semibold text-gray-900">
                            Quantité en stock <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="stock"
                            type="number"
                            value={formData.stock}
                            onChange={(e) => handleInputChange('stock', e.target.value)}
                            className={`h-12 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 ${errors.stock ? 'border-red-500' : ''}`}
                            placeholder="100"
                          />
                          {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
                          <p className="text-sm text-gray-500">Nombre d'unités disponibles à la vente</p>
                        </div>
                      )}
                    </div>

                    {/* Stock Status */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <Label htmlFor="inStock" className="text-sm font-medium text-gray-900 cursor-pointer">
                            Produit en stock
                          </Label>
                          <p className="text-sm text-gray-500">Le produit est disponible à la vente</p>
                        </div>
                        <Checkbox
                          id="inStock"
                          checked={formData.inStock}
                          onCheckedChange={(checked) => handleInputChange('inStock', checked)}
                          className="w-5 h-5"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Sub-step 2: Product Variations */}
                {currentSubStep === 1 && (
                  <>
                    {/* Product Variations */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium text-gray-900">Variations du produit</h3>
                      <p className="text-gray-600">Définissez les différentes options disponibles pour votre produit</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="sizes" className="text-sm font-semibold text-gray-900">
                            Tailles disponibles
                          </Label>
                          <Input
                            id="sizes"
                            value={formData.sizes}
                            onChange={(e) => handleInputChange('sizes', e.target.value)}
                            className="h-12 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
                            placeholder="S, M, L, XL"
                          />
                          <p className="text-sm text-gray-500">Séparez les tailles par des virgules</p>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="colors" className="text-sm font-semibold text-gray-900">
                            Couleurs disponibles
                          </Label>
                          <Input
                            id="colors"
                            value={formData.colors}
                            onChange={(e) => handleInputChange('colors', e.target.value)}
                            className="h-12 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
                            placeholder="Rouge, Bleu, Noir"
                          />
                          <p className="text-sm text-gray-500">Séparez les couleurs par des virgules</p>
                        </div>
                      </div>
                    </div>

                    {/* Inventory Tips */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs">ℹ</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-blue-900 mb-1">Gestion des stocks</h4>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Activez le suivi d'inventaire pour éviter les ruptures</li>
                            <li>• Définissez des seuils d'alerte pour les réapprovisionnements</li>
                            <li>• Les variations permettent de gérer différents modèles</li>
                            <li>• Un stock à zéro empêche la vente automatique</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step Content - Shipping */}
            {currentStep === 4 && (
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Sub-step 1: Physical Characteristics */}
                {currentSubStep === 0 && (
                  <>
                    {/* Package Weight */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="weight" className="text-sm font-semibold text-gray-900">
                            Poids du colis
                          </Label>
                          <div className="flex gap-3">
                            <Input
                              id="weight"
                              type="number"
                              value={formData.weight}
                              onChange={(e) => handleInputChange('weight', e.target.value)}
                              className={`h-12 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 ${errors.weight ? 'border-red-500' : ''}`}
                              placeholder="1.5"
                            />
                            <Select value={formData.weightUnit} onValueChange={(value) => handleInputChange('weightUnit', value)}>
                              <SelectTrigger className="w-24 h-12">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="g">g</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
                          <p className="text-sm text-gray-500">Poids total du colis avec l'emballage</p>
                        </div>
                      </div>
                    </div>

                    {/* Package Dimensions */}
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-3">
                            <Label className="text-sm font-semibold text-gray-900">
                              Longueur
                            </Label>
                            <Input
                              placeholder="30"
                              type="number"
                              value={formData.dimensions.length}
                              onChange={(e) => handleInputChange('dimensions', { ...formData.dimensions, length: e.target.value })}
                              className={`h-12 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 ${errors.dimensions ? 'border-red-500' : ''}`}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-sm font-semibold text-gray-900">
                              Largeur
                            </Label>
                            <Input
                              placeholder="20"
                              type="number"
                              value={formData.dimensions.width}
                              onChange={(e) => handleInputChange('dimensions', { ...formData.dimensions, width: e.target.value })}
                              className={`h-12 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 ${errors.dimensions ? 'border-red-500' : ''}`}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-sm font-semibold text-gray-900">
                              Hauteur
                            </Label>
                            <Input
                              placeholder="10"
                              type="number"
                              value={formData.dimensions.height}
                              onChange={(e) => handleInputChange('dimensions', { ...formData.dimensions, height: e.target.value })}
                              className={`h-12 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 ${errors.dimensions ? 'border-red-500' : ''}`}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Label className="text-sm font-semibold text-gray-900">Unité:</Label>
                          <Select value={formData.dimensionUnit} onValueChange={(value) => handleInputChange('dimensionUnit', value)}>
                            <SelectTrigger className="w-24 h-12">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cm">cm</SelectItem>
                              <SelectItem value="mm">mm</SelectItem>
                              <SelectItem value="m">m</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <p className="text-sm text-gray-500">Dimensions du colis emballé (Longueur × Largeur × Hauteur)</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Sub-step 2: Shipping Methods */}
                {currentSubStep === 1 && (
                  <>
                    {/* Shipping Methods */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium text-gray-900">Méthodes de livraison</h3>
                      <p className="text-gray-600">Sélectionnez les options de livraison disponibles pour ce produit</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { id: 'standard', label: 'Livraison Standard', desc: '3-5 jours ouvrés' },
                          { id: 'express', label: 'Livraison Express', desc: '1-2 jours ouvrés' },
                          { id: 'economique', label: 'Livraison Économique', desc: '5-7 jours ouvrés' },
                          { id: 'pickup', label: 'Retrait en magasin', desc: 'Gratuit - disponible immédiatement' }
                        ].map((method) => (
                          <div key={method.id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
                            <Checkbox
                              id={`shipping-${method.id}`}
                              checked={formData.shippingMethods.includes(method.label)}
                              onCheckedChange={(checked) => {
                                const updatedMethods = checked
                                  ? [...formData.shippingMethods, method.label]
                                  : formData.shippingMethods.filter(m => m !== method.label);
                                handleInputChange('shippingMethods', updatedMethods);
                              }}
                              className="mt-1"
                            />
                            <div>
                              <Label htmlFor={`shipping-${method.id}`} className="text-sm font-medium text-gray-900 cursor-pointer">
                                {method.label}
                              </Label>
                              <p className="text-sm text-gray-500 mt-1">{method.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Tips */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs">💡</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-green-900 mb-1">Conseils pour la livraison</h4>
                          <ul className="text-sm text-green-800 space-y-1">
                            <li>• Indiquez le poids exact pour éviter les frais supplémentaires</li>
                            <li>• Les dimensions doivent inclure l'emballage</li>
                            <li>• Plus d'options de livraison = plus de clients satisfaits</li>
                            <li>• Le retrait en magasin réduit les coûts de livraison</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step Content - Specifications */}
            {currentStep === 5 && (
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Sub-step 1: Technical Specifications */}
                {currentSubStep === 0 && (
                  <>
                    {/* Specifications List */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium text-gray-900">Caractéristiques du produit</h3>
                      <p className="text-gray-600">Listez toutes les spécifications importantes pour aider les clients à faire leur choix</p>

                      <div className="space-y-4">
                        {formData.specifications.map((spec, index) => (
                          <div key={index} className="flex gap-4 items-end p-4 border border-gray-200 rounded-lg">
                            <div className="flex-1 space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Caractéristique
                              </Label>
                              <Input
                                placeholder="Ex: Taille d'écran, Processeur, Mémoire RAM..."
                                value={spec.name}
                                onChange={(e) => {
                                  const updatedSpecs = [...formData.specifications];
                                  updatedSpecs[index].name = e.target.value;
                                  handleInputChange('specifications', updatedSpecs);
                                }}
                                className="h-12 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Valeur
                              </Label>
                              <Input
                                placeholder="Ex: 6.1 pouces, Snapdragon 8 Gen 2, 8GB..."
                                value={spec.value}
                                onChange={(e) => {
                                  const updatedSpecs = [...formData.specifications];
                                  updatedSpecs[index].value = e.target.value;
                                  handleInputChange('specifications', updatedSpecs);
                                }}
                                className="h-12 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const updatedSpecs = formData.specifications.filter((_, i) => i !== index);
                                handleInputChange('specifications', updatedSpecs);
                              }}
                              className="h-12 px-4 border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            handleInputChange('specifications', [...formData.specifications, { name: '', value: '' }]);
                          }}
                          className="w-full h-12 border-2 border-dashed border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Ajouter une spécification
                        </Button>
                      </div>

                      {formData.specifications.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-2">Aucune spécification ajoutée</p>
                          <p className="text-sm text-gray-500">Cliquez sur "Ajouter une spécification" pour commencer</p>
                        </div>
                      )}
                    </div>

                    {/* Preview */}
                    {formData.specifications.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Aperçu</h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 mb-4">Spécifications du produit</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formData.specifications.map((spec, index) => (
                              spec.name && spec.value && (
                                <div key={index} className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                                  <span className="font-medium text-gray-700">{spec.name}:</span>
                                  <span className="text-gray-900">{spec.value}</span>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Specifications Tips */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs">ℹ</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-blue-900 mb-1">Spécifications importantes</h4>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Incluez les caractéristiques techniques principales</li>
                            <li>• Mentionnez les dimensions, poids, matériaux</li>
                            <li>• Précisez les compatibilités et connectivités</li>
                            <li>• Ajoutez les certifications et normes respectées</li>
                            <li>• Plus de détails = plus de confiance des clients</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons - Fixed at bottom */}
          <div className="flex gap-4 border-t border-gray-200 bg-white px-6 py-4 flex-shrink-0 shadow-lg">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 0 && currentSubStep === 0 ? onClose : handlePrevious}
              className="flex items-center gap-2 h-12 px-6 text-sm border-gray-300 text-gray-700 hover:bg-gray-100 font-medium"
            >
              {currentStep === 0 && currentSubStep === 0 ? (
                <>
                  <X className="h-4 w-4" />
                  Annuler
                </>
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </>
              )}
            </Button>

            <div className="flex-1" />

            {getCurrentStepNumber() < getTotalSteps() ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 h-12 px-8 text-base bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                Suivant
                <ChevronRight className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="flex items-center gap-2 h-12 px-8 text-base bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                <CheckSquare className="h-5 w-5" />
                {product ? 'Modifier le produit' : 'Ajouter le produit'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}