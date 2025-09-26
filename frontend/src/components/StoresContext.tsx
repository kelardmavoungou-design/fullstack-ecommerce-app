import { createContext, useContext, useState, useEffect, ReactNode, JSX } from 'react';
import publicService from '../services/publicService';
import sellerService from '../services/sellerService';
import { getImageUrl } from '../services/api';
import { useAuth } from './AuthContext';

export interface Store {
  id: number;
  name: string;
  description: string;
  category: string;
  image: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
  isActive: boolean;
  sellerId: number;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalProducts: number;
    totalSales: number;
    monthlyRevenue: number;
  };
}

interface StoresContextType {
   stores: Store[];
   loading: boolean;
   error: string | null;
   addStore: (store: Omit<Store, 'id' | 'createdAt' | 'updatedAt' | 'stats'>) => Promise<Store>;
   updateStore: (id: number, store: Partial<Store>) => Promise<void>;
   activateStore: (id: number) => Promise<void>;
   deleteStore: (id: number) => Promise<void>;
   getStoresBySeller: (sellerId: number) => Store[];
   getActiveStores: () => Store[];
   getStore: (id: number) => Store | undefined;
   refreshStores: () => Promise<void>;
 }

type ProviderProps = { children: ReactNode };

const StoresContext = createContext<StoresContextType | undefined>(undefined);

