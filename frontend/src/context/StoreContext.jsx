import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [storeSettings, setStoreSettings] = useState({
    shopName: 'STEP HOUSE',
    tagline: 'Premium Multi-Brand Footwear Destination',
    address: 'Plot 42, Commercial Avenue, Fashion Street, Sector 18',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    contactNumber: '+91 98102 34567',
    openingTime: '10:00 AM',
    closingTime: '09:30 PM',
    workingDays: 'Open All 7 Days (Mon - Sun)',
    googleMapsLocationUrl: 'https://maps.google.com/?q=Step+House+Footwear+Store',
    googleMapsEmbedUrl: '',
    googleReviewUrl: '',
    shopDescription: '',
    lowStockThreshold: 2,
    googleRating: 4.8,
    totalGoogleReviews: 312,
  });

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch store settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/store-settings');
      if (res.data.success && res.data.settings) {
        setStoreSettings(res.data.settings);
      }
    } catch (err) {
      console.error('Error fetching store settings:', err);
    }
  }, []);

  // Fetch brands
  const fetchBrands = useCallback(async () => {
    try {
      const res = await api.get('/brands');
      if (res.data.success) {
        setBrands(res.data.brands);
      }
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      await Promise.all([fetchSettings(), fetchBrands(), fetchCategories()]);
      setIsLoading(false);
    };
    initData();
  }, [fetchSettings, fetchBrands, fetchCategories]);

  return (
    <StoreContext.Provider
      value={{
        storeSettings,
        setStoreSettings,
        fetchSettings,
        brands,
        fetchBrands,
        categories,
        fetchCategories,
        isLoading,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

