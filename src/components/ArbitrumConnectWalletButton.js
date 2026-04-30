"use client";
import React, { useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export default function ArbitrumConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Auto-reconnect on page load if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      try {
        // Check if wallet was previously connected
        const wasConnected = localStorage.getItem('wagmi.connected');
        if (wasConnected === 'true' && !isConnected && connectors.length > 0) {
          console.log('🔄 Attempting auto-reconnect...');
          
          // Try to find MetaMask connector first
          let connector = connectors.find(c => 
            c.id === 'metaMask' || 
            c.name.toLowerCase().includes('metamask')
          );
          
          // If not found, try injected connector
          if (!connector) {
            connector = connectors.find(c => c.id === 'injected');
          }
          
          if (connector) {
            await connect({ connector });
            console.log('✅ Auto-reconnect successful');
          }
        }
      } catch (error) {
        console.log('❌ Auto-reconnect failed:', error);
        // Don't clear the connection flag immediately - user might want to try again
      }
    };

    // Small delay to ensure connectors are ready
    const timer = setTimeout(autoConnect, 1500);
    return () => clearTimeout(timer);
  }, [connectors, connect, isConnected]);

  // No automatic connection monitoring - user controls connection manually

  // MetaMask event listeners for better connection stability
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      console.log('🔄 Accounts changed:', accounts);
      if (accounts.length === 0) {
        // User disconnected all accounts from MetaMask
        console.log('❌ All accounts disconnected from MetaMask');
        localStorage.removeItem('wagmi.connected');
        disconnect();
      } else {
        // Account changed, but still connected
        console.log('✅ Account changed, maintaining connection');
        localStorage.setItem('wagmi.connected', 'true');
      }
    };

    const handleChainChanged = (chainId) => {
      console.log('🔗 Chain changed:', chainId);
      // Don't disconnect on chain change, just log it
      // Keep the connection active
    };

    const handleConnect = () => {
      console.log('🔗 MetaMask connected');
      localStorage.setItem('wagmi.connected', 'true');
    };

    const handleDisconnect = (error) => {
      console.log('❌ MetaMask disconnected:', error);
      localStorage.removeItem('wagmi.connected');
    };

    // Add event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('connect', handleConnect);
    window.ethereum.on('disconnect', handleDisconnect);

    // Cleanup
    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('connect', handleConnect);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [disconnect]);

  const handleConnect = async () => {
    try {
      console.log('🔗 Attempting to connect wallet...');
      
      // Try to find MetaMask connector first
      let connector = connectors.find(c => 
        c.id === 'metaMask' || 
        c.name.toLowerCase().includes('metamask')
      );
      
      // If not found, try injected connector
      if (!connector) {
        connector = connectors.find(c => c.id === 'injected');
      }
      
      if (connector) {
        console.log('🔌 Connecting with connector:', connector.name);
        
        // Check if MetaMask is available
        if (window.ethereum) {
          try {
            // Request account access first
            const accounts = await window.ethereum.request({ 
              method: 'eth_requestAccounts' 
            });
            console.log('📋 Accounts received:', accounts);
          } catch (requestError) {
            console.error('❌ Account request failed:', requestError);
            throw new Error('Please allow access to your MetaMask accounts');
          }
        }
        
        // Connect using wagmi
        await connect({ connector });
        
        // Store connection state
        localStorage.setItem('wagmi.connected', 'true');
        localStorage.setItem('wagmi.connector', connector.id);
        
        console.log('✅ Wallet connected successfully');
      } else {
        console.error('❌ No wallet connector found');
        alert('No wallet connector found. Please make sure MetaMask is installed.');
      }
    } catch (error) {
      console.error('❌ Connection error:', error);
      
      // More user-friendly error messages
      let errorMessage = 'Connection failed';
      if (error.message.includes('User rejected')) {
        errorMessage = 'Connection cancelled by user';
      } else if (error.message.includes('No provider')) {
        errorMessage = 'MetaMask not found. Please install MetaMask extension.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`${errorMessage}`);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    // Clear connection state
    localStorage.removeItem('wagmi.connected');
  };

  return (
    <div className="relative">
      {isConnected ? (
        <div className="flex items-center gap-3">
          <span className="text-white text-sm">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all transform hover:scale-105"
        >
          Connect MetaMask
        </button>
      )}
    </div>
  );
}