// Internal component that can use hooks
function StoresProviderInner({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load stores from API on mount and when user changes
  useEffect(() => {
    const loadStores = async () => {
      if (!user) {
        setStores([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Use sellerService to get only the current user's shops
        const response = await sellerService.getShops();
        if (response.success && response.data) {
          // Convert API response to frontend format
          const apiShops = response.data || [];
          const convertedStores: Store[] = apiShops.map((shop: any) => {
             // Construct full image URL if logo exists
             const imageUrl = getImageUrl(shop.logo) || '';

            return {
              id: shop.id,
              name: shop.name,
              description: shop.description || '',
              category: shop.category || 'Général',
              image: imageUrl,
              logo: shop.logo || '',
              address: shop.address || 'Adresse non spécifiée',
              phone: shop.phone || 'Téléphone non spécifié',
              email: shop.email || '',
              openingHours: shop.opening_hours || '9h - 18h',
              rating: 4.5,
              reviewsCount: 0,
              isVerified: shop.is_active,
              isActive: shop.is_active,
              sellerId: shop.seller_id,
              createdAt: shop.created_at,
              updatedAt: shop.created_at,
              stats: {
                totalProducts: shop.product_count || 0,
                totalSales: shop.order_count || 0,
                monthlyRevenue: 0
              }
            };
          });
          setStores(convertedStores);
        } else {
          setError(response.error || 'Erreur lors du chargement des boutiques');
        }
      } catch (err) {
        console.error('Error loading stores:', err);
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    loadStores();
  }, [user]);

  const refreshStores = async () => {
    if (!user) {
      setStores([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Use sellerService to get only the current user's shops
      const response = await sellerService.getShops();
      if (response.success && response.data) {
        const apiShops = response.data || [];
        const convertedStores: Store[] = apiShops.map((shop: any) => {
          // Construct full image URL if logo exists
          const imageUrl = getImageUrl(shop.logo) || '';

          return {
            id: shop.id,
            name: shop.name,
            description: shop.description || '',
            category: shop.category || 'Général',
            image: imageUrl,
            logo: shop.logo || '',
            address: shop.address || 'Adresse non spécifiée',
            phone: shop.phone || 'Téléphone non spécifié',
            email: shop.email || '',
            openingHours: shop.opening_hours || '9h - 18h',
            rating: 4.5,
            reviewsCount: 0,
            isVerified: shop.is_active,
            isActive: shop.is_active,
            sellerId: shop.seller_id,
            createdAt: shop.created_at,
            updatedAt: shop.created_at,
            stats: {
              totalProducts: shop.product_count || 0,
              totalSales: shop.order_count || 0,
              monthlyRevenue: 0
            }
          };
        });
        setStores(convertedStores);
        setError(null);
      } else {
        setError(response.error || 'Erreur lors du rechargement des boutiques');
      }
    } catch (err) {
      console.error('Error refreshing stores:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const addStore = async (newStore: Omit<Store, 'id' | 'createdAt' | 'updatedAt' | 'stats'>) => {
     try {
       // Use sellerService to create the store via API - Alibaba Algorithm
       const response = await sellerService.createShop({
         name: newStore.name,
         description: newStore.description,
         logo: newStore.logo,
         address: newStore.address,
         phone: newStore.phone,
         email: newStore.email,
         opening_hours: newStore.openingHours,
         category: newStore.category
       });

       if (response.success && response.data) {
         // Construct full image URL if logo exists in response
         const imageUrl = getImageUrl(response.data.logo) || newStore.image;

         // Convert API response to frontend format
         const createdStore: Store = {
           ...newStore,
           id: response.data.id || Date.now(),
           image: imageUrl,
           createdAt: response.data.created_at || new Date().toISOString().split('T')[0],
           updatedAt: new Date().toISOString().split('T')[0],
           stats: {
             totalProducts: 0,
             totalSales: 0,
             monthlyRevenue: 0
           }
         };
         setStores((prev: Store[]) => [...prev, createdStore]);
         return createdStore; // Return the created store for potential use
       } else {
         throw new Error(response.error || 'Erreur lors de la création de la boutique');
       }
     } catch (err) {
       console.error('Error adding store:', err);
       throw new Error('Erreur lors de l\'ajout de la boutique');
     }
   };

  const updateStore = async (id: number, updatedStore: Partial<Store>) => {
    try {
      setStores((prev: Store[]) => prev.map((store: Store) =>
        store.id === id
          ? { ...store, ...updatedStore, updatedAt: new Date().toISOString().split('T')[0] }
          : store
      ));
      // TODO: Implement actual API call to update store
      // await storeService.updateStore(id, updatedStore);
      // await refreshStores();
    } catch (err) {
      console.error('Error updating store:', err);
      throw new Error('Erreur lors de la mise à jour de la boutique');
    }
  };

  const activateStore = async (id: number) => {
    try {
      // Use sellerService to activate the store via API
      const response = await sellerService.activateShop(id.toString());

      if (response.success && response.data) {
        // Update local state
        setStores((prev: Store[]) => prev.map((store: Store) =>
          store.id === id
            ? { ...store, isActive: true, status: 'active', updatedAt: new Date().toISOString().split('T')[0] }
            : store
        ));
      } else {
        throw new Error(response.error || 'Erreur lors de l\'activation de la boutique');
      }
    } catch (err) {
      console.error('Error activating store:', err);
      throw new Error('Erreur lors de l\'activation de la boutique');
    }
  };

  const deleteStore = async (id: number) => {
    try {
      // Call API to delete store from backend
      const deleteResponse = await sellerService.deleteShop(id.toString());
      if (!deleteResponse.success) {
        throw new Error(deleteResponse.error || 'Erreur lors de la suppression de la boutique');
      }

      // Update local state immediately for better UX
      setStores((prev: Store[]) => prev.filter((store: Store) => store.id !== id));

      // Refresh from API to ensure synchronization
      await refreshStores();
    } catch (err) {
      console.error('Error deleting store:', err);
      throw new Error('Erreur lors de la suppression de la boutique');
    }
  };

  const getStoresBySeller = (sellerId: number) => {
    return stores.filter((store: Store) => store.sellerId === sellerId);
  };

  const getActiveStores = () => {
    return stores.filter((store: Store) => store.isActive);
  };

  const getStore = (id: number) => {
    return stores.find((store: Store) => store.id === id);
  };

  return (
    <StoresContext.Provider value={{
      stores,
      loading,
      error,
      addStore,
      updateStore,
      activateStore,
      deleteStore,
      getStoresBySeller,
      getActiveStores,
      getStore,
      refreshStores
    }}>
      {children}
    </StoresContext.Provider>
  ) as JSX.Element;
}

export function StoresProvider({ children }: { children: ReactNode }) {
  return (
    <StoresProviderInner>
      {children}
    </StoresProviderInner>
  );
}

export function useStores() {
  const context = useContext(StoresContext);
  if (context === undefined) {
    throw new Error('useStores must be used within a StoresProvider');
  }
  return context;
}