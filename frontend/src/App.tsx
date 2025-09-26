import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, useParams } from "react-router-dom";
import { NavigationHeader } from "./components/NavigationHeader";
import { FilterBar } from "./components/FilterBar";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailPage } from "./components/ProductDetailPage";
import { StoresPage } from "./components/StoresPage";
import { HomePage } from "./components/HomePage";
import { DashboardPage } from "./components/DashboardPage";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { OTPVerificationPage } from "./components/OTPVerificationPage";
import { EmailWaitingPage } from "./components/EmailWaitingPage";
import { EmailConfirmationSuccess } from "./components/EmailConfirmationSuccess";
import { CheckoutPage } from "./components/CheckoutPage";
import { SellerDashboard } from "./components/SellerDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { FacebookPasswordRecovery } from "./components/FacebookPasswordRecovery";
import { ResetPasswordPage } from "./components/ResetPasswordPage";
import DeliveryDashboard from "./components/DeliveryDashboard";
import { Footer } from "./components/Footer";
import { CartProvider } from "./components/CartContext";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { ShopsProvider, useShops } from "./contexts/ShopsContext";
import { StoresProvider } from "./components/StoresContext";
import { ProductsProvider } from "./components/ProductsContext";
import { Toaster } from "./components/ui/sonner";
import productService from "./services/productService";
import { getImageUrl } from "./services/api";
import { toast } from "sonner";

// Updated Product interface to match API
interface Product {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  boutique: string;
  isOnSale?: boolean;
  category: string;
  description?: string;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  sizes?: string[];
  colors?: string[];
  specifications?: { [key: string]: string };
  images?: string[];
  stock?: number;
}

