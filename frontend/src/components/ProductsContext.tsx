import { createContext, useContext, useState, useEffect, ReactNode, JSX } from 'react';
import sellerService from '../services/sellerService';
import { useAuth } from './AuthContext';
import { getImageUrl } from '../services/api';

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string;
  originalPrice?: string;
  image: string;
  boutique: string;
  isOnSale?: boolean;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  sizes?: string[];
  colors?: string[];
  specifications?: { [key: string]: string };
  images?: string[];
  sellerId: number;
  storeId?: number;
  region?: string;
  channel?: string;
  stats?: {
    totalSold: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProductsContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: number, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  getProductsBySeller: (sellerId: number) => Product[];
  getProductsByStore: (storeName: string) => Product[];
  getAllProducts: () => Product[];
  refreshProducts: () => Promise<void>;
}

type ProviderProps = { children: ReactNode };

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

// Helper function to convert API product to frontend format
const convertApiProduct = (apiProduct: any): Product => ({
  id: apiProduct.id,
  name: apiProduct.name,
  description: apiProduct.description || '',
  category: apiProduct.category || 'Non classé',
  price: (() => {
    if (apiProduct.price === undefined || apiProduct.price === null) return 'Prix non disponible';
    const numPrice = typeof apiProduct.price === 'string' ? parseFloat(apiProduct.price) : apiProduct.price;
    if (isNaN(numPrice)) return 'Prix non disponible';
    return numPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' });
  })(),
  originalPrice: apiProduct.originalPrice ? (() => {
    const numPrice = typeof apiProduct.originalPrice === 'string' ? parseFloat(apiProduct.originalPrice) : apiProduct.originalPrice;
    if (isNaN(numPrice)) return undefined;
    return numPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' });
  })() : undefined,
  image: getImageUrl(apiProduct.image) || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljcyUyMHNob3B8ZW58MXx8fHwxNzU1NTk0MzAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  boutique: apiProduct.shop_name || apiProduct.store_name || 'Boutique',
  isOnSale: apiProduct.originalPrice !== undefined,
  rating: apiProduct.rating || 4.5,
  reviews: apiProduct.reviewsCount || 0,
  inStock: apiProduct.stock > 0,
  sizes: apiProduct.sizes || [],
  colors: apiProduct.colors || [],
  specifications: apiProduct.specifications || {},
  images: apiProduct.images?.map((img: string) => getImageUrl(img)) || [],
  sellerId: apiProduct.sellerId || 0,
  storeId: apiProduct.storeId || apiProduct.sellerId || 0,
  region: apiProduct.region || 'Congo',
  channel: apiProduct.channel || 'Direct',
  stats: {
    totalSold: apiProduct.totalSold || 0  // Changed from random to 0 for consistency
  },
  createdAt: apiProduct.createdAt || new Date().toISOString().split('T')[0],
  updatedAt: apiProduct.updatedAt || new Date().toISOString().split('T')[0],
});

