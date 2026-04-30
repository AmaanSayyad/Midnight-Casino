"use client";

import React from 'react';
import { useSmartAccount } from '@/hooks/useSmartAccount';

const SmartAccountModal = ({ isOpen, onClose }) => {
  const { 
    isSmartAccount, 
    smartAccountInfo, 
    capabilities, 
    hasSmartAccountSupport,
    supportedFeatures,
    enableSmartAccountFeatures,
    isLoading 
  } = useSmartAccount();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Account Information</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Account Type */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center space-x-3 mb-3">
                {isSmartAccount ? (
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="M21 15.5c-1.5-1.5-4-1.5-5.5 0"/>
                    </svg>
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-semibold text-white">
                    {isSmartAccount ? 'Smart Account' : 'EOA Account'}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {smartAccountInfo?.address?.slice(0, 10)}...{smartAccountInfo?.address?.slice(-8)}
                  </p>
                </div>
              </div>

              {isSmartAccount ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-blue-300 text-sm">Advanced account features available</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Contract size: {smartAccountInfo?.codeSize || 0} bytes
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-300 text-sm">Standard Ethereum account</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Externally Owned Account (EOA)
                  </div>
                </div>
              )}
            </div>

            {/* Features */}
            {isSmartAccount && supportedFeatures && (
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h5 className="text-sm font-semibold text-white mb-3">Available Features</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`flex items-center space-x-2 ${supportedFeatures.batchTransactions ? 'text-green-400' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${supportedFeatures.batchTransactions ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                    <span className="text-xs">Batch Transactions</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${supportedFeatures.sponsoredTransactions ? 'text-green-400' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${supportedFeatures.sponsoredTransactions ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                    <span className="text-xs">Sponsored Transactions</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${supportedFeatures.sessionKeys ? 'text-green-400' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${supportedFeatures.sessionKeys ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                    <span className="text-xs">Session Keys</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${supportedFeatures.socialRecovery ? 'text-green-400' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${supportedFeatures.socialRecovery ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                    <span className="text-xs">Social Recovery</span>
                  </div>
                </div>
              </div>
            )}

            {/* Casino Benefits */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-purple-700/50">
              <h5 className="text-sm font-semibold text-white mb-2">Casino Benefits</h5>
              <div className="space-y-1 text-xs text-gray-300">
                {isSmartAccount ? (
                  <>
                    <div>• Batch multiple bets in one transaction</div>
                    <div>• Lower gas costs for frequent players</div>
                    <div>• Advanced betting strategies</div>
                    <div>• Enhanced security features</div>
                  </>
                ) : (
                  <>
                    <div>• Simple and secure</div>
                    <div>• Compatible with all games</div>
                    <div>• Standard Ethereum features</div>
                    <div>• Easy to use and understand</div>
                  </>
                )}
              </div>
            </div>

            {/* MetaMask Support */}
            <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-700/50">
              <div className="flex items-center space-x-2 mb-1">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-blue-400">
                  {isSmartAccount ? 'EIP-4337 Smart Account' : 'Standard EOA Account'}
                </span>
              </div>
              <p className="text-xs text-blue-300">
                {isSmartAccount 
                  ? 'This is a smart contract account with potential for advanced features.'
                  : 'This is a standard Ethereum account. Smart Account features are not available.'
                }
              </p>
              {smartAccountInfo?.note && (
                <p className="text-xs text-gray-400 mt-1 italic">
                  {smartAccountInfo.note}
                </p>
              )}
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartAccountModal;