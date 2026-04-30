"use client";
import { useEffect, useRef } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Vercel-specific Wallet Persistence Hook
 * Handles wallet persistence in Vercel's edge runtime environment
 */
export const useVercelWalletPersistence = () => {
  const { isConnected, address } = useAccount();
  const connectHook = useConnect();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reconnectAttempted = useRef(false);
  const reconnectTimeout = useRef(null);
  const lastPageCheck = useRef(0);

  // Safely extract connect and connectors
  const connect = connectHook?.connect;
  const connectors = connectHook?.connectors || [];

  // Global state for Vercel
  const globalState = useRef({
    isConnected: false,
    address: null,
    connector: null,
    lastReconnectAttempt: 0
  });

  // Update global state when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      globalState.current = {
        isConnected: true,
        address,
        connector: 'metaMask', // Default to MetaMask
        lastReconnectAttempt: 0
      };
      console.log('✅ Vercel wallet connected, updating global state:', globalState.current);
    }
  }, [isConnected, address]);

  // Check for wallet reconnection
  useEffect(() => {
    // Clear any existing timeout
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }

    const checkAndReconnect = () => {
      const currentTime = Date.now();
      
      console.log('🌐 Vercel wallet check:', {
        isConnected,
        address,
        globalState: globalState.current,
        connectorsCount: connectors.length,
        reconnectAttempted: reconnectAttempted.current,
        timeSinceLastCheck: currentTime - lastPageCheck.current,
        windowDefined: typeof window !== 'undefined'
      });

      // Update last check time
      lastPageCheck.current = currentTime;

      // More aggressive reconnection for Vercel
      // Always try to reconnect if wallet is not connected and connectors are available
      const shouldReconnect = 
        !isConnected && 
        connectors.length > 0 && 
        typeof window !== 'undefined' &&
        !reconnectAttempted.current &&
        connect &&
        typeof connect === 'function';

      if (shouldReconnect) {
        console.log('🔄 Vercel wallet persistence: Attempting reconnection...');
        reconnectAttempted.current = true;

        // Find MetaMask connector
        const metaMaskConnector = connectors.find(c => 
          c.id === 'metaMask' || 
          c.name.toLowerCase().includes('metamask') ||
          c.id === 'injected'
        );

        if (metaMaskConnector && connect) {
          console.log('🔗 Reconnecting with connector:', metaMaskConnector.name);
          try {
            const connectResult = connect({ connector: metaMaskConnector });
            if (connectResult && typeof connectResult.then === 'function') {
              connectResult
                .then(() => {
                  console.log('✅ Vercel wallet reconnection successful');
                  reconnectAttempted.current = false;
                })
                .catch((error) => {
                  console.error('❌ Vercel wallet reconnection failed:', error);
                  // Reset after a delay to allow retry
                  setTimeout(() => {
                    reconnectAttempted.current = false;
                  }, 5000);
                });
            } else {
              console.log('⚠️ Connect function did not return a promise');
              reconnectAttempted.current = false;
            }
          } catch (error) {
            console.error('❌ Vercel wallet reconnection error:', error);
            reconnectAttempted.current = false;
          }
        } else {
          console.log('❌ No suitable connector found for Vercel reconnection or connect function unavailable');
          reconnectAttempted.current = false;
        }
      }
    };

    // Very short delay for Vercel - try to reconnect immediately
    const delay = 500;
    reconnectTimeout.current = setTimeout(checkAndReconnect, delay);

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [isConnected, address, connect, connectors]);

  // Handle page navigation
  useEffect(() => {
    const handlePageNavigation = () => {
      console.log('🔄 Page navigation detected in Vercel');
      
      // Reset reconnection flag on page navigation
      reconnectAttempted.current = false;
      
      // If we have a global state but wallet is not connected, try to reconnect
      if (globalState.current.isConnected && !isConnected && connectors.length > 0 && connect && typeof connect === 'function') {
        console.log('🔄 Page navigation: Attempting reconnection...');
        
        const metaMaskConnector = connectors.find(c => 
          c.id === 'metaMask' || 
          c.name.toLowerCase().includes('metamask') ||
          c.id === 'injected'
        );

        if (metaMaskConnector) {
          try {
            const connectResult = connect({ connector: metaMaskConnector });
            if (connectResult && typeof connectResult.then === 'function') {
              connectResult
                .then(() => {
                  console.log('✅ Page navigation reconnection successful');
                })
                .catch((error) => {
                  console.error('❌ Page navigation reconnection failed:', error);
                });
            } else {
              console.log('⚠️ Page navigation: Connect function did not return a promise');
            }
          } catch (error) {
            console.error('❌ Page navigation reconnection error:', error);
          }
        }
      }
    };

    // Run on every page load
    handlePageNavigation();
  }, [isConnected, connect, connectors]);

  return {
    isConnected,
    address,
    isReconnecting: reconnectAttempted.current,
    globalState: globalState.current
  };
};
