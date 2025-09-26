import api, { Shop, ApiResponse, endpoints } from './api';

class PublicService {
  // Get all active shops
  async getShops(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<{
    shops: Shop[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);

      const url = `${endpoints.public.shops}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await api.get(url);
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
}

const publicService = new PublicService();
export default publicService;