// Component to handle product detail with ID fetching
function ProductDetailWrapper({ onProductClick, onNavigateToCheckout, onNavigateToRegister, products }: {
  onProductClick: (product: Product) => void;
  onNavigateToCheckout: () => void;
  onNavigateToRegister?: () => void;
  products: Product[];
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      console.log('🔍 ProductDetailWrapper: useEffect triggered with id:', id);

      if (!id) {
        console.error('❌ ProductDetailWrapper: ID du produit manquant');
        setError('ID du produit manquant');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const productId = parseInt(id);
        console.log('🔍 ProductDetailWrapper: Parsed product ID:', productId);

        if (isNaN(productId)) {
          console.error('❌ ProductDetailWrapper: ID du produit invalide:', id);
          setError('ID du produit invalide');
          setLoading(false);
          return;
        }

        console.log('📡 ProductDetailWrapper: Calling productService.getProductById...');
        // Try to fetch product from API
        const response = await productService.getProductById(productId.toString());
        console.log('📡 ProductDetailWrapper: API Response received:', response);

        if (response.success && response.data) {
          console.log('✅ ProductDetailWrapper: Product found in API:', response.data);

          // Convert API product to frontend format
          const apiProduct = response.data;
          console.log('🔄 Converting API product:', apiProduct);

          // Format price safely (handle string from API)
          const formatPrice = (price: any): string => {
            if (price === undefined || price === null) return 'Prix non disponible';
            const numPrice = typeof price === 'string' ? parseFloat(price) : price;
            if (isNaN(numPrice)) return 'Prix non disponible';
            return numPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' });
          };

          const convertedProduct: Product = {
            id: apiProduct.id,
            name: apiProduct.name || 'Produit sans nom',
            price: formatPrice(apiProduct.price),
            image: getImageUrl(apiProduct.image) || '',
            boutique: apiProduct.shop_name || 'Boutique inconnue',
            category: apiProduct.category || 'Non catégorisé',
            description: apiProduct.description || 'Aucune description disponible.',
            rating: 4.5,
            reviews: 0,
            inStock: (apiProduct.stock !== undefined) ? apiProduct.stock > 0 : true,
            sizes: [],
            colors: [],
            specifications: {}
          };

          console.log('✅ ProductDetailWrapper: Converted product:', convertedProduct);
          setProduct(convertedProduct);
          setRelatedProducts(products.filter(p => p.boutique === convertedProduct.boutique && p.id !== convertedProduct.id));
        } else {
          console.error('❌ ProductDetailWrapper: Product not found in API response');
          setError('Produit non trouvé');
        }
      } catch (err) {
        console.error('❌ ProductDetailWrapper: Error fetching product:', err);
        setError('Erreur lors du chargement du produit');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-somba-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Produit non trouvé</h2>
          <p className="text-gray-600 mb-6">{error || 'Le produit que vous recherchez n\'existe pas ou a été supprimé.'}</p>
          <button
            onClick={handleBack}
            className="bg-somba-accent hover:bg-somba-accent/90 text-white px-6 py-3 rounded-lg font-medium"
          >
            Retour aux produits
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProductDetailPage
      productId={id || ''}
      onBack={handleBack}
      onProductClick={onProductClick}
      onNavigateToCheckout={onNavigateToCheckout}
      onNavigateToLogin={() => navigate('/register')}
      onNavigateToRegister={() => navigate('/register')}
    />
  );
}

// Composant séparé qui utilise useShops
function AppWithStores() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { shops } = useShops();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [selectedStore, setSelectedStore] = useState("Tous");
  const [displayedProductsCount, setDisplayedProductsCount] = useState(12);
  const [dashboardTab] = useState('overview');
  const [productsLoading, setProductsLoading] = useState(true);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpUserId, setOtpUserId] = useState('');

  // Load PUBLIC products from API - COMPLETELY INDEPENDENT of ProductsContext
  const loadProducts = async () => {
    console.log('🏠 App: Starting loadProducts function...');
    setProductsLoading(true);
    try {
      console.log('🏠 App: Loading public products for homepage...');

      // Use direct axios call to avoid any ProductsContext interference
      const axios = (await import('axios')).default;
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

      console.log('🏠 App: Making direct API call to:', `${apiUrl}/products`);
      const response = await axios.get(`${apiUrl}/products`, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('🏠 App: Direct API response received:', response.data);

      if (response.data && response.data.products) {
        console.log('🏠 App: API products received:', response.data.products.length);
        console.log('🏠 App: First product sample:', response.data.products[0]);

        // Convert API products to frontend format
        const convertedProducts = response.data.products.map((apiProduct: any) => {
          console.log('🏠 App: Converting product:', {
            id: apiProduct.id,
            name: apiProduct.name,
            price: apiProduct.price,
            shop_name: apiProduct.shop_name
          });

          // Format price safely (handle string from API)
          const formatPrice = (price: any): string => {
            if (price === undefined || price === null) return 'Prix non disponible';
            const numPrice = typeof price === 'string' ? parseFloat(price) : price;
            if (isNaN(numPrice)) return 'Prix non disponible';
            return numPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' });
          };

          return {
            id: apiProduct.id,
            name: apiProduct.name || 'Produit sans nom',
            price: formatPrice(apiProduct.price),
            image: getImageUrl(apiProduct.image) || '',
            boutique: apiProduct.shop_name || 'Boutique inconnue',
            category: apiProduct.category || 'Non catégorisé',
            description: apiProduct.description || 'Aucune description disponible.',
            rating: 4.5, // Default rating, could be calculated from reviews
            reviews: 0, // Could be fetched separately
            inStock: (apiProduct.stock !== undefined) ? apiProduct.stock > 0 : true,
            sizes: [], // Could be derived from variants
            colors: [], // Could be derived from variants
            specifications: {} // Could be derived from variants
          };
        });

        console.log('🏠 App: Converted products:', convertedProducts.length);
        console.log('🏠 App: Setting products in state...');
        setProducts(convertedProducts);
        console.log('🏠 App: Products set successfully');
      } else {
        console.error('🏠 App: No products in response');
        toast.error('Aucun produit trouvé');
        setProducts([]);
      }
    } catch (error: any) {
      console.error('🏠 App: Error loading products:', error);
      console.error('🏠 App: Error details:', error.response?.data || error.message);
      toast.error('Erreur lors du chargement des produits');
      setProducts([]);
    } finally {
      console.log('🏠 App: Setting loading to false');
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Expose loadProducts globally so it can be called from other components
  useEffect(() => {
    (window as any).refreshGlobalProducts = loadProducts;
  }, []);

  const handleProductClick = (product: Product) => {
    console.log('🔗 handleProductClick called with product:', {
      id: product.id,
      name: product.name,
      boutique: product.boutique,
      price: product.price,
      category: product.category
    });
    console.log('🔗 Navigating to URL:', `/product/${product.id}`);

    // Vérifier que l'ID est valide
    if (!product.id || product.id <= 0) {
      console.error('❌ handleProductClick: ID du produit invalide:', product.id);
      return;
    }

    // Vérifier que le nom existe
    if (!product.name || product.name.trim() === '') {
      console.error('❌ handleProductClick: Nom du produit manquant:', product);
      return;
    }

    console.log('✅ handleProductClick: Navigation vers le produit valide');
    navigate(`/product/${product.id}`);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setSelectedStore("Tous");
    navigate('/articles');
    setDisplayedProductsCount(12);
  };

  const handleStoreProductsView = (storeName: string) => {
    setSelectedStore(storeName);
    setSelectedCategory("Tous");
    navigate('/articles');
    setDisplayedProductsCount(12);
  };

  const handleLoadMore = () => {
    setDisplayedProductsCount(prev => prev + 8);
  };

  const handleViewAllProducts = () => {
    setSelectedCategory("Tous");
    setSelectedStore("Tous");
    navigate('/articles');
    setDisplayedProductsCount(12);
  };

  const handleNavigateToCheckout = () => {
    navigate('/checkout');
  };

  const handleOTPVerificationSuccess = () => {
    navigate('/login');
    setOtpEmail('');
    setOtpUserId('');
  };

  const handleNavigateToEmailWaiting = (email: string) => {
    setOtpEmail(email);
    navigate('/email-waiting');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Filtrer les produits selon la catégorie et la boutique sélectionnées
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "Tous" || product.category === selectedCategory;
    const matchesStore = selectedStore === "Tous" || product.boutique === selectedStore;
    return matchesCategory && matchesStore;
  });

  const displayedProducts = filteredProducts.slice(0, displayedProductsCount);

  // Vérifier si l'utilisateur vient de confirmer son email
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('email_confirmed') === 'true') {
      toast.success("🎉 Email confirmé avec succès ! Vous pouvez maintenant vous connecter.");
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Redirection automatique pour les livreurs
  useEffect(() => {
    if (user?.role === 'delivery' && location.pathname === '/dashboard') {
      console.log('🚚 Livreur détecté sur /dashboard, redirection vers interface de livraison');
      navigate('/dashboard-delivery', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  const showHeaderAndFooter = !['/otp-verification', '/email-waiting', '/email-confirmed', '/seller-dashboard', '/admin-dashboard', '/login', '/register', '/forgot-password', '/reset-password', '/dashboard-delivery'].includes(location.pathname) && !location.pathname.startsWith('/product');

  return (
    <div className="min-h-screen bg-white">
      {showHeaderAndFooter && <NavigationHeader />}

          <Routes>
            <Route path="/" element={
              <HomePage
                onNavigateToLogin={() => navigate('/register')}
                onNavigateToCheckout={handleNavigateToCheckout}
                onCategoryClick={handleCategoryClick}
                onProductClick={handleProductClick}
                onViewAllProducts={handleViewAllProducts}
                onNavigateToStores={() => navigate('/stores')}
                products={products}
              />
            } />
            <Route path="/stores" element={<StoresPage onViewProducts={handleStoreProductsView} />} />
            <Route path="/dashboard" element={<DashboardPage initialTab={dashboardTab} />} />
            <Route
              path="/dashboard-delivery"
              element={
                <div className="min-h-screen bg-gray-50">
                  <div className="container mx-auto px-4 py-8">
                    <div className="mb-6">
                      <h1 className="text-2xl font-bold text-gray-900">Dashboard Livreur</h1>
                      <p className="text-gray-600">Gérez vos livraisons</p>
                    </div>

                    <div className="space-y-4">
                      <DeliveryDashboard />
                    </div>
                  </div>
                </div>
              }
            />
            <Route path="/product/:id" element={
              <ProductDetailWrapper
                onProductClick={handleProductClick}
                onNavigateToCheckout={handleNavigateToCheckout}
                onNavigateToRegister={() => navigate('/register')}
                products={products}
              />
            } />
            <Route path="/login" element={
              <LoginPage
                onNavigateToRegister={() => navigate('/register')}
                onNavigateHome={() => navigate('/')}
                onNavigateToSellerDashboard={() => navigate('/seller-dashboard')}
                onNavigateToAdminDashboard={() => navigate('/admin-dashboard')}
                onNavigateToLogin={() => navigate('/register')}
                onNavigateToForgotPassword={() => navigate('/forgot-password')}
              />
            } />
            <Route path="/register" element={
              <RegisterPage
                onNavigateToLogin={() => navigate('/login')}
                onNavigateToEmailWaiting={handleNavigateToEmailWaiting}
              />
            } />
            <Route path="/otp-verification" element={
              <OTPVerificationPage
                email={otpEmail}
                userId={otpUserId}
                onVerificationSuccess={handleOTPVerificationSuccess}
                onBackToRegister={() => navigate('/register')}
              />
            } />
            <Route path="/email-waiting" element={
              <EmailWaitingPage
                email={otpEmail}
                onNavigateToLogin={() => navigate('/login')}
                onNavigateToRegister={() => navigate('/register')}
              />
            } />
            <Route path="/email-confirmed" element={
              <EmailConfirmationSuccess
                onNavigateToLogin={() => navigate('/login')}
              />
            } />
            <Route path="/checkout" element={
              <CheckoutPage
                onNavigateHome={() => navigate('/')}
              />
            } />
            <Route path="/seller-dashboard" element={
              <SellerDashboard
                onLogout={handleLogout}
              />
            } />
            <Route path="/admin-dashboard" element={
              <AdminDashboard
                onLogout={handleLogout}
              />
            } />
            <Route path="/forgot-password" element={
              <FacebookPasswordRecovery
                onNavigateToLogin={() => navigate('/login')}
              />
            } />
            <Route path="/reset-password" element={
              <ResetPasswordPage
                onNavigateToLogin={() => navigate('/login')}
              />
            } />
            <Route path="/articles" element={
              <main className="container mx-auto px-4 py-8 min-h-screen bg-somba-light">
                {/* Page Title */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-somba-primary mb-2">Catalogue des produits</h1>
                  <p className="text-gray-600">Découvrez notre sélection de produits de qualité</p>
                </div>

                <FilterBar />

                {/* Filters */}
                <div className="mb-6 space-y-6">
                  {/* Categories Filter */}
                  <div>
                    <h3 className="font-semibold text-somba-primary mb-3">Catégories</h3>
                    <div className="flex flex-wrap gap-2">
                      {['Tous', 'Électronique', 'Mode', 'Gaming', 'Électroménager', 'Sport'].map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setSelectedCategory(category);
                            setSelectedStore("Tous");
                          }}
                          className={`px-3 py-1 text-sm rounded-md ${
                            selectedCategory === category
                              ? 'bg-orange-500 hover:bg-orange-600 text-white'
                              : 'border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stores Filter */}
                  <div>
                    <h3 className="font-semibold text-somba-primary mb-3">Boutiques</h3>
                    <div className="flex flex-wrap gap-2">
                      {['Tous', ...shops.map(shop => shop.name)].map((store) => (
                        <button
                          key={store}
                          onClick={() => {
                            setSelectedStore(store);
                            setSelectedCategory("Tous");
                          }}
                          className={`px-3 py-1 text-sm rounded-md ${
                            selectedStore === store
                              ? 'bg-orange-500 hover:bg-orange-600 text-white'
                              : 'border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                          }`}
                        >
                          {store}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Results info */}
                <div className="mb-6">
                  <p className="text-somba-primary">
                    <span className="font-semibold">{filteredProducts.length}</span> article(s)
                    {selectedCategory !== "Tous" && (
                      <span> dans la catégorie <strong>{selectedCategory}</strong></span>
                    )}
                    {selectedStore !== "Tous" && (
                      <span> chez <strong>{selectedStore}</strong></span>
                    )}
                  </p>
                </div>

                {/* Products Grid */}
                {productsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {[...Array(8)].map((_, index) => (
                      <div key={index} className="animate-pulse">
                        <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                        <div className="space-y-2">
                          <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                          <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                          <div className="bg-gray-200 h-4 rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {displayedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onProductClick={handleProductClick}
                        onNavigateToCheckout={handleNavigateToCheckout}
                      />
                    ))}
                  </div>
                )}

                {/* Load More Button */}
                {displayedProductsCount < filteredProducts.length && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      className="px-8 py-2 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-md"
                    >
                      Voir plus ({filteredProducts.length - displayedProductsCount} articles restants)
                    </button>
                  </div>
                )}

                {/* No more products message */}
                {displayedProductsCount >= filteredProducts.length && filteredProducts.length > 12 && (
                  <div className="text-center text-gray-500">
                    <p>Tous les articles ont été affichés</p>
                  </div>
                )}

                {/* Empty state */}
                {filteredProducts.length === 0 && !productsLoading && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <div className="w-24 h-24 mx-auto bg-somba-light rounded-full flex items-center justify-center">
                        <span className="text-4xl">🛍️</span>
                      </div>
                    </div>
                    <h3 className="font-medium text-somba-primary mb-2">Aucun produit trouvé</h3>
                    <p className="text-gray-500 mb-4">
                      Essayez de sélectionner une autre catégorie
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategory("Tous");
                        setSelectedStore("Tous");
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md"
                    >
                      Voir tous les produits
                    </button>
                  </div>
                )}
              </main>
            } />
          </Routes>

          {showHeaderAndFooter && <Footer />}

          {/* Toast Notifications */}
          <Toaster position="top-right" />
        </div>
      );
    }

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ProductsProvider>
          <CartProvider>
            <ShopsProvider>
              <StoresProvider>
                <AppWithStores />
              </StoresProvider>
            </ShopsProvider>
          </CartProvider>
        </ProductsProvider>
      </Router>
    </AuthProvider>
  );
}