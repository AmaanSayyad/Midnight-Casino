/**
 * Wallet Persistence Utilities
 * Handles wallet connection state across page navigations
 */

export const WALLET_STORAGE_KEYS = {
  CONNECTED: 'wagmi.connected',
  CONNECTOR: 'wagmi.connector',
  ADDRESS: 'wagmi.address',
  LAST_CONNECTED: 'wagmi.lastConnected'
};

export const WalletPersistence = {
  /**
   * Save wallet connection state
   */
  saveConnectionState: (connector, address) => {
    try {
      localStorage.setItem(WALLET_STORAGE_KEYS.CONNECTED, 'true');
      localStorage.setItem(WALLET_STORAGE_KEYS.CONNECTOR, connector?.id || '');
      localStorage.setItem(WALLET_STORAGE_KEYS.ADDRESS, address || '');
      localStorage.setItem(WALLET_STORAGE_KEYS.LAST_CONNECTED, Date.now().toString());
      console.log('💾 Wallet connection state saved');
    } catch (error) {
      console.error('❌ Failed to save wallet connection state:', error);
    }
  },

  /**
   * Clear wallet connection state
   */
  clearConnectionState: () => {
    try {
      Object.values(WALLET_STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('🗑️ Wallet connection state cleared');
    } catch (error) {
      console.error('❌ Failed to clear wallet connection state:', error);
    }
  },

  /**
   * Get saved connection state
   */
  getConnectionState: () => {
    try {
      return {
        wasConnected: localStorage.getItem(WALLET_STORAGE_KEYS.CONNECTED) === 'true',
        lastConnector: localStorage.getItem(WALLET_STORAGE_KEYS.CONNECTOR),
        lastAddress: localStorage.getItem(WALLET_STORAGE_KEYS.ADDRESS),
        lastConnectedTime: localStorage.getItem(WALLET_STORAGE_KEYS.LAST_CONNECTED)
      };
    } catch (error) {
      console.error('❌ Failed to get wallet connection state:', error);
      return {
        wasConnected: false,
        lastConnector: null,
        lastAddress: null,
        lastConnectedTime: null
      };
    }
  },

  /**
   * Check if connection is recent (within last 24 hours)
   */
  isRecentConnection: () => {
    try {
      const lastConnectedTime = localStorage.getItem(WALLET_STORAGE_KEYS.LAST_CONNECTED);
      if (!lastConnectedTime) return false;
      
      const timeDiff = Date.now() - parseInt(lastConnectedTime);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      return timeDiff < twentyFourHours;
    } catch (error) {
      console.error('❌ Failed to check connection recency:', error);
      return false;
    }
  },

  /**
   * Setup page visibility listener to maintain connection
   */
  setupVisibilityListener: (reconnectCallback) => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, check if we need to reconnect
        const { wasConnected } = WalletPersistence.getConnectionState();
        if (wasConnected && WalletPersistence.isRecentConnection()) {
          console.log('👁️ Page visible, checking wallet connection...');
          reconnectCallback();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Return cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }
};