import api, { WishlistItem, ApiResponse, endpoints } from './api';

export interface WishlistFilters {
  page?: number;
  limit?: number;
  category?: string;
}

export interface WishlistResponse {
  items: WishlistItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class WishlistService {
  // Get user's wishlist
  async getWishlist(filters: WishlistFilters = {}): Promise<ApiResponse<WishlistResponse>> {
    try {
      const params = new URLSearchParams();

      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.category) params.append('category', filters.category);

      const response = await api.get(`${endpoints.buyer.wishlist}?${params.toString()}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération de la liste de souhaits',
      };
    }
  }

  // Add product to wishlist
  async addToWishlist(productId: number): Promise<ApiResponse<{ message: string; item: WishlistItem }>> {
    try {
      const response = await api.post(endpoints.buyer.wishlist, { productId });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de l\'ajout à la liste de souhaits',
      };
    }
  }

  // Remove product from wishlist
  async removeFromWishlist(productId: number): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.delete(`${endpoints.buyer.wishlist}/${productId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la suppression de la liste de souhaits',
      };
    }
  }

  // Check if product is in wishlist
  async isInWishlist(productId: number): Promise<ApiResponse<{ inWishlist: boolean }>> {
    try {
      const response = await api.get(`${endpoints.buyer.wishlist}/check/${productId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la vérification de la liste de souhaits',
      };
    }
  }

  // Clear entire wishlist
  async clearWishlist(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.delete(`${endpoints.buyer.wishlist}/clear`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la suppression de la liste de souhaits',
      };
    }
  }

  // Get wishlist count
  async getWishlistCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      const response = await api.get(`${endpoints.buyer.wishlist}/count`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération du nombre d\'articles',
      };
    }
  }

  // Move item from wishlist to cart
  async moveToCart(productId: number): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post(`${endpoints.buyer.wishlist}/${productId}/move-to-cart`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors du déplacement vers le panier',
      };
    }
  }
}

const wishlistService = new WishlistService();
export default wishlistService;