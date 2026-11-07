import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [storeSettings, setStoreSettings] = useState({
    shopName: 'NEW MB SHOES',
    tagline: 'Multi-Brand Footwear Showroom | Bhagalpur',
    address: 'D.N. Singh Road, Shah Market (Near Titan World), Khalifabagh Chowk, Tatarpur',
    city: 'Bhagalpur',
    state: 'Bihar',
    pincode: '812001',
    contactNumber: '+91 94312 14500',
    alternateContact: '+91 94312 14501',
    email: 'contact@newmbshoes.com',
    openingTime: '10:00 AM',
    closingTime: '09:30 PM',
    workingDays: 'Open All 7 Days (Mon - Sun)',
    googleMapsLocationUrl: 'https://maps.app.goo.gl/vF32PqqHXmZ6mKTx6',
    googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.2045584828623!2d86.9753713!3d25.247063!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f04bc68c3ae729%3A0x8e3ba4d6ccca5905!2sNEW%20MB%20SHOES!5e0!3m2!1sen!2sin!4v1715000000000!5m2!1sen!2sin',
    googleBusinessProfileUrl: 'https://maps.app.goo.gl/vF32PqqHXmZ6mKTx6',
    googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJKee6jMZL8DkRBVnKzNakO44',
    shopDescription: 'NEW MB SHOES is Bhagalpur\'s premier multi-brand footwear showroom located at Shah Market, D.N. Singh Road. We offer genuine collections of sports shoes, sneakers, formal shoes, boots, heels, and kids school shoes. Visit our physical showroom for perfect trials & fittings.',
    lowStockThreshold: 2,
    googleRating: 4.3,
    totalGoogleReviews: 128,
    branches: [
      {
        id: 'branch-1',
        name: 'NEW MB SHOES (Main Flagship Showroom)',
        tag: 'Main Store',
        address: 'D.N. Singh Road, Shah Market (Near Titan World), Khalifabagh Chowk, Tatarpur',
        landmark: 'Near Titan World, Shah Market',
        city: 'Bhagalpur',
        state: 'Bihar',
        pincode: '812001',
        contactNumber: '+91 94312 14500',
        googleMapsLocationUrl: 'https://maps.app.goo.gl/vF32PqqHXmZ6mKTx6',
        googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.2045584828623!2d86.9753713!3d25.247063!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f04bc68c3ae729%3A0x8e3ba4d6ccca5905!2sNEW%20MB%20SHOES!5e0!3m2!1sen!2sin!4v1715000000000!5m2!1sen!2sin',
        openingHours: '10:00 AM - 09:30 PM (All 7 Days)',
        isPrimary: true,
      },
      {
        id: 'branch-2',
        name: 'MB SHOES (Tatarpur Showroom)',
        tag: 'Market Branch',
        address: 'Tatarpur Main Market Road, Near Chowk',
        landmark: 'Tatarpur Chowk Market',
        city: 'Bhagalpur',
        state: 'Bihar',
        pincode: '812002',
        contactNumber: '+91 94312 14500',
        googleMapsLocationUrl: 'https://maps.app.goo.gl/vF32PqqHXmZ6mKTx6',
        googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.2045584828623!2d86.9753713!3d25.247063!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f04bc68c3ae729%3A0x8e3ba4d6ccca5905!2sNEW%20MB%20SHOES!5e0!3m2!1sen!2sin!4v1715000000000!5m2!1sen!2sin',
        openingHours: '10:00 AM - 09:30 PM (All 7 Days)',
        isPrimary: false,
      },
      {
        id: 'branch-3',
        name: 'MB SHOES (Tilkamanjhi 3rd Showroom)',
        tag: '3rd Dukan - Tilkamanjhi',
        address: 'Tilkamanjhi Main Road / Chowk',
        landmark: 'Tilkamanjhi Chowk',
        city: 'Bhagalpur',
        state: 'Bihar',
        pincode: '812001',
        contactNumber: '+91 94312 14500',
        googleMapsLocationUrl: 'https://maps.app.goo.gl/38363DB6kC7D1Qiv5',
        googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.10!2d86.999969!3d25.2535303!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f037032e2bf8bf%3A0x29f99a87912db23a!2sMB%20SHOES!5e0!3m2!1sen!2sin!4v1715000000000!5m2!1sen!2sin',
        openingHours: '10:00 AM - 09:30 PM (All 7 Days)',
        isPrimary: false,
      },
    ],
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

