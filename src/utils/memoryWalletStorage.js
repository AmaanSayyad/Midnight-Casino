/**
 * Memory-based Wallet Storage
 * For environments where localStorage/sessionStorage don't work (Vercel Edge)
 */

// In-memory storage as fallback
let memoryStorage = {};

// Global wallet state that persists across page navigations
let globalWalletState = {
  isConnected: false,
  address: null,
  connector: null,
  lastReconnectAttempt: 0
};

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Safe storage access with memory fallback
const safeStorage = {
  getItem: (key) => {
    if (!isBrowser) return null;
    
    try {
      // Try localStorage first
      const localValue = localStorage.getItem(key);
      if (localValue !== null) {
        console.log(`📦 Retrieved ${key} from localStorage:`, localValue);
        return localValue;
      }
    } catch (e) {
      console.warn(`localStorage failed for ${key}:`, e);
    }
    
    try {
      // Try sessionStorage
      const sessionValue = sessionStorage.getItem(key);
      if (sessionValue !== null) {
        console.log(`📦 Retrieved ${key} from sessionStorage:`, sessionValue);
        return sessionValue;
      }
    } catch (e) {
      console.warn(`sessionStorage failed for ${key}:`, e);
    }
    
    // Fallback to memory storage
    const memoryValue = memoryStorage[key];
    if (memoryValue !== undefined) {
      console.log(`📦 Retrieved ${key} from memory:`, memoryValue);
      return memoryValue;
    }
    
    // Fallback to global state
    switch (key) {
      case 'wagmi.connected':
        return globalWalletState.isConnected ? 'true' : null;
      case 'wagmi.address':
        return globalWalletState.address;
      case 'wagmi.connector':
        return globalWalletState.connector;
      case 'lastReconnectAttempt':
        return globalWalletState.lastReconnectAttempt.toString();
      default:
        return null;
    }
  },
  
  setItem: (key, value) => {
    if (!isBrowser) return false;
    
    let success = false;
    
    try {
      // Try localStorage
      localStorage.setItem(key, value);
      console.log(`💾 Saved ${key} to localStorage:`, value);
      success = true;
    } catch (e) {
      console.warn(`localStorage failed for ${key}:`, e);
    }
    
    try {
      // Try sessionStorage
      sessionStorage.setItem(key, value);
      console.log(`💾 Saved ${key} to sessionStorage:`, value);
      success = true;
    } catch (e) {
      console.warn(`sessionStorage failed for ${key}:`, e);
    }
    
    // Always save to memory as backup
    memoryStorage[key] = value;
    console.log(`💾 Saved ${key} to memory:`, value);
    
    // Update global state
    switch (key) {
      case 'wagmi.connected':
        globalWalletState.isConnected = value === 'true';
        break;
      case 'wagmi.address':
        globalWalletState.address = value;
        break;
      case 'wagmi.connector':
        globalWalletState.connector = value;
        break;
      case 'lastReconnectAttempt':
        globalWalletState.lastReconnectAttempt = parseInt(value) || 0;
        break;
    }
    
    return true; // Always return true since memory storage always works
  },
  
  removeItem: (key) => {
    if (!isBrowser) return false;
    
    try {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed ${key} from localStorage`);
    } catch (e) {
      console.warn(`localStorage remove failed for ${key}:`, e);
    }
    
    try {
      sessionStorage.removeItem(key);
      console.log(`🗑️ Removed ${key} from sessionStorage`);
    } catch (e) {
      console.warn(`sessionStorage remove failed for ${key}:`, e);
    }
    
    // Remove from memory
    delete memoryStorage[key];
    console.log(`🗑️ Removed ${key} from memory`);
    
    // Reset global state
    switch (key) {
      case 'wagmi.connected':
        globalWalletState.isConnected = false;
        break;
      case 'wagmi.address':
        globalWalletState.address = null;
        break;
      case 'wagmi.connector':
        globalWalletState.connector = null;
        break;
      case 'lastReconnectAttempt':
        globalWalletState.lastReconnectAttempt = 0;
        break;
    }
    
    return true;
  }
};

// Storage keys
const STORAGE_KEYS = {
  CONNECTED: 'wagmi.connected',
  ADDRESS: 'wagmi.address',
  CONNECTOR: 'wagmi.connector',
  LAST_RECONNECT: 'lastReconnectAttempt'
};

export const memoryWalletStorage = {
  // Get wallet connection state
  getConnectionState: () => {
    const wasConnected = safeStorage.getItem(STORAGE_KEYS.CONNECTED);
    const address = safeStorage.getItem(STORAGE_KEYS.ADDRESS);
    const connector = safeStorage.getItem(STORAGE_KEYS.CONNECTOR);
    
    return {
      wasConnected: wasConnected === 'true',
      address,
      connector
    };
  },
  
  // Save wallet connection state
  saveConnectionState: (address, connector) => {
    const success = safeStorage.setItem(STORAGE_KEYS.CONNECTED, 'true') &&
                   safeStorage.setItem(STORAGE_KEYS.ADDRESS, address) &&
                   safeStorage.setItem(STORAGE_KEYS.CONNECTOR, connector);
    
    if (success) {
      console.log('💾 Wallet state saved successfully (memory fallback)');
    } else {
      console.warn('⚠️ Failed to save wallet state');
    }
    
    return success;
  },
  
  // Clear wallet connection state
  clearConnectionState: () => {
    const success = safeStorage.removeItem(STORAGE_KEYS.CONNECTED) &&
                   safeStorage.removeItem(STORAGE_KEYS.ADDRESS) &&
                   safeStorage.removeItem(STORAGE_KEYS.CONNECTOR) &&
                   safeStorage.removeItem(STORAGE_KEYS.LAST_RECONNECT);
    
    if (success) {
      console.log('🗑️ Wallet state cleared successfully (memory fallback)');
    } else {
      console.warn('⚠️ Failed to clear wallet state');
    }
    
    return success;
  },
  
  // Get last reconnect attempt time
  getLastReconnectAttempt: () => {
    const lastAttempt = safeStorage.getItem(STORAGE_KEYS.LAST_RECONNECT);
    return lastAttempt ? parseInt(lastAttempt) : 0;
  },
  
  // Set last reconnect attempt time
  setLastReconnectAttempt: (timestamp) => {
    return safeStorage.setItem(STORAGE_KEYS.LAST_RECONNECT, timestamp.toString());
  },
  
  // Clear last reconnect attempt time
  clearLastReconnectAttempt: () => {
    return safeStorage.removeItem(STORAGE_KEYS.LAST_RECONNECT);
  },
  
  // Get global state (for debugging)
  getGlobalState: () => {
    return { ...globalWalletState };
  }
};

export default memoryWalletStorage;

