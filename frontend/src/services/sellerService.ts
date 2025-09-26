import api, { Shop, Product, Order, ApiResponse, endpoints } from './api';

export interface CreateShopData {
  name: string;
  description?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  opening_hours?: string;
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  footer_description?: string;
  category?: string;
}

export interface UpdateShopData {
  name?: string;
  description?: string;
  logo?: string;
  is_active?: boolean;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  variants?: any;
  image?: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  variants?: any;
  image?: string;
}

export interface ShopStats {
  product_count: number;
  order_stats: Array<{
    status: string;
    count: number;
  }>;
  total_sales: number;
  monthly_sales: Array<{
    month: number;
    sales: number;
  }>;
  top_products: Array<{
    id: number;
    name: string;
    total_sold: number;
  }>;
}

export interface SellerOrder extends Order {
  buyer_name: string;
  buyer_phone: string;
  buyer_email?: string;
  items: Array<{
    id: number;
    product_id: number;
    quantity: number;
    price: number;
    name: string;
    image?: string;
  }>;
}

class SellerService {
  // Get all seller's shops
  async getShops(): Promise<ApiResponse<Shop[]>> {
    try {
      const response = await api.get(endpoints.seller.shops);
      return {
        success: true,
        data: response.data.shops,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des boutiques',
      };
    }
  }

  // Create a new shop
  async createShop(shopData: CreateShopData): Promise<ApiResponse<Shop>> {
    try {
      const response = await api.post(endpoints.seller.shops, shopData);
      return {
        success: true,
        data: response.data.shop,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la création de la boutique',
      };
    }
  }

  // Get shop by ID
  async getShopById(shopId: string): Promise<ApiResponse<Shop>> {
    try {
      const response = await api.get(`${endpoints.seller.shops}/${shopId}`);
      return {
        success: true,
        data: response.data.shop,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération de la boutique',
      };
    }
  }

  // Update shop
  async updateShop(shopId: string, shopData: UpdateShopData): Promise<ApiResponse<any>> {
    try {
      const response = await api.put(`${endpoints.seller.shops}/${shopId}`, shopData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la mise à jour de la boutique',
      };
    }
  }

  // Activate shop (Alibaba algorithm)
  async activateShop(shopId: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.put(`${endpoints.seller.shops}/${shopId}/activate`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de l\'activation de la boutique',
      };
    }
  }

  // Delete shop
  async deleteShop(shopId: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete(`${endpoints.seller.shops}/${shopId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la suppression de la boutique',
      };
    }
  }

  // Get products for a shop
  async getProducts(shopId: string, params?: {
    category?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<{
    products: Product[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.append('category', params.category);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);

      const url = `${endpoints.seller.products(shopId)}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des produits',
      };
    }
  }

  // Create product
  async createProduct(shopId: string, productData: CreateProductData): Promise<ApiResponse<Product>> {
    try {
      const response = await api.post(endpoints.seller.products(shopId), productData);
      return {
        success: true,
        data: response.data.product,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la création du produit',
      };
    }
  }

  // Update product
  async updateProduct(shopId: string, productId: string, productData: UpdateProductData): Promise<ApiResponse<any>> {
    try {
      const response = await api.put(`${endpoints.seller.products(shopId)}/${productId}`, productData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la mise à jour du produit',
      };
    }
  }

  // Delete product
  async deleteProduct(shopId: string, productId: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete(`${endpoints.seller.products(shopId)}/${productId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la suppression du produit',
      };
    }
  }

  // Get orders for a shop
  async getOrders(shopId: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    orders: SellerOrder[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const url = `${endpoints.seller.orders(shopId)}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des commandes',
      };
    }
  }

  // Update order status
  async updateOrderStatus(shopId: string, orderId: string, status: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.put(`${endpoints.seller.orders(shopId)}/${orderId}`, { status });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la mise à jour du statut de la commande',
      };
    }
  }

  // Get shop statistics
  async getShopStats(shopId: string): Promise<ApiResponse<ShopStats>> {
    try {
      const response = await api.get(endpoints.seller.stats(shopId));
      return {
        success: true,
        data: response.data.stats,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des statistiques',
      };
    }
  }

  // Get shop categories
  async getShopCategories(shopId: string): Promise<ApiResponse<string[]>> {
    try {
      const response = await api.get(endpoints.seller.categories(shopId));
      return {
        success: true,
        data: response.data.categories,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des catégories',
      };
    }
  }

  // Get seller profile
  async getSellerProfile(): Promise<ApiResponse<any>> {
    try {
      const response = await api.get(endpoints.seller.profile);
      return {
        success: true,
        data: response.data.profile,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération du profil',
      };
    }
  }

  // Get bank account information
  async getBankAccount(): Promise<ApiResponse<any>> {
    try {
      const response = await api.get('/seller/bank-account');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération du compte bancaire',
      };
    }
  }

  // Update bank account information
  async updateBankAccount(bankData: {
    bank_provider: string;
    bank_account: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await api.put('/seller/bank-account', bankData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la mise à jour du compte bancaire',
      };
    }
  }

  // Verify bank account
  async verifyBankAccount(): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/seller/bank-account/verify');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la vérification du compte bancaire',
      };
    }
  }

  // Process withdrawal
  async processWithdrawal(amount: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/seller/withdrawal', { amount });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors du retrait',
      };
    }
  }
}

const sellerService = new SellerService();
export default sellerService;