import api, { ApiResponse } from './api';

export interface Delivery {
  id: number;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  assigned_at: string;
  picked_up_at?: string;
  delivered_at?: string;
  notes?: string;
  order: {
    id: number;
    total: number;
    shipping_address?: string;
    delivery_code?: string;
    order_date: string;
    buyer: {
      name: string;
      phone?: string;
      email?: string;
    };
    shop: {
      name: string;
      phone?: string;
      email?: string;
      address?: string;
    };
    items: Array<{
      product_id: number;
      name: string;
      quantity: number;
      price: number;
      image?: string;
    }>;
  };
}

class DeliveryService {
  // Get assigned deliveries for the current delivery person
  async getAssignedDeliveries(): Promise<ApiResponse<Delivery[]>> {
    try {
      const response = await api.get('/delivery/assigned');
      return {
        success: true,
        data: response.data.deliveries,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des livraisons',
      };
    }
  }

  // Get details of a specific delivery
  async getDeliveryDetails(deliveryId: string): Promise<ApiResponse<Delivery>> {
    try {
      const response = await api.get(`/delivery/${deliveryId}`);
      return {
        success: true,
        data: response.data.delivery,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des détails de livraison',
      };
    }
  }

  // Update delivery status
  async updateDeliveryStatus(deliveryId: number, status: string, notes?: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.put('/delivery/status', {
        deliveryId,
        status,
        notes,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la mise à jour du statut de livraison',
      };
    }
  }
}

const deliveryService = new DeliveryService();
export default deliveryService;