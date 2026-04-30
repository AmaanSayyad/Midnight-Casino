import { useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

/**
 * Hook to handle wallet connection persistence
 * Automatically reconnects wallet on page refresh/navigation
 */
export const useWalletPersistence = () => {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    // Add a small delay to ensure connectors are ready
    const timer = setTimeout(() => {
      // Check if wallet was previously connected
      const wasConnected = localStorage.getItem('wagmi.connected');
      const lastConnectedConnector = localStorage.getItem('wagmi.connector');
      
      console.log('🔍 Wallet persistence check:', { 
        wasConnected, 
        lastConnectedConnector, 
        isConnected, 
        address,
        connectorsCount: connectors.length
      });

      // If wallet was connected but is not currently connected, try to reconnect
      if (wasConnected === 'true' && !isConnected && connectors.length > 0) {
        console.log('🔄 Attempting to reconnect wallet...');
        
        // Find the last used connector or default to MetaMask
        const targetConnector = connectors.find(c => 
          c.name.toLowerCase().includes('metamask') || 
          c.name.toLowerCase().includes(lastConnectedConnector?.toLowerCase() || '')
        ) || connectors[0];
        
        if (targetConnector) {
          console.log('🔗 Reconnecting with connector:', targetConnector.name);
          connect({ connector: targetConnector }).catch(error => {
            console.error('❌ Reconnection failed:', error);
          });
        }
      }
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, [isConnected, address, connect, connectors]);

  // Save connection state when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      console.log('✅ Wallet connected, saving state');
      localStorage.setItem('wagmi.connected', 'true');
      localStorage.setItem('wagmi.address', address);
      
      // Also save the connector info for better reconnection
      const currentConnector = connectors.find(c => c.name.toLowerCase().includes('metamask'));
      if (currentConnector) {
        localStorage.setItem('wagmi.connector', currentConnector.name);
      }
    }
  }, [isConnected, address, connectors]);

  // Clear connection state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      console.log('❌ Wallet disconnected, clearing state');
      localStorage.removeItem('wagmi.connected');
      localStorage.removeItem('wagmi.address');
    }
  }, [isConnected]);

  return {
    isConnected,
    address,
    disconnect: () => {
      console.log('🔌 Manual disconnect triggered');
      localStorage.removeItem('wagmi.connected');
      localStorage.removeItem('wagmi.address');
      disconnect();
    }
  };
};