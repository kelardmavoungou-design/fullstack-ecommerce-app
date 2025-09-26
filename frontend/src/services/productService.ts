import api, { Product, Review, ApiResponse, endpoints } from './api';

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  search?: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReviewData {
  rating: number;
  comment?: string;
}

class ProductService {
  // Get all products with filters
  async getProducts(filters: ProductFilters = {}): Promise<ApiResponse<ProductListResponse>> {
    try {
      const params = new URLSearchParams();

      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`${endpoints.products.list}?${params.toString()}`);
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

  // Get product details by ID
  async getProductById(id: string): Promise<ApiResponse<Product>> {
    try {
      const response = await api.get(endpoints.products.details(id));
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération du produit',
      };
    }
  }

  // Get product reviews
  async getProductReviews(productId: string, page: number = 1, limit: number = 10): Promise<ApiResponse<{ reviews: Review[]; total: number; page: number; limit: number }>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await api.get(`${endpoints.products.reviews(productId)}?${params.toString()}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des avis',
      };
    }
  }

  // Add product review (buyer only)
  async addProductReview(productId: string, reviewData: ReviewData): Promise<ApiResponse<Review>> {
    try {
      const response = await api.post(`${endpoints.buyer.products}/${productId}/reviews`, reviewData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de l\'ajout de l\'avis',
      };
    }
  }

  // Search products
  async searchProducts(query: string, filters: Omit<ProductFilters, 'search'> = {}): Promise<ApiResponse<ProductListResponse>> {
    return this.getProducts({ ...filters, search: query });
  }

  // Get products by category
  async getProductsByCategory(category: string, filters: Omit<ProductFilters, 'category'> = {}): Promise<ApiResponse<ProductListResponse>> {
    return this.getProducts({ ...filters, category });
  }

  // Get featured/popular products
  async getFeaturedProducts(limit: number = 10): Promise<ApiResponse<Product[]>> {
    try {
      const response = await api.get(`${endpoints.products.list}?limit=${limit}&sort=popular`);
      return {
        success: true,
        data: response.data.products || [],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des produits populaires',
      };
    }
  }

  // Get products on sale
  async getProductsOnSale(filters: ProductFilters = {}): Promise<ApiResponse<ProductListResponse>> {
    try {
      const params = new URLSearchParams();

      if (filters.category) params.append('category', filters.category);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await api.get(`${endpoints.products.list}/sale?${params.toString()}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des produits en promotion',
      };
    }
  }
}

const productService = new ProductService();
export default productService;