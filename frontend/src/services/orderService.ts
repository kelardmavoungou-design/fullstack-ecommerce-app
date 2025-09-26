import api, { Order, OrderItem, ApiResponse, endpoints } from './api';

export interface CreateOrderData {
  cartId?: number;
  paymentMethod: 'mobile_money' | 'cash_on_delivery';
  shippingAddress: string;
}

export interface OrderFilters {
  status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  page?: number;
  limit?: number;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class OrderService {
  // Create new order
  async createOrder(orderData: CreateOrderData): Promise<ApiResponse<{ order: Order; paymentUrl?: string }>> {
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

  // Get user's orders
  async getOrders(filters: OrderFilters = {}): Promise<ApiResponse<OrderListResponse>> {
    try {
      const params = new URLSearchParams();

      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await api.get(`${endpoints.buyer.orders}?${params.toString()}`);
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

  // Get order details by ID
  async getOrderById(orderId: string): Promise<ApiResponse<Order>> {
    try {
      const response = await api.get(`${endpoints.buyer.orders}/${orderId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération de la commande',
      };
    }
  }

  // Cancel order (if allowed)
  async cancelOrder(orderId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.put(`${endpoints.buyer.orders}/${orderId}/cancel`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de l\'annulation de la commande',
      };
    }
  }

  // Get order tracking information
  async getOrderTracking(orderId: string): Promise<ApiResponse<{ steps: any[]; currentStep: number }>> {
    try {
      const response = await api.get(`${endpoints.buyer.orders}/${orderId}/tracking`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération du suivi',
      };
    }
  }

  // Request refund for order
  async requestRefund(orderId: string, reason: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post(`${endpoints.buyer.orders}/${orderId}/refund`, { reason });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la demande de remboursement',
      };
    }
  }

  // Get order invoice/receipt
  async getOrderInvoice(orderId: string): Promise<ApiResponse<{ invoiceUrl: string }>> {
    try {
      const response = await api.get(`${endpoints.buyer.orders}/${orderId}/invoice`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération de la facture',
      };
    }
  }

  // Reorder from existing order
  async reorder(orderId: string): Promise<ApiResponse<{ message: string; cartId: number }>> {
    try {
      const response = await api.post(`${endpoints.buyer.orders}/${orderId}/reorder`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la recommande',
      };
    }
  }
}

const orderService = new OrderService();
export default orderService;