// Internal component that can use hooks
function ProductsProviderInner({ children }: ProviderProps) {
  let user = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch (error) {
    // AuthProvider not available during hot reload
    console.warn('AuthProvider not available, skipping product loading');
  }
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load products from API on mount and when user changes
  useEffect(() => {
    const loadProducts = async () => {
      if (!user) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Check if user has seller role before trying to load seller products
        const userRole = user.role;
        if (userRole !== 'seller' && userRole !== 'superadmin') {
          console.log('User is not a seller, skipping seller product loading');
          setProducts([]);
          setLoading(false);
          return;
        }

        // Get all stores for the current user first
        const storesResponse = await sellerService.getShops();
        if (!storesResponse.success) {
          // If we get a 403 error, user doesn't have seller permissions
          if (storesResponse.error?.includes('403') || storesResponse.error?.includes('vendeur') || storesResponse.error?.includes('seller')) {
            console.log('User does not have seller permissions, skipping product loading');
            setProducts([]);
            setLoading(false);
            return;
          }
          throw new Error(storesResponse.error);
        }

        const userStores = storesResponse.data || [];
        const allProducts: Product[] = [];

        // For each store, get its products
        for (const store of userStores) {
          try {
            const productsResponse = await sellerService.getProducts(store.id.toString());
            if (productsResponse.success && productsResponse.data) {
              const storeProducts = productsResponse.data.products || [];
              // Convert API response to frontend format and add store info
              const convertedProducts: Product[] = storeProducts.map((apiProduct: any) => ({
                ...convertApiProduct(apiProduct),
                boutique: store.name,
                sellerId: store.seller_id,
                storeId: store.id
              }));
              allProducts.push(...convertedProducts);
            }
          } catch (error) {
            console.warn(`Error loading products for store ${store.id}:`, error);
          }
        }

        setProducts(allProducts);
      } catch (err) {
        console.error('Error loading products:', err);
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [user]);

  const refreshProducts = async () => {
    if (!user) {
      setProducts([]);
      return;
    }

    // Check if user has seller role before trying to load seller products
    const userRole = user.role;
    if (userRole !== 'seller' && userRole !== 'superadmin') {
      console.log('User is not a seller, skipping seller product refresh');
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Get all stores for the current user first
      const storesResponse = await sellerService.getShops();
      if (!storesResponse.success) {
        // If we get a 403 error, user doesn't have seller permissions
        if (storesResponse.error?.includes('403') || storesResponse.error?.includes('vendeur') || storesResponse.error?.includes('seller')) {
          console.log('User does not have seller permissions, skipping product refresh');
          setProducts([]);
          return;
        }
        throw new Error(storesResponse.error);
      }

      const userStores = storesResponse.data || [];
      const allProducts: Product[] = [];

      // For each store, get its products
      for (const store of userStores) {
        try {
          const productsResponse = await sellerService.getProducts(store.id.toString());
          if (productsResponse.success && productsResponse.data) {
            const storeProducts = productsResponse.data.products || [];
            // Convert API response to frontend format and add store info
            const convertedProducts: Product[] = storeProducts.map((apiProduct: any) => ({
              ...convertApiProduct(apiProduct),
              boutique: store.name,
              sellerId: store.seller_id,
              storeId: store.id
            }));
            allProducts.push(...convertedProducts);
          }
        } catch (error) {
          console.warn(`Error loading products for store ${store.id}:`, error);
        }
      }

      setProducts(allProducts);
      setError(null);
    } catch (err) {
      console.error('Error refreshing products:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (newProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Check if user has seller role before trying to add products
      if (!user) {
        throw new Error('Vous devez être connecté pour ajouter un produit');
      }

      const userRole = user.role;
      if (userRole !== 'seller' && userRole !== 'superadmin') {
        throw new Error('Seuls les vendeurs peuvent ajouter des produits');
      }

      // Extract shopId from the product data
      const shopId = newProduct.storeId?.toString();
      console.log('Adding product with shopId:', shopId, 'storeId from product:', newProduct.storeId);

      if (!shopId) {
        throw new Error('ShopId is required to create a product');
      }

      // Prepare product data for API call - Alibaba Algorithm
      const priceString = newProduct.price || '0';
      const numericPrice = parseFloat(priceString.replace(/[^\d.-]/g, ''));

      // Include variants and other fields from ProductVariantModal
      const productData = {
        name: newProduct.name || 'Nouveau produit',
        description: newProduct.description || '',
        price: isNaN(numericPrice) ? 0 : numericPrice, // Default to 0 if invalid
        stock: 10, // Default stock, can be updated later
        category: newProduct.category || 'Non classé',
        image: newProduct.image || '',
        // Include variants data if present (from ProductVariantModal)
        variants: (newProduct as any).variants || {},
        attributes: (newProduct as any).attributes || [],
        brand: (newProduct as any).brand || '',
        mainImage: (newProduct as any).mainImage || '',
        images: (newProduct as any).images || [],
        isActive: (newProduct as any).isActive !== false
      };

      console.log('Calling createProduct with shopId:', shopId, 'and productData:', productData);

      // Call backend API to create product
      const response = await sellerService.createProduct(shopId, productData);
      console.log('Create product response:', response);

      if (response.success && response.data) {
        // Refresh products from API to ensure synchronization
        await refreshProducts();

        // Also refresh global products for HomePage trending products
        if ((window as any).refreshGlobalProducts) {
          await (window as any).refreshGlobalProducts();
        }
      } else {
        throw new Error(response.error || 'Erreur lors de la création du produit');
      }
    } catch (err) {
      console.error('Error adding product:', err);
      throw new Error('Erreur lors de l\'ajout du produit');
    }
  };

  const updateProduct = async (id: number, updatedProduct: Partial<Product>) => {
    try {
      // Update local state immediately for better UX
      setProducts((prev: Product[]) => prev.map((product: Product) =>
        product.id === id
          ? { ...product, ...updatedProduct, updatedAt: new Date().toISOString().split('T')[0] }
          : product
      ));

      // TODO: Implement actual API call to update product
      // await productService.updateProduct(id, updatedProduct);

      // Refresh from API to ensure synchronization
      await refreshProducts();
    } catch (err) {
      console.error('Error updating product:', err);
      throw new Error('Erreur lors de la mise à jour du produit');
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      // Find the product to get its storeId
      const productToDelete = products.find((product: Product) => product.id === id);
      if (!productToDelete) {
        throw new Error('Produit non trouvé');
      }

      // Call API to delete product from backend
      const deleteResponse = await sellerService.deleteProduct(productToDelete.storeId!.toString(), id.toString());
      if (!deleteResponse.success) {
        throw new Error(deleteResponse.error || 'Erreur lors de la suppression du produit');
      }

      // Update local state immediately for better UX
      setProducts((prev: Product[]) => prev.filter((product: Product) => product.id !== id));

      // Refresh from API to ensure synchronization
      await refreshProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      throw new Error('Erreur lors de la suppression du produit');
    }
  };

  const getProductsBySeller = (sellerId: number) => {
    return products.filter((product: Product) => product.sellerId === sellerId);
  };

  const getProductsByStore = (storeName: string) => {
    return products.filter((product: Product) => product.boutique === storeName);
  };

  const getAllProducts = () => {
    return products;
  };

  return (
    <ProductsContext.Provider value={{
      products,
      loading,
      error,
      addProduct,
      updateProduct,
      deleteProduct,
      getProductsBySeller,
      getProductsByStore,
      getAllProducts,
      refreshProducts
    }}>
      {children}
    </ProductsContext.Provider>
  ) as JSX.Element;
}

export function ProductsProvider({ children }: ProviderProps) {
  return (
    <ProductsProviderInner>
      {children}
    </ProductsProviderInner>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}