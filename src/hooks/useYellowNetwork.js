import { useState, useEffect, useCallback } from 'react';
import yellowNetworkService from '@/services/YellowNetworkService';

/**
 * Hook for Yellow Network state channel integration
 */
export const useYellowNetwork = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [channelId, setChannelId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [gameType, setGameType] = useState(null);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(null);

  /**
   * Initialize Yellow Network service
   */
  const initialize = useCallback(async () => {
    try {
      if (isInitializing) return true;
      setIsInitializing(true);
      setError(null);
      
      await yellowNetworkService.initialize();
      
      setIsInitializing(false);
      return true;
    } catch (error) {
      console.error('Failed to initialize Yellow Network:', error);
      setError(error.message);
      setIsInitializing(false);
      return false;
    }
  }, [isInitializing]);

  /**
   * Connect to Yellow Network with user credentials
   */
  const connect = useCallback(async (channelId, accessToken) => {
    try {
      setError(null);
      
      const result = await yellowNetworkService.connect(channelId, accessToken);
      
      if (result) {
        setIsConnected(true);
        if (channelId) setChannelId(channelId);
        // Defer balance fetch to avoid blocking UI
        setTimeout(async () => {
          try {
            const b = await yellowNetworkService.getChannelBalance();
            setBalance(b);
          } catch (e) {}
        }, 0);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to connect to Yellow Network:', error);
      setError(error.message);
      setIsConnected(false);
      return false;
    }
  }, []);

  /**
   * Create a game session
   */
  const createGameSession = useCallback(async (gameType, gameConfig = {}) => {
    try {
      setError(null);
      
      const session = await yellowNetworkService.createGameSession(gameType, gameConfig);
      
      setSessionId(session.id);
      setGameType(gameType);
      
      return session;
    } catch (error) {
      console.error(`Failed to create ${gameType} game session:`, error);
      setError(error.message);
      return null;
    }
  }, []);

  /**
   * Generate random number using Yellow Network state channels
   */
  const generateRandom = useCallback(async (params = {}) => {
    try {
      setError(null);
      return await yellowNetworkService.generateRandom(params);
    } catch (error) {
      console.error('Failed to generate random number:', error);
      setError(error.message);
      return null;
    }
  }, []);

  /**
   * Place a bet using Yellow Network state channels
   */
  const placeBet = useCallback(async (betParams) => {
    try {
      setError(null);
      
      const result = await yellowNetworkService.placeBet(betParams);
      
      // Update balance after placing bet
      const updatedBalance = await yellowNetworkService.getChannelBalance();
      setBalance(updatedBalance);
      
      return result;
    } catch (error) {
      console.error('Failed to place bet:', error);
      setError(error.message);
      return null;
    }
  }, []);

  /**
   * Settle a bet using Yellow Network state channels
   */
  const settleBet = useCallback(async (betId, settleParams) => {
    try {
      setError(null);
      
      const result = await yellowNetworkService.settleBet(betId, settleParams);
      
      // Update balance after settling bet
      const updatedBalance = await yellowNetworkService.getChannelBalance();
      setBalance(updatedBalance);
      
      return result;
    } catch (error) {
      console.error(`Failed to settle bet ${betId}:`, error);
      setError(error.message);
      return null;
    }
  }, []);

  /**
   * End the current game session
   */
  const endGameSession = useCallback(async () => {
    try {
      setError(null);
      
      const result = await yellowNetworkService.endGameSession();
      
      if (result) {
        setSessionId(null);
        setGameType(null);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to end game session:', error);
      setError(error.message);
      return false;
    }
  }, []);

  /**
   * Disconnect from Yellow Network
   */
  const disconnect = useCallback(async () => {
    try {
      setError(null);
      
      const result = await yellowNetworkService.disconnect();
      
      if (result) {
        setIsConnected(false);
        setChannelId(null);
        setSessionId(null);
        setGameType(null);
        setBalance(null);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to disconnect from Yellow Network:', error);
      setError(error.message);
      return false;
    }
  }, []);

  /**
   * Get channel balance
   */
  const getChannelBalance = useCallback(async () => {
    try {
      setError(null);
      
      const balance = await yellowNetworkService.getChannelBalance();
      setBalance(balance);
      
      return balance;
    } catch (error) {
      console.error('Failed to get channel balance:', error);
      setError(error.message);
      return null;
    }
  }, []);

  /**
   * Get session state
   */
  const getSessionState = useCallback(async () => {
    try {
      setError(null);
      return await yellowNetworkService.getSessionState();
    } catch (error) {
      console.error('Failed to get session state:', error);
      setError(error.message);
      return null;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        yellowNetworkService.disconnect().catch(console.error);
      }
    };
  }, [isConnected]);

  return {
    // State
    isConnected,
    isInitializing,
    channelId,
    sessionId,
    gameType,
    error,
    balance,
    
    // Methods
    initialize,
    connect,
    createGameSession,
    generateRandom,
    placeBet,
    settleBet,
    endGameSession,
    disconnect,
    getChannelBalance,
    getSessionState,
  };
};

export default useYellowNetwork;