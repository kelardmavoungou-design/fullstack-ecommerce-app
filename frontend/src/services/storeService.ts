import api, { ApiResponse, endpoints } from './api';

export interface Store {
  id: number;
  name: string;
  description: string;
  category: string;
  image: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
  isActive: boolean;
  sellerId: number;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalProducts: number;
    totalSales: number;
    monthlyRevenue: number;
  };
}

export interface StoreFilters {
  category?: string;
  isActive?: boolean;
  sellerId?: number;
  page?: number;
  limit?: number;
  search?: string;
}

export interface StoreListResponse {
  stores: Store[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class StoreService {
  // Get all stores with filters
  async getStores(filters: StoreFilters = {}): Promise<ApiResponse<StoreListResponse>> {
    try {
      const params = new URLSearchParams();

      if (filters.category) params.append('category', filters.category);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.sellerId) params.append('sellerId', filters.sellerId.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);

      // Assuming endpoint is /api/stores
      const response = await api.get(`/api/stores?${params.toString()}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des boutiques',
      };
    }
  }

  // Get store details by ID
  async getStoreById(id: string): Promise<ApiResponse<Store>> {
    try {
      // Assuming endpoint is /api/stores/:id
      const response = await api.get(`/api/stores/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération de la boutique',
      };
    }
  }

  // Get stores by seller
  async getStoresBySeller(sellerId: number, filters: Omit<StoreFilters, 'sellerId'> = {}): Promise<ApiResponse<StoreListResponse>> {
    return this.getStores({ ...filters, sellerId });
  }

  // Get active/featured stores
  async getActiveStores(limit: number = 10): Promise<ApiResponse<Store[]>> {
    try {
      const response = await api.get(`/api/stores?limit=${limit}&isActive=true&sort=rating`);
      return {
        success: true,
        data: response.data.stores || [],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des boutiques actives',
      };
    }
  }

  // Search stores
  async searchStores(query: string, filters: Omit<StoreFilters, 'search'> = {}): Promise<ApiResponse<StoreListResponse>> {
    return this.getStores({ ...filters, search: query });
  }
}

const storeService = new StoreService();
export default storeService;