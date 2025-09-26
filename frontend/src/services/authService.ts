import axios from 'axios';
import api, { User, ApiResponse, endpoints } from './api';

export interface RegisterData {
  full_name: string;
  email: string;
  phone_number: string;
  password: string;
  role: 'buyer' | 'seller';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface OTPData {
  userId: string;
  otp: string;
  type: 'registration' | 'login' | 'recovery';
}

export interface PasswordResetData {
  userId: string;
  otp: string;
  newPassword: string;
}

export interface ProfileUpdateData {
  full_name?: string;
  email?: string;
  phone_number?: string;
  avatar?: string;
}

class AuthService {
  // Register a new user
  async register(userData: RegisterData): Promise<ApiResponse<{ userId: string; emailSent: boolean; requiresEmailConfirmation: boolean }>> {
    try {
      const response = await api.post(endpoints.auth.register, userData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de l\'inscription',
      };
    }
  }

  // Verify OTP
  async verifyOTP(otpData: OTPData): Promise<ApiResponse<{ user: User; accessToken: string }>> {
    try {
      const response = await api.post(endpoints.auth.verifyOtp, otpData);
      const { user, accessToken } = response.data;

      // Store token and user data
      if (accessToken) {
        localStorage.setItem('somba_token', accessToken);
        localStorage.setItem('somba_current_user', JSON.stringify(user));
      }

      return {
        success: true,
        data: { user, accessToken },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la vérification OTP',
      };
    }
  }

  // Login user
  async login(credentials: LoginData): Promise<ApiResponse<{ user: User; accessToken: string; requiresOTP?: boolean }>> {
    try {
      const response = await api.post(endpoints.auth.login, credentials);
      const { user, accessToken, requiresOTP } = response.data;

      // If OTP is required, don't store token yet
      if (!requiresOTP && accessToken) {
        try {
          sessionStorage.setItem('somba_token', accessToken);
          sessionStorage.setItem('somba_current_user', JSON.stringify(user));
        } catch (sessionError) {
          console.warn('sessionStorage blocked, trying localStorage');
          try {
            localStorage.setItem('somba_token', accessToken);
            localStorage.setItem('somba_current_user', JSON.stringify(user));
          } catch (localError) {
            console.warn('Both storages blocked, authentication may not persist');
          }
        }
      }

      return {
        success: true,
        data: { user, accessToken, requiresOTP },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la connexion',
      };
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post(endpoints.auth.requestPasswordReset, { email });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la demande de réinitialisation',
      };
    }
  }

  // Reset password
  async resetPassword(resetData: PasswordResetData): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post(endpoints.auth.resetPassword, resetData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe',
      };
    }
  }

  // Get user profile
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await api.get(endpoints.auth.profile);
      return {
        success: true,
        data: response.data.user, // Backend returns { user: {...} }, so extract the user object
      };
    } catch (error: any) {
      // Handle authentication errors silently
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Token invalid or expired - don't log error, just return failure
        return {
          success: false,
          error: 'Token invalide',
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération du profil',
      };
    }
  }

  // Update user profile
  async updateProfile(profileData: ProfileUpdateData): Promise<ApiResponse<User>> {
    try {
      const response = await api.put(endpoints.auth.profile, profileData);

      // Update stored user data - try sessionStorage first, then localStorage
      try {
        const currentUserStr = sessionStorage.getItem('somba_current_user') || localStorage.getItem('somba_current_user');
        const currentUser = currentUserStr ? JSON.parse(currentUserStr) : {};
        // Backend returns { message: '...', user: {...} }, so extract the user object
        const updatedUser = { ...currentUser, ...response.data.user };
        // Update both storages to maintain consistency
        sessionStorage.setItem('somba_current_user', JSON.stringify(updatedUser));
        localStorage.setItem('somba_current_user', JSON.stringify(updatedUser));
      } catch (storageError) {
        console.warn('Error updating user data in storage:', storageError);
      }

      // Return the user object, not the full response
      return {
        success: true,
        data: response.data.user,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la mise à jour du profil',
      };
    }
  }

  // Upload profile photo
  async uploadProfilePhoto(photoFile: File): Promise<ApiResponse<{ photoUrl: string }>> {
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);

      // Create a separate axios instance for file upload to avoid default headers
      const uploadApi = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
      });

      // Add auth token for file upload
      uploadApi.interceptors.request.use(
        (config: any) => {
          // Try sessionStorage first, then localStorage (same as main api interceptor)
          let token = sessionStorage.getItem('somba_token');
          if (!token) {
            token = localStorage.getItem('somba_token');
          }
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error: any) => Promise.reject(error)
      );

      const response = await uploadApi.post(endpoints.auth.uploadPhoto, formData);

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors du téléchargement de la photo',
      };
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      // Call backend logout to clear refresh token cookie
      await api.post(endpoints.auth.logout || '/auth/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion côté serveur:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('somba_token');
      localStorage.removeItem('somba_current_user');
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    // Try sessionStorage first, then localStorage (same as api interceptor)
    let token = sessionStorage.getItem('somba_token');
    let user = sessionStorage.getItem('somba_current_user');
    if (!token || !user) {
      token = localStorage.getItem('somba_token');
      user = localStorage.getItem('somba_current_user');
    }
    return !!(token && user);
  }

  // Get current user
  getCurrentUser(): User | null {
    try {
      // Try sessionStorage first, then localStorage (same as api interceptor)
      let userStr = sessionStorage.getItem('somba_current_user');
      if (!userStr) {
        userStr = localStorage.getItem('somba_current_user');
      }
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  // Get token
  getToken(): string | null {
    // Try sessionStorage first, then localStorage (same as api interceptor)
    let token = sessionStorage.getItem('somba_token');
    if (!token) {
      token = localStorage.getItem('somba_token');
    }
    return token;
  }
}

const authService = new AuthService();
export default authService;