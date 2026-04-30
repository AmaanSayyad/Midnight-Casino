"use client";
import { useState, useEffect } from 'react';

// Mock data for Polygon Amoy testnet
const MOCK_BALANCES = {
  native: {
    symbol: 'MATIC',
    formatted: '25.1234',
    value: '25123400000000000000000',
    decimals: 18
  },
  eth: {
    symbol: 'MATIC',
    formatted: '500.00',
    value: '500000000000000000000000',
    decimals: 18
  },
  other: []
};

export const useUserBalances = () => {
  const [balances, setBalances] = useState({
    native: null,
    eth: null,
    other: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setBalances({
        ...MOCK_BALANCES,
        loading: false
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Mock function to refresh balances
  const refreshBalances = async () => {
    setBalances(prev => ({ ...prev, loading: true }));
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setBalances({
      ...MOCK_BALANCES,
      loading: false
    });
  };

  return {
    ...balances,
    refreshBalances
  };
};

export default useUserBalances; 