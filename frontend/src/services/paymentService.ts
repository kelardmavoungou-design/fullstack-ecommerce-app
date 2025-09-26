import api, { ApiResponse, endpoints } from './api';

export interface PaymentData {
  orderId: number;
  paymentMethodId?: string; // For Stripe
  phoneNumber?: string; // For mobile money
  shippingAddress?: string; // For cash on delivery
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  status?: string;
  message?: string;
  redirectUrl?: string; // For external payment gateways
}

export interface DeliveryVerificationData {
  orderId: number;
  deliveryCode: string;
}

export interface RefundData {
  paymentId: string;
  refundAmount: number;
  reason?: string;
}

class PaymentService {
  // Process card payment (Stripe)
  async processCardPayment(paymentData: PaymentData): Promise<ApiResponse<PaymentResult>> {
    try {
      const response = await api.post(endpoints.payments.card, paymentData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors du paiement par carte',
      };
    }
  }

  // Process mobile money payment
  async processMobileMoneyPayment(paymentData: PaymentData): Promise<ApiResponse<PaymentResult>> {
    try {
      const response = await api.post(endpoints.payments.mobileMoney, paymentData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors du paiement mobile money',
      };
    }
  }

  // Process cash on delivery payment
  async processCashPayment(paymentData: PaymentData): Promise<ApiResponse<PaymentResult>> {
    try {
      const response = await api.post(endpoints.payments.cash, paymentData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors du paiement à la livraison',
      };
    }
  }

  // Verify delivery code
  async verifyDeliveryCode(verificationData: DeliveryVerificationData): Promise<ApiResponse<{ verified: boolean; message: string }>> {
    try {
      const response = await api.post(endpoints.payments.verifyDelivery, verificationData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la vérification du code de livraison',
      };
    }
  }

  // Get payment status
  async getPaymentStatus(paymentId: string): Promise<ApiResponse<{ status: string; details?: any }>> {
    try {
      const response = await api.get(endpoints.payments.status(paymentId));
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération du statut du paiement',
      };
    }
  }

  // Process refund
  async processRefund(refundData: RefundData): Promise<ApiResponse<{ refundId: string; status: string }>> {
    try {
      const response = await api.post(endpoints.payments.refund, refundData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors du traitement du remboursement',
      };
    }
  }

  // Get payment methods available for user
  async getAvailablePaymentMethods(): Promise<ApiResponse<{ methods: string[] }>> {
    try {
      const response = await api.get('/payments/methods');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des méthodes de paiement',
      };
    }
  }

  // Validate payment method
  async validatePaymentMethod(method: string, data: any): Promise<ApiResponse<{ valid: boolean; message?: string }>> {
    try {
      const response = await api.post('/payments/validate', { method, data });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la validation de la méthode de paiement',
      };
    }
  }

  // Get payment history for user
  async getPaymentHistory(page: number = 1, limit: number = 10): Promise<ApiResponse<{ payments: any[]; total: number; page: number; limit: number }>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await api.get(`/payments/history?${params.toString()}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération de l\'historique des paiements',
      };
    }
  }

  // Initialize Stripe payment intent
  async createPaymentIntent(amount: number, currency: string = 'XOF'): Promise<ApiResponse<{ clientSecret: string; paymentIntentId: string }>> {
    try {
      const response = await api.post('/payments/create-intent', { amount, currency });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la création du paiement',
      };
    }
  }

  // Confirm Stripe payment
  async confirmStripePayment(paymentIntentId: string, paymentMethodId: string): Promise<ApiResponse<PaymentResult>> {
    try {
      const response = await api.post('/payments/confirm-stripe', {
        paymentIntentId,
        paymentMethodId,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la confirmation du paiement Stripe',
      };
    }
  }
}

const paymentService = new PaymentService();
export default paymentService;