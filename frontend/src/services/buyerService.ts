import api, { BuyerStats, Address, Notification, ApiResponse, endpoints } from './api';

export interface CreateAddressData {
  label: string;
  fullAddress: string;
  isDefault?: boolean;
}

export interface UpdateAddressData {
  label?: string;
  fullAddress?: string;
  isDefault?: boolean;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class BuyerService {
  // Get buyer statistics
  async getBuyerStats(): Promise<ApiResponse<BuyerStats>> {
    try {
      const response = await api.get(endpoints.buyer.stats);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des statistiques',
      };
    }
  }

  // Get user's addresses
  async getAddresses(): Promise<ApiResponse<Address[]>> {
    try {
      const response = await api.get(endpoints.buyer.addresses);
      return {
        success: true,
        data: response.data.addresses,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des adresses',
      };
    }
  }

  // Add new address
  async addAddress(addressData: CreateAddressData): Promise<ApiResponse<Address>> {
    try {
      const response = await api.post(endpoints.buyer.addresses, addressData);
      return {
        success: true,
        data: response.data.address,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de l\'ajout de l\'adresse',
      };
    }
  }

  // Update address
  async updateAddress(addressId: string, addressData: UpdateAddressData): Promise<ApiResponse<Address>> {
    try {
      const response = await api.put(`${endpoints.buyer.addresses}/${addressId}`, addressData);
      return {
        success: true,
        data: response.data.address,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la mise à jour de l\'adresse',
      };
    }
  }

  // Delete address
  async deleteAddress(addressId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.delete(`${endpoints.buyer.addresses}/${addressId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la suppression de l\'adresse',
      };
    }
  }

  // Get user's notifications
  async getNotifications(filters: NotificationFilters = {}): Promise<ApiResponse<NotificationListResponse>> {
    try {
      const params = new URLSearchParams();

      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await api.get(`${endpoints.buyer.notifications}?${params.toString()}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des notifications',
      };
    }
  }

  // Mark notification as read
  async markNotificationRead(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.put(`${endpoints.buyer.notifications}/${notificationId}/read`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors du marquage de la notification',
      };
    }
  }

  // Mark all notifications as read
  async markAllNotificationsRead(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.put(`${endpoints.buyer.notifications}/mark-all-read`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors du marquage des notifications',
      };
    }
  }
}

const buyerService = new BuyerService();
export default buyerService;