import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { X, Package, Upload, Image as ImageIcon, Trash2, Plus, Minus, ChevronRight, ChevronLeft, DollarSign, CheckSquare, Palette, Zap } from 'lucide-react';
import { useStores } from './StoresContext';

interface ProductVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: any) => void;
  product?: any | null;
  sellerId: number;
}

interface VariantAttribute {
  id: string;
  name: string;
  values: string[];
}

interface VariantCombination {
  id: string;
  attributes: { [key: string]: string };
  price: number;
  stock: number;
  sku: string;
  image?: string;
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

export function ProductVariantModal({ isOpen, onClose, onSave, product, sellerId }: ProductVariantModalProps) {
  const { getStoresBySeller } = useStores();
  const sellerStores = getStoresBySeller(sellerId);

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Basic Product Information
    name: '',
    description: '',
    category: '',
    brand: '',
    mainImage: '',
    images: [] as string[],

    // Variant Attributes
    attributes: [] as VariantAttribute[],

    // Generated Variants
    variants: [] as VariantCombination[],

    // Store
    boutique: '',

    // Status
    isActive: true
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  // const [selectedImage, setSelectedImage] = useState<File | null>(null); // Supprimé car inutilisé
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    {
      id: 'basic',
      title: 'Informations de base',
      icon: Package,
      description: 'Nom, catégorie et boutique du produit'
    },
    {
      id: 'attributes',
      title: 'Attributs de variantes',
      icon: Palette,
      description: 'Définir les attributs (couleur, taille, etc.)'
    },
    {
      id: 'variants',
      title: 'Génération des variantes',
      icon: Zap,
      description: 'Créer automatiquement toutes les combinaisons'
    },
    {
      id: 'pricing',
      title: 'Prix et stock',
      icon: DollarSign,
      description: 'Définir les prix et quantités pour chaque variante'
    },
    {
      id: 'images',
      title: 'Images',
      icon: ImageIcon,
      description: 'Ajouter les images du produit'
    }
  ];

