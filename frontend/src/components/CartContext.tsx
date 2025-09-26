import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import cartService from '../services/cartService';
import { CartItem as ApiCartItem } from '../services/api';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export interface CartItem {
  id: number;
  name: string;
  price: string;
  image: string;
  boutique: string;
  quantity: number;
  unitPrice: number; // Prix en nombre pour les calculs
  selectedSize?: string;
  selectedColor?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any) => Promise<void>;
  removeFromCart: (id: number) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  clearCart: (silent?: boolean) => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  loading: boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  let isAuthenticated = false;
  try {
    const auth = useAuth();
    isAuthenticated = auth.isAuthenticated;
  } catch (error) {
    // AuthProvider not available during hot reload
    console.warn('AuthProvider not available, using default cart state');
  }

  // Convert API cart item to frontend cart item
  const convertApiCartItem = (apiItem: ApiCartItem): CartItem => ({
    id: apiItem.id,
    name: apiItem.name,
    price: apiItem.price.toString(),
    image: apiItem.image || '',
    boutique: apiItem.shop_name || '',
    quantity: apiItem.quantity,
    unitPrice: apiItem.price,
    selectedSize: undefined,
    selectedColor: undefined
  });

  // Load cart from API when user is authenticated
  const loadCartFromAPI = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await cartService.getCart();
      if (response.success && response.data) {
        const convertedItems = response.data.items.map(convertApiCartItem);
        setItems(convertedItems);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error);
    }
  };

  // Load cart on mount and when authentication changes
  useEffect(() => {
    loadCartFromAPI();
  }, [isAuthenticated]);

  const parsePrice = (priceString: string): number => {
    // Convertit "25.000 F CFA" en 25000
    return parseInt(priceString.replace(/[^\d]/g, ''));
  };

  const addToCart = async (product: any) => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        // Use API - send to backend
        const response = await cartService.addToCart({
          productId: product.id,
          quantity: product.quantity || 1
        });
        if (response.success) {
          await loadCartFromAPI(); // Refresh cart from backend
          toast.success(`${product.name} ajouté au panier`);
        } else {
          toast.error(response.error || 'Erreur lors de l\'ajout au panier');
        }
      } else {
        // Fallback to local storage for non-authenticated users
        const unitPrice = parsePrice(product.price);

        setItems(currentItems => {
          const existingItem = currentItems.find(item => item.id === product.id);

          if (existingItem) {
            return currentItems.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + (product.quantity || 1) }
                : item
            );
          }

          return [...currentItems, {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            boutique: product.boutique,
            quantity: product.quantity || 1,
            unitPrice,
            selectedSize: product.selectedSize,
            selectedColor: product.selectedColor
          }];
        });
        toast.success(`${product.name} ajouté au panier`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error);
      toast.error('Erreur lors de l\'ajout au panier');
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (id: number) => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        // Use API
        const response = await cartService.removeFromCart(id);
        if (response.success) {
          await loadCartFromAPI(); // Refresh cart
          toast.success('Article supprimé du panier');
        } else {
          toast.error(response.error || 'Erreur lors de la suppression');
        }
      } else {
        // Fallback to local state
        setItems(currentItems => currentItems.filter(item => item.id !== id));
        toast.success('Article supprimé du panier');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du panier:', error);
      toast.error('Erreur lors de la suppression du panier');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id: number, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(id);
      return;
    }

    setLoading(true);
    try {
      if (isAuthenticated) {
        // Use API
        const response = await cartService.updateCartItem(id, { quantity });
        if (response.success) {
          await loadCartFromAPI(); // Refresh cart
        } else {
          toast.error(response.error || 'Erreur lors de la mise à jour');
        }
      } else {
        // Fallback to local state
        setItems(currentItems =>
          currentItems.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
        );
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du panier:', error);
      toast.error('Erreur lors de la mise à jour du panier');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async (silent = false) => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        // Use API
        const response = await cartService.clearCart();
        if (response.success) {
          setItems([]);
          if (!silent) {
            toast.success('Panier vidé');
          }
        } else {
          toast.error(response.error || 'Erreur lors de la suppression du panier');
        }
      } else {
        // Fallback to local state
        setItems([]);
        if (!silent) {
          toast.success('Panier vidé');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du panier:', error);
      toast.error('Erreur lors de la suppression du panier');
    } finally {
      setLoading(false);
    }
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
  };

  const refreshCart = async () => {
    await loadCartFromAPI();
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      loading,
      refreshCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}