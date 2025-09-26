import React, { useState, useEffect } from "react";
import { ArrowLeft, Star, Heart, Share2, ShoppingCart, Shield, Truck, RotateCcw, MessageCircle, Plus, Minus, Store, Loader2, AlertCircle, CheckCircle, ShoppingBag } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { CartDrawer } from "./CartDrawer";
import { useCart } from "./CartContext";
import { useAuth } from "./AuthContext";
import { toast } from 'sonner';
import productService from '../services/productService';
import { Product, Review, getImageUrl } from '../services/api';

interface ProductDetailPageProps {
  productId: string;
  onBack: () => void;
  onProductClick: (product: any) => void;
  onNavigateToCheckout?: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToRegister?: () => void;
}

export function ProductDetailPage({
  productId,
  onBack,
  onProductClick,
  onNavigateToCheckout,
  onNavigateToLogin,
  onNavigateToRegister
}: ProductDetailPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  const { addToCart, items } = useCart();
  const { isAuthenticated, user } = useAuth();

  // Vérifier si l'utilisateur est un vendeur
  const isSeller = user?.role === 'seller';
  const canPurchase = isAuthenticated && !isSeller;

  // Fonction utilitaire pour formater le prix
  const formatPrice = (price: any): string => {
    if (price === undefined || price === null) return 'Prix non disponible';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'Prix non disponible';
    return numPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' });
  };

  // Charger les données du produit
  useEffect(() => {
    const loadProductData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔎 ProductDetailPage: Chargement du produit ID:', productId);

        // Charger les détails du produit
        const productResponse = await productService.getProductById(productId);
        console.log('🔎 ProductDetailPage: Réponse API produit:', productResponse);

        if (productResponse.success && productResponse.data) {
          console.log('🔎 ProductDetailPage: Données du produit:', productResponse.data);
          // Handle both direct product object and wrapped {product: ...} format
          const productData = (productResponse.data as any).product || productResponse.data;

          // Convert image URL to full URL
          if (productData.image) {
            productData.image = getImageUrl(productData.image);
          }

          setProduct(productData);
        } else {
          setError(productResponse.error || 'Produit non trouvé');
          return;
        }

        // Charger les avis
        const reviewsResponse = await productService.getProductReviews(productId, 1, 5);
        if (reviewsResponse.success && reviewsResponse.data) {
          setReviews(reviewsResponse.data.reviews);
        }

        // Charger les produits similaires (même catégorie)
        if (productResponse.data?.category) {
          const relatedResponse = await productService.getProductsByCategory(productResponse.data.category, { limit: 4 });
          if (relatedResponse.success && relatedResponse.data) {
            const relatedProductsWithImages = relatedResponse.data.products
              .filter(p => p.id !== productResponse.data?.id)
              .map(p => ({
                ...p,
                image: p.image ? getImageUrl(p.image) : ''
              }));
            setRelatedProducts(relatedProductsWithImages);
          }
        }

      } catch (err) {
        console.error('Erreur lors du chargement du produit:', err);
        setError('Erreur lors du chargement du produit');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProductData();
    }
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;

    // Vérifier si l'utilisateur est un vendeur (les vendeurs ne peuvent pas acheter)
    if (isSeller) {
      toast.info("Mode vendeur", {
        description: "Vous êtes en mode vendeur. Utilisez un compte acheteur pour faire des achats.",
        duration: 3000,
      });
      return;
    }

    // Validation des options requises
    if (product.stock <= 0) {
      toast.error("Produit en rupture de stock", {
        description: "Ce produit n'est plus disponible",
        duration: 3000,
      });
      return;
    }

    // Créer un produit temporaire avec les options sélectionnées pour l'ajout au panier
    const productWithOptions = {
      ...product,
      selectedSize,
      selectedColor
    };

    // Ajouter au panier la quantité sélectionnée
    for (let i = 0; i < quantity; i++) {
      addToCart(productWithOptions);
    }

    // Toast de confirmation avec détails
    const optionsText = [
      selectedSize && `Taille: ${selectedSize}`,
      selectedColor && `Couleur: ${selectedColor}`,
      `Quantité: ${quantity}`
    ].filter(Boolean).join(' • ');

    toast.success(`${product.name} ajouté au panier`, {
      description: `Chez ${product.shop_name} • ${formatPrice(product.price)} F CFA${optionsText ? ` • ${optionsText}` : ''}`,
      duration: 3000,
    });
  };

  const handleBuyNow = () => {
    if (!product) return;

    // Vérifier si l'utilisateur est un vendeur (les vendeurs ne peuvent pas acheter)
    if (isSeller) {
      toast.info("Mode vendeur", {
        description: "Vous êtes en mode vendeur. Utilisez un compte acheteur pour faire des achats.",
        duration: 3000,
      });
      return;
    }

    // Pour les utilisateurs non connectés, rediriger vers l'inscription
    if (!isAuthenticated) {
      toast.info("Inscription requise", {
        description: "Créez un compte pour effectuer vos achats",
        duration: 3000,
      });

      // Rediriger vers la page d'inscription après un délai
      setTimeout(() => {
        if (onNavigateToLogin) {
          onNavigateToLogin();
        }
      }, 500);
      return;
    }

    if (product.stock <= 0) {
      toast.error("Produit en rupture de stock", {
        description: "Ce produit n'est plus disponible",
        duration: 3000,
      });
      return;
    }

    // Créer un produit temporaire avec les options sélectionnées pour l'ajout au panier
    const productWithOptions = {
      ...product,
      selectedSize,
      selectedColor
    };

    // Ajouter au panier la quantité sélectionnée
    for (let i = 0; i < quantity; i++) {
      addToCart(productWithOptions);
    }

    // Toast de confirmation
    toast.success("Produit ajouté au panier - Redirection vers le checkout", {
      description: `${product.name} • ${formatPrice(product.price)} F CFA`,
      duration: 2000,
    });

    // Naviguer vers checkout après un délai pour que l'utilisateur voie le toast
    setTimeout(() => {
      if (onNavigateToCheckout) {
        onNavigateToCheckout();
      }
    }, 500);
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    if (!product) return;

    if (!isFavorite) {
      toast.success(`${product.name} ajouté aux favoris`, {
        description: "Retrouvez ce produit dans votre dashboard",
        duration: 2000,
      });
    } else {
      toast.info(`${product.name} retiré des favoris`, {
        duration: 2000,
      });
    }
  };

  const handleShare = () => {
    if (!product) return;

    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Découvrez ${product.name} chez ${product.shop_name} sur SOMBA`,
        url: window.location.href,
      });
    } else {
      // Fallback pour copier l'URL
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié dans le presse-papier", {
        description: "Vous pouvez maintenant partager ce produit",
        duration: 2000,
      });
    }
  };

  const handleSubmitReview = async () => {
    if (!product || !isAuthenticated) return;

    if (reviewRating < 1 || reviewRating > 5) {
      toast.error("Veuillez sélectionner une note valide");
      return;
    }

    if (!reviewComment.trim()) {
      toast.error("Veuillez écrire un commentaire");
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await productService.addProductReview(product.id.toString(), {
        rating: reviewRating,
        comment: reviewComment.trim()
      });

      if (response.success) {
        toast.success("Avis ajouté avec succès", {
          description: "Merci pour votre retour !",
          duration: 3000,
        });

        // Refresh reviews
        const reviewsResponse = await productService.getProductReviews(product.id.toString(), 1, 5);
        if (reviewsResponse.success && reviewsResponse.data) {
          setReviews(reviewsResponse.data.reviews);
        }

        // Reset form
        setReviewRating(5);
        setReviewComment("");
        setShowReviewDialog(false);
      } else {
        toast.error(response.error || "Erreur lors de l'ajout de l'avis");
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error("Erreur lors de l'ajout de l'avis");
    } finally {
      setSubmittingReview(false);
    }
  };

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error || 'Produit non trouvé'}</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux produits
          </Button>
        </div>
      </div>
    );
  }

  // Vérification supplémentaire des données essentielles
  console.log('🔎 ProductDetailPage: Vérification des données complètes:', {
    name: product.name,
    nameType: typeof product.name,
    price: product.price,
    priceType: typeof product.price,
    hasName: !!product.name,
    hasPrice: product.price !== undefined && product.price !== null,
    fullProduct: product
  });

  // Vérification plus permissive - seulement si vraiment critique
  if (!product.name || product.name.trim() === '') {
    console.error('🔎 ProductDetailPage: Nom du produit manquant:', product);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Données incomplètes</h2>
          <p className="text-gray-600 mb-4">Le nom du produit est manquant.</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux produits
          </Button>
        </div>
      </div>
    );
  }

  // Images par défaut pour la galerie
  const productImages = (() => {
    // Ensure product.images is an array
    let images = [];
    if (product.images) {
      if (Array.isArray(product.images)) {
        images = product.images;
      } else if (typeof product.images === 'string') {
        // If it's a string, try to parse as JSON or treat as single image
        try {
          const parsed = JSON.parse(product.images);
          images = Array.isArray(parsed) ? parsed : [product.images];
        } catch {
          images = [product.images];
        }
      }
    }

    // If no images, use the main product image
    if (images.length === 0 && product.image) {
      images = [getImageUrl(product.image)];
    }

    return images;
  })();

  // Debug: Afficher les données du produit
  console.log('🔎 ProductDetailPage: Produit rendu:', product);

  return (
    <div className="min-h-screen bg-white">
      {/* Header professionnel */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-gray-700 hover:bg-gray-100 font-medium px-4 py-2 transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour aux produits
            </Button>

            <nav className="flex items-center space-x-2" role="navigation" aria-label="Actions produit">
              <CartDrawer
                onNavigateToLogin={onNavigateToLogin}
                onNavigateToRegister={onNavigateToRegister}
                onNavigateToCheckout={onNavigateToCheckout}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:bg-green-50 hover:text-green-600 px-3 py-2 transition-all duration-200 relative"
                  title="Voir le panier"
                  aria-label="Voir votre panier d'achats"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {items.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-somba-accent">
                      {items.length}
                    </Badge>
                  )}
                </Button>
              </CartDrawer>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFavorite}
                className="text-gray-600 hover:bg-red-50 hover:text-red-600 px-3 py-2 transition-all duration-200"
                title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                aria-label={isFavorite ? "Retirer ce produit des favoris" : "Ajouter ce produit aux favoris"}
                aria-pressed={isFavorite}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-gray-600 hover:bg-blue-50 hover:text-blue-600 px-3 py-2 transition-all duration-200"
                title="Partager ce produit"
                aria-label="Partager ce produit sur les réseaux sociaux"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Galerie d'images professionnelle */}
          <section className="space-y-4" aria-labelledby="product-gallery">
            <h2 id="product-gallery" className="sr-only">Galerie d'images du produit</h2>

            {/* Image principale */}
            <div className="relative group">
              <div className="relative aspect-square bg-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                <ImageWithFallback
                  src={productImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />

                {/* Overlay avec icône zoom */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white rounded-full p-3 shadow-lg">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>

                {/* Badge stock */}
                {product.stock > 0 && (
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    ✓ En stock ({product.stock})
                  </div>
                )}
              </div>
            </div>

            {/* Miniatures */}
            {productImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 border-2 rounded transition-all duration-200 ${
                      selectedImage === index
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    aria-label={`Voir image ${index + 1}`}
                  >
                    <ImageWithFallback
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Informations produit professionnelles */}
          <section className="space-y-6" aria-labelledby="product-info">
            <h2 id="product-info" className="sr-only">Informations du produit</h2>

            {/* Catégorie et titre */}
            <div>
              <div className="text-sm text-blue-600 font-medium mb-2">{product.category}</div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                {product.name}
              </h1>

              {/* Rating et avis */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 font-medium">
                  {(product.rating || 0).toFixed(1)} ({product.reviews_count || 0} avis)
                </span>
              </div>
            </div>

            {/* Prix professionnel */}
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {formatPrice(product.price)} F CFA
              </div>
              <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Livraison gratuite
              </div>
            </div>

            {/* Options (si disponibles) */}
            <div className="space-y-4">
              {/* Quantité */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-3 py-1 border border-gray-300 rounded text-center min-w-[3rem]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {product.stock} unités disponibles
                </div>
              </div>
            </div>

            {/* Boutons d'action professionnels */}
            <div className="space-y-3">
              <Button
                onClick={handleBuyNow}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                disabled={product.stock <= 0}
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Acheter maintenant
              </Button>

              <Button
                onClick={handleAddToCart}
                variant="outline"
                className="w-full border-2 border-orange-500 text-orange-500 hover:bg-orange-50 font-bold py-3 px-6 rounded-lg transition-all duration-200"
                disabled={product.stock <= 0}
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Ajouter au panier
              </Button>
            </div>

            {/* Informations de livraison et garanties */}
            <div className="space-y-3 border-t pt-6">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Truck className="h-5 w-5 text-green-600" />
                <span>Livraison gratuite • Expédition sous 24h</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Garantie vendeur • Retour sous 30 jours</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <RotateCcw className="h-5 w-5 text-purple-600" />
                <span>Retour gratuit • Service client 24/7</span>
              </div>
            </div>

            {/* Informations sur la boutique */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                  {product.shop_logo ? (
                    <ImageWithFallback
                      src={getImageUrl(product.shop_logo)}
                      alt={product.shop_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-lg">{product.shop_name}</div>
                  <div className="text-sm text-gray-600 mb-2">Boutique vérifiée</div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{(product.rating || 0).toFixed(1)}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span>{product.reviews_count || 0} avis</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Onglets d'information professionnels */}
        <section className="border-t pt-8">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-somba-primary/5 to-somba-accent/5 rounded-xl p-1 mb-8 shadow-sm border border-somba-primary/10">
              <TabsTrigger
                value="description"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-somba-primary/20 rounded-lg py-4 px-6 text-sm font-semibold text-gray-700 data-[state=active]:text-somba-primary transition-all duration-300 hover:bg-white/50"
              >
                📋 Description du produit
              </TabsTrigger>
              <TabsTrigger
                value="specifications"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-somba-primary/20 rounded-lg py-4 px-6 text-sm font-semibold text-gray-700 data-[state=active]:text-somba-primary transition-all duration-300 hover:bg-white/50"
              >
                ⚙️ Caractéristiques
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-somba-primary/20 rounded-lg py-4 px-6 text-sm font-semibold text-gray-700 data-[state=active]:text-somba-primary transition-all duration-300 hover:bg-white/50"
              >
                ⭐ Avis clients ({product.reviews_count})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Description du produit</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specifications" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Caractéristiques techniques</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-900">Marque</span>
                      <span className="text-gray-700">{product.shop_name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-900">Catégorie</span>
                      <span className="text-gray-700">{product.category}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-900">Stock disponible</span>
                      <span className="text-gray-700">{product.stock} unités</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-900">Évaluation</span>
                      <span className="text-gray-700">{(product.rating || 0).toFixed(1)}/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Avis clients</h3>
                    <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-somba-primary text-somba-primary hover:bg-somba-primary hover:text-white"
                          onClick={() => {
                            if (!isAuthenticated) {
                              toast.info("Connexion requise", {
                                description: "Veuillez vous connecter pour donner votre avis",
                                duration: 3000,
                              });
                              if (onNavigateToLogin) onNavigateToLogin();
                              return;
                            }
                            setShowReviewDialog(true);
                          }}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Écrire un avis
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Donner votre avis</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Note (1-5 étoiles)
                            </label>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setReviewRating(star)}
                                  className="focus:outline-none"
                                >
                                  <Star
                                    className={`h-6 w-6 ${
                                      star <= reviewRating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Votre commentaire
                            </label>
                            <Textarea
                              placeholder="Partagez votre expérience avec ce produit..."
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              rows={4}
                              className="resize-none"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => setShowReviewDialog(false)}
                            >
                              Annuler
                            </Button>
                            <Button
                              onClick={handleSubmitReview}
                              disabled={submittingReview}
                              className="bg-somba-primary hover:bg-somba-primary/90"
                            >
                              {submittingReview ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Publier l'avis
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Résumé des avis */}
                  <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-amber-400 fill-current" />
                      ))}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{(product.rating || 0).toFixed(1)} sur 5</div>
                      <div className="text-sm text-gray-600">Basé sur {product.reviews_count} avis</div>
                    </div>
                  </div>

                  {/* Liste des avis */}
                  <div className="space-y-4">
                    {reviews.length > 0 ? (
                      reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {review.reviewer_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">{review.reviewer_name}</span>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < review.rating
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-gray-700 text-sm mb-2">{review.comment}</p>
                              <div className="text-xs text-gray-500">
                                {review.created_at ? new Date(review.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Aucun avis pour le moment.</p>
                        <p className="text-sm text-gray-400 mt-1">Soyez le premier à donner votre avis !</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Produits similaires professionnels */}
        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <div className="border-b border-gray-300 pb-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Produits similaires dans {product.category}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Card
                  key={relatedProduct.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-200"
                  onClick={() => onProductClick(relatedProduct)}
                >
                  <div className="aspect-square overflow-hidden rounded-t-lg">
                    <ImageWithFallback
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                      {relatedProduct.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">({(relatedProduct.rating || 0).toFixed(1)})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-gray-900">
                        {formatPrice(relatedProduct.price)} F CFA
                      </div>
                      <div className="text-xs text-gray-500">
                        {relatedProduct.reviews_count} avis
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}