  useEffect(() => {
    if (product) {
      // Load existing product data
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        brand: product.brand || '',
        mainImage: product.mainImage || product.image || '',
        images: product.images || [],
        attributes: product.attributes || [],
        variants: product.variants || [],
        boutique: product.boutique || '',
        isActive: product.isActive !== false
      });
      setImagePreview(product.mainImage || product.image || '');
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        description: '',
        category: '',
        brand: '',
        mainImage: '',
        images: [],
        attributes: [],
        variants: [],
        boutique: '',
        isActive: true
      });
      setImagePreview('');
    }
    setErrors({});
    setCurrentStep(0);
  }, [product]);

  // Set default store when not editing
  useEffect(() => {
    if (!product && sellerStores.length > 0 && !formData.boutique) {
      setFormData(prev => ({ ...prev, boutique: sellerStores[0].name }));
    }
  }, [product, sellerStores, formData.boutique]);

  // 🔹 Algorithme : Générer automatiquement toutes les combinaisons de variantes
  const generateVariantCombinations = (attributes: VariantAttribute[]): VariantCombination[] => {
    if (attributes.length === 0) return [];

    // Commencer avec une variante vide
    let combinations: VariantCombination[] = [{ id: '', attributes: {}, price: 0, stock: 0, sku: '' }];

    // Pour chaque attribut, multiplier les combinaisons existantes
    for (const attribute of attributes) {
      const newCombinations: VariantCombination[] = [];

      for (const existingCombo of combinations) {
        for (const value of attribute.values) {
          const newCombo: VariantCombination = {
            id: generateVariantId(),
            attributes: { ...existingCombo.attributes, [attribute.name]: value },
            price: 0,
            stock: 0,
            sku: generateSKU(formData.name, { ...existingCombo.attributes, [attribute.name]: value })
          };
          newCombinations.push(newCombo);
        }
      }

      combinations = newCombinations;
    }

    return combinations;
  };

  // Générer un ID unique pour une variante
  const generateVariantId = (): string => {
    return `variant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Générer un SKU automatique
  const generateSKU = (productName: string, attributes: { [key: string]: string }): string => {
    const baseName = productName.substring(0, 3).toUpperCase();
    const attributeCodes = Object.values(attributes).map(val => val.substring(0, 2).toUpperCase()).join('');
    const timestamp = Date.now().toString().substr(-4);
    return `${baseName}${attributeCodes}${timestamp}`;
  };

  // Ajouter un nouvel attribut
  const addAttribute = () => {
    const newAttribute: VariantAttribute = {
      id: `attr_${Date.now()}`,
      name: '',
      values: ['']
    };
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, newAttribute]
    }));
  };

  // Supprimer un attribut
  const removeAttribute = (attributeId: string) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter(attr => attr.id !== attributeId)
    }));
  };

  // Mettre à jour un attribut
  const updateAttribute = (attributeId: string, field: 'name' | 'values', value: any) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.map(attr =>
        attr.id === attributeId ? { ...attr, [field]: value } : attr
      )
    }));
  };

  // Ajouter une valeur à un attribut
  const addAttributeValue = (attributeId: string) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.map(attr =>
        attr.id === attributeId
          ? { ...attr, values: [...attr.values, ''] }
          : attr
      )
    }));
  };

  // Supprimer une valeur d'attribut
  const removeAttributeValue = (attributeId: string, valueIndex: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.map(attr =>
        attr.id === attributeId
          ? { ...attr, values: attr.values.filter((_, i) => i !== valueIndex) }
          : attr
      )
    }));
  };

  // Générer les variantes quand les attributs changent
  useEffect(() => {
    if (formData.attributes.length > 0 && formData.attributes.every(attr => attr.name && attr.values.length > 0)) {
      const combinations = generateVariantCombinations(formData.attributes);
      setFormData(prev => ({ ...prev, variants: combinations }));
    } else {
      setFormData(prev => ({ ...prev, variants: [] }));
    }
  }, [formData.attributes]);

  // Mettre à jour une variante
  const updateVariant = (variantId: string, field: 'price' | 'stock' | 'sku', value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(variant =>
        variant.id === variantId ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Only require essential fields
    if (!formData.name.trim()) {
      newErrors.name = "Le nom du produit est requis";
    }

    if (!formData.boutique) {
      newErrors.boutique = "La boutique est requise";
    }

    // Make category optional - set default if not provided
    if (!formData.category) {
      formData.category = "Non catégorisé";
    }

    // Make description optional - set default if not provided
    if (!formData.description.trim()) {
      formData.description = "Aucune description disponible.";
    }

    // Validation des attributs (only if attributes exist)
    if (formData.attributes.length > 0) {
      formData.attributes.forEach((attr, index) => {
        if (!attr.name.trim()) {
          newErrors[`attribute_${index}_name`] = "Le nom de l'attribut est requis";
        }
        if (attr.values.length === 0 || attr.values.some(v => !v.trim())) {
          newErrors[`attribute_${index}_values`] = "Au moins une valeur est requise";
        }
      });
    }

    // Validation des variantes (only if variants exist and have been configured)
    if (formData.variants.length > 0) {
      formData.variants.forEach((variant, index) => {
        if (variant.price < 0) {
          newErrors[`variant_${index}_price`] = "Le prix ne peut pas être négatif";
        }
        if (variant.stock < 0) {
          newErrors[`variant_${index}_stock`] = "Le stock ne peut pas être négatif";
        }
      });
    }

    // If no variants but attributes exist, ensure at least basic variant info
    if (formData.attributes.length > 0 && formData.variants.length === 0) {
      // Allow creation without variants even if attributes are defined
      // The backend will handle this case
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    // Find the selected store
    const selectedStore = sellerStores.find(store => store.name === formData.boutique);

    const productData = {
      ...formData,
      id: product?.id || Date.now(),
      storeId: selectedStore?.id,
      mainImage: imagePreview || formData.mainImage,
      images: formData.images.length > 0 ? formData.images : [imagePreview].filter(Boolean),
      // Convert price strings to formatted currency
      variants: formData.variants.map(variant => ({
        ...variant,
        price: `${variant.price.toLocaleString()} F CFA`
      }))
    };

    onSave(productData);
    toast.success(product ? "Produit modifié avec succès" : "Produit créé avec succès");
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

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, mainImage: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setImagePreview('');
    setFormData(prev => ({ ...prev, mainImage: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleNext = () => {
    // Allow skipping to any step, but validate current step if necessary
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getProgressPercentage = () => {
    return Math.round(((currentStep + 1) / steps.length) * 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl border-0 p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>{product ? 'Modifier le produit' : 'Créer un produit avec variantes'}</DialogTitle>
          <DialogDescription>Créez un produit avec des variantes comme sur Amazon</DialogDescription>
        </DialogHeader>

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {product ? 'Modifier le produit' : 'Créer un produit avec variantes'}
                </h1>
                <p className="text-gray-600 text-sm">
                  Créez un produit avec des variantes comme sur Amazon
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

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">
              Étape {currentStep + 1} sur {steps.length}
            </h3>
            <span className="text-sm text-gray-500">
              {getProgressPercentage()}% terminé
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>

          {/* Current Step Title */}
          <div className="text-center">
            <h4 className="text-lg font-bold text-gray-900">{steps[currentStep].title}</h4>
            <p className="text-gray-600 text-sm mt-1">
              {steps[currentStep].description}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6">

            {/* Step 1: Basic Information */}
            {currentStep === 0 && (
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="grid grid-cols-1 gap-6">
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
                      placeholder="Ex: T-shirt coton premium"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  {/* Category and Store */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm font-medium text-gray-900">
                        Catégorie
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

                  {/* Brand */}
                  <div className="space-y-2">
                    <Label htmlFor="brand" className="text-sm font-medium text-gray-900">
                      Marque
                    </Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
                      placeholder="Ex: MyBrand"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-900">
                      Description détaillée
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="min-h-[100px] border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 resize-none"
                      placeholder="Décrivez votre produit en détail..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Variant Attributes */}
            {currentStep === 1 && (
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Attributs de variantes</h3>
                      <p className="text-gray-600 text-sm">Définissez les attributs qui différencient vos variantes (couleur, taille, etc.)</p>
                    </div>
                    <Button
                      type="button"
                      onClick={addAttribute}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un attribut
                    </Button>
                  </div>

                  {formData.attributes.map((attribute, attrIndex) => (
                    <Card key={attribute.id} className="border border-gray-200">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Attribute Name */}
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <Label className="text-sm font-medium text-gray-900">
                                Nom de l'attribut <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                value={attribute.name}
                                onChange={(e) => updateAttribute(attribute.id, 'name', e.target.value)}
                                className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 mt-1"
                                placeholder="Ex: Couleur, Taille, Capacité"
                              />
                              {errors[`attribute_${attrIndex}_name`] && (
                                <p className="text-red-500 text-xs mt-1">{errors[`attribute_${attrIndex}_name`]}</p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeAttribute(attribute.id)}
                              className="border-red-300 text-red-600 hover:bg-red-50 mt-6"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Attribute Values */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium text-gray-900">
                                Valeurs <span className="text-red-500">*</span>
                              </Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addAttributeValue(attribute.id)}
                                className="border-orange-300 text-orange-600 hover:bg-orange-50"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Ajouter une valeur
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {attribute.values.map((value, valueIndex) => (
                                <div key={valueIndex} className="flex items-center gap-2">
                                  <Input
                                    value={value}
                                    onChange={(e) => {
                                      const newValues = [...attribute.values];
                                      newValues[valueIndex] = e.target.value;
                                      updateAttribute(attribute.id, 'values', newValues);
                                    }}
                                    className="h-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
                                    placeholder={`Valeur ${valueIndex + 1}`}
                                  />
                                  {attribute.values.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeAttributeValue(attribute.id, valueIndex)}
                                      className="text-red-500 hover:bg-red-50 p-2"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>

                            {errors[`attribute_${attrIndex}_values`] && (
                              <p className="text-red-500 text-xs">{errors[`attribute_${attrIndex}_values`]}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {formData.attributes.length === 0 && (
                    <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
                      <CardContent className="p-8 text-center">
                        <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun attribut défini</h3>
                        <p className="text-gray-600">Ajoutez des attributs pour créer des variantes de votre produit</p>
                        <Button onClick={addAttribute} className="bg-orange-500 hover:bg-orange-600 mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter le premier attribut
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Preview of combinations */}
                  {formData.attributes.length > 0 && (
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <Zap className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-green-900">Aperçu des combinaisons</h4>
                            <p className="text-sm text-green-700">
                              {formData.variants.length} variante(s) seront générée(s) automatiquement
                            </p>
                          </div>
                        </div>

                        {formData.variants.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-green-900">Exemples de variantes :</p>
                            <div className="flex flex-wrap gap-2">
                              {formData.variants.slice(0, 5).map((variant) => (
                                <Badge key={variant.id} variant="outline" className="border-green-300 text-green-700">
                                  {Object.entries(variant.attributes).map(([key, value]) => `${key}: ${value}`).join(', ')}
                                </Badge>
                              ))}
                              {formData.variants.length > 5 && (
                                <Badge variant="outline" className="border-green-300 text-green-700">
                                  +{formData.variants.length - 5} autres...
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Generated Variants */}
            {currentStep === 2 && (
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Variantes générées</h3>
                      <p className="text-gray-600 text-sm">
                        {formData.variants.length} variantes créées automatiquement
                      </p>
                    </div>
                  </div>

                  {formData.variants.length > 0 ? (
                    <div className="space-y-4">
                      {formData.variants.map((variant, index) => (
                        <Card key={variant.id} className="border border-gray-200">
                          <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                              {/* Variant Attributes */}
                              <div className="md:col-span-2">
                                <h4 className="font-semibold text-gray-900 mb-3">Attributs</h4>
                                <div className="space-y-2">
                                  {Object.entries(variant.attributes).map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                      <span className="text-gray-600">{key}:</span>
                                      <Badge variant="outline">{value}</Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Price */}
                              <div>
                                <Label className="text-sm font-medium text-gray-900">
                                  Prix (F CFA) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  type="number"
                                  value={variant.price}
                                  onChange={(e) => updateVariant(variant.id, 'price', parseFloat(e.target.value) || 0)}
                                  className={`h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 mt-1 ${errors[`variant_${index}_price`] ? 'border-red-500' : ''}`}
                                  placeholder="25000"
                                />
                                {errors[`variant_${index}_price`] && (
                                  <p className="text-red-500 text-xs mt-1">{errors[`variant_${index}_price`]}</p>
                                )}
                              </div>

                              {/* Stock */}
                              <div>
                                <Label className="text-sm font-medium text-gray-900">
                                  Stock <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  type="number"
                                  value={variant.stock}
                                  onChange={(e) => updateVariant(variant.id, 'stock', parseInt(e.target.value) || 0)}
                                  className={`h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 mt-1 ${errors[`variant_${index}_stock`] ? 'border-red-500' : ''}`}
                                  placeholder="10"
                                />
                                {errors[`variant_${index}_stock`] && (
                                  <p className="text-red-500 text-xs mt-1">{errors[`variant_${index}_stock`]}</p>
                                )}
                              </div>
                            </div>

                            {/* SKU */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-900">SKU généré</Label>
                                  <Input
                                    value={variant.sku}
                                    onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                                    className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 mt-1"
                                    placeholder="SKU automatique"
                                  />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
                      <CardContent className="p-8 text-center">
                        <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune variante générée</h3>
                        <p className="text-gray-600">Ajoutez des attributs à l'étape précédente pour générer des variantes</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Images */}
            {currentStep === 3 && (
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Main Image */}
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

                {/* Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">💡</span>
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
            )}

          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 border-t border-gray-200 bg-white px-6 py-4 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 0 ? onClose : handlePrevious}
              className="flex items-center gap-2 h-12 px-6 text-sm border-gray-300 text-gray-700 hover:bg-gray-100 font-medium"
            >
              {currentStep === 0 ? (
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

            {currentStep < steps.length - 1 ? (
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
                {product ? 'Modifier le produit' : 'Créer le produit'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}