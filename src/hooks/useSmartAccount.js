"use client";

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { getSmartAccountInfo, checkSmartAccountSupport } from '@/utils/smartAccountUtils';

export const useSmartAccount = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [smartAccountInfo, setSmartAccountInfo] = useState(null);
  const [isSmartAccount, setIsSmartAccount] = useState(false);
  const [capabilities, setCapabilities] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSmartAccountInfo = async () => {
      if (!isConnected || !address || !walletClient) {
        setSmartAccountInfo(null);
        setIsSmartAccount(false);
        setCapabilities(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get Smart Account information
        const accountInfo = await getSmartAccountInfo(address, walletClient);
        setSmartAccountInfo(accountInfo);
        setIsSmartAccount(accountInfo?.isSmartAccount || false);

        // Get capabilities with error handling
        const caps = await checkSmartAccountSupport(walletClient);
        setCapabilities(caps || { isSupported: false, capabilities: {}, provider: 'Unknown' });

        console.log('Smart Account Info:', accountInfo);
        console.log('Smart Account Capabilities:', caps);
      } catch (err) {
        console.error('Error loading Smart Account info:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadSmartAccountInfo();
  }, [isConnected, address, walletClient]);

  const enableSmartAccountFeatures = async () => {
    if (!walletClient || !window.ethereum) return false;

    try {
      setIsLoading(true);
      const provider = window.ethereum;
      
      // Request Smart Account permissions
      const permissions = await provider.request({
        method: 'wallet_requestPermissions',
        params: [{
          eth_accounts: {},
        }]
      }).catch(() => null);

      if (permissions) {
        // Reload capabilities after enabling
        const caps = await checkSmartAccountSupport(walletClient);
        setCapabilities(caps || { isSupported: false, capabilities: {}, provider: 'Unknown' });
      }

      return !!permissions;
    } catch (err) {
      console.error('Error enabling Smart Account features:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const batchTransactions = async (transactions) => {
    if (!walletClient || !window.ethereum || !isSmartAccount) {
      throw new Error('Smart Account not available for batch transactions');
    }

    try {
      const provider = window.ethereum;
      
      const result = await provider.request({
        method: 'eth_sendTransactionBatch',
        params: [transactions]
      });

      return result;
    } catch (err) {
      console.error('Error executing batch transactions:', err);
      throw err;
    }
  };

  return {
    // State
    smartAccountInfo,
    isSmartAccount,
    capabilities,
    isLoading,
    error,
    
    // Actions
    enableSmartAccountFeatures,
    batchTransactions,
    
    // Computed values
    hasSmartAccountSupport: !!capabilities?.isSupported,
    supportedFeatures: smartAccountInfo?.features || {},
  };
};