"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAccount, useConnect } from 'wagmi';
import { memoryWalletStorage as walletStorage } from '@/utils/memoryWalletStorage';

/**
 * Page Navigation Persistence Hook
 * Handles wallet reconnection on page navigation
 */
export const usePageNavigationPersistence = () => {
  const pathname = usePathname();
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    console.log('🔄 Page navigation detected:', pathname);
    console.log('🔍 Current wallet state:', { isConnected, address });

    // Check if we need to reconnect after page navigation
    const checkNavigationReconnection = async () => {
      const { wasConnected, connector: savedConnector } = walletStorage.getConnectionState();
      
      console.log('🌐 Navigation wallet check:', {
        pathname,
        wasConnected,
        savedConnector,
        isConnected,
        address,
        connectorsCount: connectors.length
      });

      // If wallet was connected but is not currently connected, try to reconnect
      if (wasConnected && !isConnected && connectors.length > 0) {
        console.log('🔄 Page navigation: Attempting reconnection...');
        
        // Find the appropriate connector
        let targetConnector = null;
        
        if (savedConnector) {
          targetConnector = connectors.find(c => 
            c.id === savedConnector || 
            c.name.toLowerCase().includes(savedConnector.toLowerCase())
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
          console.log('🔗 Page navigation reconnecting with connector:', targetConnector.name);
          try {
            await connect({ connector: targetConnector });
            console.log('✅ Page navigation reconnection successful');
          } catch (error) {
            console.error('❌ Page navigation reconnection failed:', error);
          }
        } else {
          console.log('❌ No suitable connector found for page navigation reconnection');
        }
      }
    };

    // Add a small delay to ensure the page has fully loaded
    const timer = setTimeout(checkNavigationReconnection, 500);
    
    return () => clearTimeout(timer);
  }, [pathname, isConnected, address, connect, connectors]);

  return {
    isConnected,
    address
  };
};
