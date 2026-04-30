"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';

const SmartAccountInfo = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [smartAccountInfo, setSmartAccountInfo] = useState(null);
  const [isSmartAccount, setIsSmartAccount] = useState(false);

  useEffect(() => {
    const checkSmartAccount = async () => {
      if (!isConnected || !address || !walletClient) return;

      try {
        // Check if the connected account is a smart account
        let code = '0x';
        try {
          if (walletClient.getBytecode) {
            code = await walletClient.getBytecode({ address });
          } else if (walletClient.getCode) {
            code = await walletClient.getCode({ address });
          } else if (window.ethereum) {
            code = await window.ethereum.request({
              method: 'eth_getCode',
              params: [address, 'latest']
            });
          }
        } catch (codeError) {
          console.warn('Could not get bytecode:', codeError);
          code = '0x';
        }
        
        const hasCode = code && code !== '0x' && code.length > 2;
        setIsSmartAccount(hasCode);

        if (hasCode) {
          setSmartAccountInfo({
            address,
            type: 'Smart Account',
            hasCode: true,
            codeLength: code?.length || 0
          });
        } else {
          setSmartAccountInfo({
            address,
            type: 'Externally Owned Account (EOA)',
            hasCode: false
          });
        }
      } catch (error) {
        console.error('Error checking smart account:', error);
      }
    };

    checkSmartAccount();
  }, [isConnected, address, walletClient]);

  if (!isConnected || !smartAccountInfo) return null;

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-2">Account Information</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Address:</span>
          <span className="text-white font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Type:</span>
          <span className={`font-medium ${isSmartAccount ? 'text-blue-400' : 'text-green-400'}`}>
            {smartAccountInfo.type}
          </span>
        </div>
        {isSmartAccount && (
          <div className="mt-2 p-2 bg-blue-900/30 rounded border border-blue-700">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-blue-300 text-xs">Smart Account Features Active</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartAccountInfo;