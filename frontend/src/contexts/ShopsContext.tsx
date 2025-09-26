import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import publicService from '../services/publicService';
import { Shop } from '../services/api';

interface ShopsContextType {
  shops: Shop[];
  loading: boolean;
  error: string | null;
  refreshShops: () => Promise<void>;
  addShop: (shop: Shop) => void;
}

const ShopsContext = createContext<ShopsContextType | undefined>(undefined);

interface ShopsProviderProps {
  children: ReactNode;
}

export function ShopsProvider({ children }: ShopsProviderProps) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshShops = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await publicService.getShops();
      if (response.success && response.data) {
        setShops(response.data.shops);
      } else {
        setError(response.error || 'Failed to load shops');
      }
    } catch (err) {
      setError('Failed to load shops');
    } finally {
      setLoading(false);
    }
  }, []);

  const addShop = useCallback((shop: Shop) => {
    setShops(prevShops => {
      // Check if shop already exists to avoid duplicates
      const exists = prevShops.some(s => s.id === shop.id);
      if (exists) {
        return prevShops;
      }
      return [shop, ...prevShops];
    });
  }, []);

  const value: ShopsContextType = {
    shops,
    loading,
    error,
    refreshShops,
    addShop,
  };

  return (
    <ShopsContext.Provider value={value}>
      {children}
    </ShopsContext.Provider>
  );
}

export function useShops() {
  const context = useContext(ShopsContext);
  if (context === undefined) {
    throw new Error('useShops must be used within a ShopsProvider');
  }
  return context;
}