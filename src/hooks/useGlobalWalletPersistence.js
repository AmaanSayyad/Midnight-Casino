"use client";
import { useEffect, useRef } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { memoryWalletStorage as walletStorage } from '@/utils/memoryWalletStorage';

/**
 * Global Wallet Persistence Hook
 * Works across all pages and components
 */
export const useGlobalWalletPersistence = () => {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const reconnectAttempted = useRef(false);
  const reconnectTimeout = useRef(null);
  const lastPageCheck = useRef(0);

  useEffect(() => {
    // Clear any existing timeout
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }

    // Check if we need to reconnect
    const checkAndReconnect = () => {
      // Use safe storage utility
      const { wasConnected, address: savedAddress, connector: lastConnector } = walletStorage.getConnectionState();
      const currentTime = Date.now();
      
      console.log('🌐 Global wallet check:', {
        wasConnected,
        lastConnector,
        savedAddress,
        isConnected,
        address,
        connectorsCount: connectors.length,
        reconnectAttempted: reconnectAttempted.current,
        timeSinceLastCheck: currentTime - lastPageCheck.current,
        windowDefined: typeof window !== 'undefined',
        globalState: walletStorage.getGlobalState()
      });

      // Update last check time
      lastPageCheck.current = currentTime;

      // More aggressive reconnection for Vercel
      // Only attempt reconnection if:
      // 1. Wallet was previously connected OR we have a saved address
      // 2. Currently not connected
      // 3. Haven't attempted reconnection in the last 2 seconds (very short for Vercel)
      // 4. Connectors are available
      // 5. Window is defined (client-side)
      const lastReconnectAttempt = walletStorage.getLastReconnectAttempt();
      const timeSinceLastAttempt = currentTime - lastReconnectAttempt;
      const cooldown = process.env.NODE_ENV === 'production' ? 2000 : 5000; // 2s for Vercel, 5s for local
      const canAttemptReconnect = timeSinceLastAttempt > cooldown;
      
      // More permissive condition for Vercel
      const shouldAttemptReconnect = (wasConnected || savedAddress) && !isConnected && canAttemptReconnect && connectors.length > 0 && typeof window !== 'undefined';
      
      if (shouldAttemptReconnect) {
        console.log('🔄 Global wallet persistence: Attempting reconnection...');
        reconnectAttempted.current = true;
        walletStorage.setLastReconnectAttempt(currentTime);

        // Find the appropriate connector
        let targetConnector = null;
        
        if (lastConnector) {
          targetConnector = connectors.find(c => 
            c.id === lastConnector || 
            c.name.toLowerCase().includes(lastConnector.toLowerCase())
          );
        }
        
        // Fallback to MetaMask or injected
        if (!targetConnector) {
          targetConnector = connectors.find(c => 
            c.id === 'metaMask' || 
            c.name.toLowerCase().includes('metamask') ||
            c.id === 'injected'
          );
        }
        
        // Last resort: use first available connector
        if (!targetConnector && connectors.length > 0) {
          targetConnector = connectors[0];
        }

        if (targetConnector) {
          console.log('🔗 Reconnecting with connector:', targetConnector.name);
          connect({ connector: targetConnector })
            .then(() => {
              console.log('✅ Global wallet reconnection successful');
              // Don't reset reconnectAttempted here, let it reset naturally
            })
            .catch((error) => {
              console.error('❌ Global wallet reconnection failed:', error);
              // Reset after a delay to allow retry
              setTimeout(() => {
                reconnectAttempted.current = false;
              }, 10000); // 10 seconds delay before allowing retry
            });
        } else {
          console.log('❌ No suitable connector found for reconnection');
          reconnectAttempted.current = false;
        }
      }
    };

    // Add delay to ensure connectors are ready
    // Shorter delay for Vercel environment
    const delay = process.env.NODE_ENV === 'production' ? 1000 : 2000;
    reconnectTimeout.current = setTimeout(checkAndReconnect, delay);

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [isConnected, address, connect, connectors]);

  // Save connection state when wallet connects
  useEffect(() => {
    if (isConnected && address && typeof window !== 'undefined') {
      console.log('✅ Global wallet connected, saving state');
      
      // Find and save connector info
      const currentConnector = connectors.find(c => 
        c.id === 'metaMask' || 
        c.name.toLowerCase().includes('metamask') ||
        c.id === 'injected'
      );
      
      const connectorId = currentConnector?.id || 'unknown';
      
      // Use safe storage utility
      const success = walletStorage.saveConnectionState(address, connectorId);
      
      if (success) {
        console.log('💾 Saved connector:', connectorId);
        // Reset reconnection flag and clear last attempt time
        reconnectAttempted.current = false;
        walletStorage.clearLastReconnectAttempt();
      }
    }
  }, [isConnected, address, connectors]);

  // Clear connection state when wallet disconnects
  useEffect(() => {
    if (!isConnected && !reconnectAttempted.current && typeof window !== 'undefined') {
      console.log('❌ Global wallet disconnected, clearing state');
      walletStorage.clearConnectionState();
    }
  }, [isConnected, reconnectAttempted]);

  return {
    isConnected,
    address,
    isReconnecting: reconnectAttempted.current
  };
};
