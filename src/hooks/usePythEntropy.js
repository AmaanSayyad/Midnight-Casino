/**
 * Pyth Entropy Hook
 * React hook for managing Pyth Entropy random number generation
 */

import { useState, useEffect, useCallback } from 'react';
import pythEntropyService from '../services/PythEntropyService.js';
import entropyExplorerService from '../services/EntropyExplorerService.js';

export const usePythEntropy = (network = null) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [networkConfig, setNetworkConfig] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);

  // Initialize the service
  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await pythEntropyService.initialize(network);
      const config = pythEntropyService.getNetworkConfig();
      
      setNetworkConfig(config);
      setIsInitialized(true);
      
      console.log('✅ Pyth Entropy hook initialized');
    } catch (err) {
      console.error('❌ Failed to initialize Pyth Entropy:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [network]);

  // Generate random number for a game
  const generateRandom = useCallback(async (gameType, gameConfig = {}) => {
    if (!isInitialized) {
      throw new Error('Pyth Entropy not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await pythEntropyService.generateRandom(gameType, gameConfig);
      
      // Add to recent requests
      setRecentRequests(prev => [result, ...prev.slice(0, 9)]); // Keep last 10
      
      return result;
    } catch (err) {
      console.error('❌ Failed to generate random:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Generate multiple random numbers
  const generateRandomBatch = useCallback(async (requests) => {
    if (!isInitialized) {
      throw new Error('Pyth Entropy not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const results = await pythEntropyService.generateRandomBatch(requests);
      
      // Add to recent requests
      setRecentRequests(prev => [...results, ...prev.slice(0, 10 - results.length)]);
      
      return results;
    } catch (err) {
      console.error('❌ Failed to generate random batch:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Get request status
  const getRequestStatus = useCallback(async (requestId) => {
    try {
      return await pythEntropyService.getRequestStatus(requestId);
    } catch (err) {
      console.error('❌ Failed to get request status:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Verify random value
  const verifyRandomValue = useCallback(async (requestId, randomValue) => {
    try {
      return await entropyExplorerService.verifyRandomValue(requestId, randomValue, network);
    } catch (err) {
      console.error('❌ Failed to verify random value:', err);
      setError(err.message);
      throw err;
    }
  }, [network]);

  // Get recent requests from explorer
  const getRecentRequests = useCallback(async () => {
    try {
      const requests = await entropyExplorerService.getRecentRequests(network, 20);
      setRecentRequests(requests);
      return requests;
    } catch (err) {
      console.error('❌ Failed to get recent requests:', err);
      setError(err.message);
      throw err;
    }
  }, [network]);

  // Get network statistics
  const getNetworkStats = useCallback(async () => {
    try {
      return await entropyExplorerService.getNetworkStats(network);
    } catch (err) {
      console.error('❌ Failed to get network stats:', err);
      setError(err.message);
      throw err;
    }
  }, [network]);

  // Switch network
  const switchNetwork = useCallback(async (newNetwork) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await pythEntropyService.switchNetwork(newNetwork);
      const config = pythEntropyService.getNetworkConfig();
      
      setNetworkConfig(config);
      
      console.log(`✅ Switched to network: ${newNetwork}`);
    } catch (err) {
      console.error('❌ Failed to switch network:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get supported networks
  const getSupportedNetworks = useCallback(() => {
    return pythEntropyService.getSupportedNetworks();
  }, []);

  // Check if network is supported
  const isNetworkSupported = useCallback((networkName) => {
    return pythEntropyService.isNetworkSupported(networkName);
  }, []);

  // Get explorer URL for transaction
  const getExplorerUrl = useCallback((txHash) => {
    return entropyExplorerService.getTransactionUrl(txHash, network);
  }, [network]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    // State
    isInitialized,
    isLoading,
    error,
    networkConfig,
    recentRequests,
    
    // Actions
    generateRandom,
    generateRandomBatch,
    getRequestStatus,
    verifyRandomValue,
    getRecentRequests,
    getNetworkStats,
    switchNetwork,
    getSupportedNetworks,
    isNetworkSupported,
    getExplorerUrl,
    clearError,
    
    // Utilities
    formatRequestId: entropyExplorerService.formatRequestId,
    formatSequenceNumber: entropyExplorerService.formatSequenceNumber,
    getStatusColor: entropyExplorerService.getStatusColor,
    getStatusIcon: entropyExplorerService.getStatusIcon
  };
};

export default usePythEntropy;
