"use client";
import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { MetaMaskConnector } from '@wagmi/connectors/metaMask';

export default function EthereumConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = async () => {
    const metaMaskConnector = connectors.find(connector => connector.id === 'metaMask');
    if (metaMaskConnector) {
      await connect({ connector: metaMaskConnector });
    }
  };

  const handleDisconnect = () => {
    disconnect();
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