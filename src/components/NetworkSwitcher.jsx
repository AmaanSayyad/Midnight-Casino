"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { switchToPolygonAmoy, isPolygonAmoy, POLYGON_AMOY_CONFIG } from '@/utils/networkUtils';

const NetworkSwitcher = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    if (isConnected && chainId) {
      setIsWrongNetwork(!isPolygonAmoy(chainId));
    }
  }, [isConnected, chainId]);

  const handleSwitchNetwork = async () => {
    if (!isConnected) return;

    setIsSwitching(true);
    try {
      // First try using wagmi's switchChain
      if (switchChain) {
        try {
          await switchChain({ chainId: 80002 });
        } catch (wagmiError) {
          console.log('Wagmi switch failed, trying manual method:', wagmiError);
          // If wagmi fails, try manual MetaMask method
          await switchToPolygonAmoy();
        }
      } else {
        // Fallback to manual method
        await switchToPolygonAmoy();
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      alert('Failed to switch to Polygon Amoy. Please add it manually in MetaMask.');
    } finally {
      setIsSwitching(false);
    }
  };

  if (!isConnected || !isWrongNetwork) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-red-600/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg border border-red-500/50 shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <p className="font-medium">Wrong Network</p>
            <p className="text-sm text-red-200">Please switch to Polygon Amoy to use this app</p>
          </div>
          <button
            onClick={handleSwitchNetwork}
            disabled={isSwitching}
            className="bg-white/20 hover:bg-white/30 disabled:opacity-50 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {isSwitching ? 'Switching...' : 'Switch Network'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NetworkSwitcher;