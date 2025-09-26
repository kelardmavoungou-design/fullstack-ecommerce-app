import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create separate axios instance for public routes (no auth required)
export const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token (only for authenticated routes)
api.interceptors.request.use(
  (config) => {
    // Skip adding auth token for public routes
    const publicRoutes = [
      '/ad-campaigns/serve',
      '/ad-campaigns/serve/multiple',
      '/shops',
      '/products'
    ];

    const isPublicRoute = publicRoutes.some(route => {
      // Check if the URL path starts with the route (more precise than includes)
      const urlPath = config.url?.split('?')[0] || ''; // Remove query params
      return urlPath === route || urlPath.startsWith(route + '/');
    });

    if (!isPublicRoute) {
      // Try sessionStorage first, then localStorage
      let token = sessionStorage.getItem('somba_token');
      if (!token) {
        token = localStorage.getItem('somba_token');
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si c'est une erreur 401 et qu'on n'a pas déjà essayé de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Tenter de refresh le token
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
          {},
          { withCredentials: true } // Important pour envoyer le cookie refreshToken
        );

        const { accessToken, user } = refreshResponse.data;

        // Stocker le nouveau access token
        localStorage.setItem('somba_token', accessToken);
        localStorage.setItem('somba_current_user', JSON.stringify(user));

        // Mettre à jour le header Authorization pour la requête originale
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Relancer la requête originale
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh a échoué, déconnexion silencieuse
        localStorage.removeItem('somba_token');
        localStorage.removeItem('somba_current_user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Pour les autres erreurs 401/403 ou si refresh a échoué
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('somba_token');
      localStorage.removeItem('somba_current_user');
      // Temporarily disable redirect to prevent page reloading loops
      // window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Response interceptor for public API (no auth handling)
publicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

// Utility function to get full image URL
export const getImageUrl = (imagePath: string | undefined | null): string | undefined => {
  if (!imagePath) return undefined;

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's a base64 data URL, return as is
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }

  // Construct full URL for backend images
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const backendBaseURL = baseURL.replace('/api', '');

  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;

  return `${backendBaseURL}/${cleanPath}`;
};

// API Endpoints
export const endpoints = {
  // Auth
  auth: {
    register: '/auth/register',
    verifyOtp: '/auth/verify-otp',
    login: '/auth/login',
    requestPasswordReset: '/auth/request-password-reset',
    resetPassword: '/auth/reset-password',
    profile: '/auth/profile',
    uploadPhoto: '/auth/upload-photo',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },

  // Products
  products: {
    list: '/products',
    details: (id: string) => `/products/${id}`,
    reviews: (id: string) => `/products/${id}/reviews`,
  },

  // Buyer
  buyer: {
    cart: '/buyer/cart',
    orders: '/buyer/orders',
    wishlist: '/buyer/wishlist',
    products: '/buyer/products',
    stats: '/buyer/stats',
    addresses: '/buyer/addresses',
    notifications: '/buyer/notifications',
  },

  // Seller
  seller: {
    shops: '/seller/shops',
    products: (shopId: string) => `/seller/shops/${shopId}/products`,
    orders: (shopId: string) => `/seller/shops/${shopId}/orders`,
    stats: (shopId: string) => `/seller/shops/${shopId}/stats`,
    categories: (shopId: string) => `/seller/shops/${shopId}/categories`,
    profile: '/seller/profile',
  },

  // Admin
  admin: {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    shops: '/admin/shops',
    reports: '/admin/reports',
    platformStats: '/admin/platform-stats',
  },

  // Payments
  payments: {
    card: '/payments/card',
    mobileMoney: '/payments/mobile-money',
    cash: '/payments/cash',
    verifyDelivery: '/payments/verify-delivery',
    status: (paymentId: string) => `/payments/${paymentId}`,
    refund: '/payments/refund',
  },

  // Ads
  ads: {
    list: '/ads',
    sellerAds: '/seller/ads',
    stats: '/ads/stats',
  },

  // Public Shops
  public: {
    shops: '/shops',
  },

  // Delivery
  delivery: {
    assigned: '/delivery/assigned',
    details: (deliveryId: string) => `/delivery/${deliveryId}`,
    updateStatus: '/delivery/status',
  },
};

// Types
export interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  role: 'buyer' | 'seller' | 'superadmin' | 'delivery';
  avatar?: string;
  is_verified?: boolean;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  images?: string[]; // Array of image URLs for gallery
  variants?: any;
  shop_name?: string;
  shop_logo?: string;
  rating?: number;
  reviews_count?: number;
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  name: string;
  price: number;
  image?: string;
  stock: number;
  shop_name?: string;
  itemTotal: number;
}

export interface Order {
  id: number;
  buyer_id: number;
  shop_id?: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  payment_method: 'mobile_money' | 'cash_on_delivery';
  shipping_address?: string;
  created_at: string;
  shop_name?: string;
  shop_logo?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  name: string;
  image?: string;
}

export interface WishlistItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  image?: string;
  category: string;
  shop_name?: string;
  created_at: string;
}

export interface Review {
  id: number;
  buyer_id: number;
  product_id: number;
  rating: number;
  comment?: string;
  created_at: string;
  reviewer_name: string;
}

export interface Shop {
  id: number;
  seller_id: number;
  name: string;
  description?: string;
  logo?: string;
  is_active: boolean;
  created_at: string;
  address?: string;
  phone?: string;
  email?: string;
  opening_hours?: string;
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  footer_description?: string;
  product_count?: number;
  order_count?: number;
  total_sales?: number;
}

export interface Ad {
  id: number;
  shop_id?: number;
  title: string;
  content: string;
  image?: string;
  target_region?: string;
  target_category?: string;
  budget: number;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  shop_name?: string;
  seller_name?: string;
}

export interface PaymentData {
  orderId: number;
  paymentMethodId?: string; // For Stripe
  phoneNumber?: string; // For mobile money
  shippingAddress?: string; // For cash on delivery
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface BuyerStats {
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  favoritesCount: number;
  recentOrders: number;
  statusBreakdown: Array<{
    status: string;
    count: number;
  }>;
}

export interface Address {
  id: string;
  label: string;
  fullAddress: string;
  isDefault: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'promo' | 'system';
  date: string;
  read: boolean;
}