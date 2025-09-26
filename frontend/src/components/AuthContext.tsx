import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import authService from '../services/authService';
import { User } from '../services/api';

interface RegisterData {
  full_name: string;
  email: string;
  phone_number: string;
  password: string;
  confirmPassword: string;
  role: 'buyer' | 'seller';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; requiresOTP?: boolean }>;
  oauthLogin: (accessToken: string, provider: 'google' | 'facebook') => Promise<{ success: boolean; user?: User }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; userId?: string; requiresEmailConfirmation?: boolean; error?: string }>;
  verifyOTP: (userId: string, otp: string, type: 'registration' | 'login' | 'recovery') => Promise<{ success: boolean; user?: User }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean }>;
  resetPassword: (userId: string, otp: string, newPassword: string) => Promise<{ success: boolean }>;
  updateProfile: (profileData: any) => Promise<{ success: boolean; user?: User }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  getUsersByRole: () => User[];
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: any }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger l'utilisateur connecté depuis sessionStorage/localStorage au démarrage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try sessionStorage first, then localStorage
        let storedUser = sessionStorage.getItem('somba_current_user');
        let token = sessionStorage.getItem('somba_token');

        if (!storedUser || !token) {
          storedUser = localStorage.getItem('somba_current_user');
          token = localStorage.getItem('somba_token');
        }

        if (storedUser && token) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // Vérifier si le token est toujours valide - only if we haven't checked recently
          const lastCheck = sessionStorage.getItem('auth_last_check');
          const now = Date.now();
          const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

          if (!lastCheck || (now - parseInt(lastCheck)) > CHECK_INTERVAL) {
            try {
              const profileResponse = await authService.getProfile();
              if (profileResponse.success) {
                setUser(profileResponse.data!);
                sessionStorage.setItem('auth_last_check', now.toString());
                try {
                  sessionStorage.setItem('somba_current_user', JSON.stringify(profileResponse.data));
                  sessionStorage.setItem('somba_token', token);
                } catch (storageError) {
                  console.warn('sessionStorage blocked, trying localStorage');
                  try {
                    localStorage.setItem('somba_current_user', JSON.stringify(profileResponse.data));
                    localStorage.setItem('somba_token', token);
                  } catch (localStorageError) {
                    console.warn('Both storages blocked, authentication may not persist');
                  }
                }
              } else {
                // Token invalide ou expiré, déconnexion silencieuse
                logout();
              }
            } catch (error) {
              // Token invalide ou erreur réseau, déconnexion silencieuse
              logout();
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'authentification:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; user?: User; requiresOTP?: boolean }> => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });

      if (response.success && response.data) {
        const { user: loggedInUser, accessToken, requiresOTP } = response.data;

        if (!requiresOTP && loggedInUser) {
          // Store fresh user data - try sessionStorage first, then localStorage
          try {
            sessionStorage.setItem('somba_current_user', JSON.stringify(loggedInUser));
            sessionStorage.setItem('somba_token', accessToken);
          } catch (sessionError) {
            console.warn('sessionStorage blocked, trying localStorage');
            try {
              localStorage.setItem('somba_current_user', JSON.stringify(loggedInUser));
              localStorage.setItem('somba_token', accessToken);
            } catch (localError) {
              console.warn('Both storages blocked, authentication may not persist');
            }
          }
          setUser(loggedInUser);
          return { success: true, user: loggedInUser };
        }

        return { success: true, requiresOTP: true };
      }

      return { success: false };
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const oauthLogin = useCallback(async (accessToken: string, provider: 'google' | 'facebook'): Promise<{ success: boolean; user?: User }> => {
    console.log('🔐 oauthLogin called with provider:', provider);
    setLoading(true);
    try {
      // Store the token first
      console.log('💾 Storing OAuth token...');
      localStorage.setItem('somba_token', accessToken);

      // Fetch user profile with the token
      console.log('📡 Fetching user profile from backend...');
      const profileResponse = await authService.getProfile();
      console.log('📦 Profile response:', profileResponse);

      if (profileResponse.success && profileResponse.data) {
        const user = profileResponse.data;
        console.log('👤 User data received:', user);

        // Store user data
        try {
          console.log('💾 Storing user data in sessionStorage...');
          sessionStorage.setItem('somba_current_user', JSON.stringify(user));
          sessionStorage.setItem('somba_token', accessToken);
        } catch (sessionError) {
          console.warn('sessionStorage blocked, trying localStorage');
          try {
            localStorage.setItem('somba_current_user', JSON.stringify(user));
            localStorage.setItem('somba_token', accessToken);
          } catch (localError) {
            console.warn('Both storages blocked, authentication may not persist');
          }
        }

        console.log('🔄 Setting user in AuthContext state...');
        setUser(user);
        console.log('✅ OAuth login completed successfully');
        return { success: true, user };
      }

      console.log('❌ Profile fetch failed');
      return { success: false };
    } catch (error) {
      console.error('💥 Erreur lors de la connexion OAuth:', error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: RegisterData): Promise<{ success: boolean; userId?: string; requiresEmailConfirmation?: boolean; error?: string }> => {
    setLoading(true);
    try {
      // Send data directly to API (no transformation needed)
      const response = await authService.register(userData);

      if (response.success && response.data) {
        return {
          success: true,
          userId: response.data.userId,
          requiresEmailConfirmation: response.data.requiresEmailConfirmation
        };
      }

      // Return the error message from authService
      return {
        success: false,
        error: response.error || 'Erreur lors de l\'inscription'
      };
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      // Re-throw the error so RegisterPage can handle it properly
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (userId: string, otp: string, type: 'registration' | 'login' | 'recovery'): Promise<{ success: boolean; user?: User }> => {
    setLoading(true);
    try {
      const response = await authService.verifyOTP({ userId, otp, type });

      if (response.success && response.data) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }

      return { success: false };
    } catch (error) {
      console.error('Erreur lors de la vérification OTP:', error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      const response = await authService.requestPasswordReset(email);
      return { success: response.success };
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (userId: string, otp: string, newPassword: string): Promise<{ success: boolean }> => {
    setLoading(true);
    try {
      const response = await authService.resetPassword({ userId, otp, newPassword });
      return { success: response.success };
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profileData: any): Promise<{ success: boolean; user?: User }> => {
    setLoading(true);
    try {
      console.log('🔄 AuthContext.updateProfile called with:', profileData);
      const response = await authService.updateProfile(profileData);
      console.log('📦 AuthContext.updateProfile response:', response);

      if (response.success && response.data) {
        console.log('✅ Updating user state with:', response.data);
        // Update the user state and localStorage
        setUser(response.data);
        localStorage.setItem('somba_current_user', JSON.stringify(response.data));
        return { success: true, user: response.data };
      }

      console.log('❌ Profile update failed');
      return { success: false };
    } catch (error) {
      console.error('💥 Erreur lors de la mise à jour du profil:', error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const getUsersByRole = (): User[] => {
    // Cette fonction pourrait être utilisée pour des fonctionnalités admin
    // Pour l'instant, on retourne un tableau vide car elle nécessite des appels API spéciaux
    return [];
  };

  const logout = useCallback(async () => {
    setUser(null);
    await authService.logout();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      oauthLogin,
      register,
      verifyOTP,
      requestPasswordReset,
      resetPassword,
      updateProfile,
      logout,
      isAuthenticated: !!user,
      getUsersByRole,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During hot reload, context might be temporarily undefined
    // Return a default context to prevent crashes
    console.warn('AuthProvider context not available, using fallback');
    return {
      user: null,
      login: async () => ({ success: false }),
      oauthLogin: async () => ({ success: false, user: undefined }),
      register: async () => ({ success: false, requiresEmailConfirmation: false }),
      verifyOTP: async () => ({ success: false }),
      requestPasswordReset: async () => ({ success: false }),
      resetPassword: async () => ({ success: false }),
      updateProfile: async () => ({ success: false }),
      logout: async () => {},
      isAuthenticated: false,
      getUsersByRole: () => [],
      loading: false
    };
  }
  return context;
}