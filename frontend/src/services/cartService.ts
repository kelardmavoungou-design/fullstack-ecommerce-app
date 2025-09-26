import api, { CartItem, ApiResponse, endpoints } from './api';

export interface AddToCartData {
  productId: number;
  quantity?: number;
}

export interface UpdateCartData {
  quantity: number;
}

export interface CreateOrderData {
  cartId: number;
  paymentMethod: 'mobile_money' | 'cash_on_delivery';
  shippingAddress: string;
}

class CartService {
  // Get user's cart
  async getCart(): Promise<ApiResponse<{ cartId: number; items: CartItem[]; total: number; itemCount: number }>> {
    try {
      const response = await api.get(endpoints.buyer.cart);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération du panier',
      };
    }
  }

  // Add item to cart
  async addToCart(cartData: AddToCartData): Promise<ApiResponse<{ message: string; item: CartItem }>> {
    try {
      const response = await api.post(endpoints.buyer.cart, cartData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de l\'ajout au panier',
      };
    }
  }

  // Update cart item quantity
  async updateCartItem(itemId: number, updateData: UpdateCartData): Promise<ApiResponse<{ message: string; item: CartItem }>> {
    try {
      const response = await api.put(`${endpoints.buyer.cart}/${itemId}`, updateData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la mise à jour du panier',
      };
    }
  }

  // Remove item from cart
  async removeFromCart(itemId: number): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.delete(`${endpoints.buyer.cart}/${itemId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la suppression du panier',
      };
    }
  }

  // Clear entire cart
  async clearCart(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.delete(endpoints.buyer.cart);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la suppression du panier',
      };
    }
  }

  // Get cart summary (for checkout)
  async getCartSummary(): Promise<ApiResponse<{ items: CartItem[]; subtotal: number; tax: number; total: number; shipping: number }>> {
    try {
      const response = await api.get(`${endpoints.buyer.cart}/summary`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération du résumé du panier',
      };
    }
  }

  // Validate cart before checkout
  async validateCart(): Promise<ApiResponse<{ valid: boolean; issues?: string[] }>> {
    try {
      const response = await api.post(`${endpoints.buyer.cart}/validate`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la validation du panier',
      };
    }
  }

  // Create order from cart
  async createOrder(orderData: CreateOrderData): Promise<ApiResponse<{ message: string; orderIds: number[] }>> {
    try {
      const response = await api.post(endpoints.buyer.orders, orderData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la création de la commande',
      };
    }
  }

  // Sync cart with server (useful for login/logout)
  async syncCart(localCartItems: CartItem[]): Promise<ApiResponse<{ message: string; syncedItems: CartItem[] }>> {
    try {
      const response = await api.post(`${endpoints.buyer.cart}/sync`, { items: localCartItems });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la synchronisation du panier',
      };
    }
  }
}

const cartService = new CartService();
export default cartService;