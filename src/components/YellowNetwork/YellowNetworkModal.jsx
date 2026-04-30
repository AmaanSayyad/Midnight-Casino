// YellowNetworkModal component
// TODO: Implement Yellow Network modal functionality
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaNetworkWired, FaRocket, FaShieldAlt, FaBolt } from 'react-icons/fa';
import { GiMineExplosion } from 'react-icons/gi';
import useYellowNetwork from '@/hooks/useYellowNetwork';
// useYellowVRF removed - using Yellow Network SDK directly

const YellowNetworkModal = ({ isOpen, onClose, gameType = 'MINES' }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  
  const {
    isConnected,
    initialize,
    createGameSession
  } = useYellowNetwork();
  
  // Yellow Network SDK handles randomness natively

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Initialize Yellow Network SDK
      await initialize();
      
      // Create game session with SDK randomness
      await createGameSession(gameType, {
        network: 'arbitrum-sepolia',
        token: 'MATIC',
        randomnessSource: 'sdk'
      });
      
      setIsConnecting(false);
      onClose();
      
    } catch (error) {
      console.error('Failed to connect to Yellow Network:', error);
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-gradient-to-br from-purple-900/90 to-purple-800/80 rounded-2xl border border-purple-600/30 shadow-2xl shadow-purple-900/20 max-w-md w-full p-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-600/20 rounded-lg">
                <FaNetworkWired className="text-yellow-400 text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Yellow Network</h3>
                <p className="text-purple-300 text-sm">Gasless Gaming Experience</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <FaTimes />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 mb-6">
            <div className="text-center">
              <GiMineExplosion className="text-4xl text-purple-400 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">
                Ready to Play {gameType}?
              </h4>
              <p className="text-white/70 text-sm">
                Connect to Yellow Network for instant, gasless gaming with provably fair randomness.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                <FaBolt className="text-yellow-400" />
                <div>
                  <div className="text-white font-medium text-sm">Instant Transactions</div>
                  <div className="text-white/60 text-xs">No gas fees, no waiting</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                <FaShieldAlt className="text-green-400" />
                <div>
                  <div className="text-white font-medium text-sm">Provably Fair</div>
                  <div className="text-white/60 text-xs">Cryptographically verifiable</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                <FaRocket className="text-blue-400" />
                <div>
                  <div className="text-white font-medium text-sm">High Performance</div>
                  <div className="text-white/60 text-xs">~10,000 TPS throughput</div>
                </div>
              </div>
            </div>

            {/* Network Info */}
            <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
              <div className="text-blue-300 font-medium text-sm mb-1">Network Details</div>
              <div className="text-white/70 text-xs space-y-1">
                <div>🔵 Monad Network Testnet</div>
                <div>⟠ MATIC token</div>
                <div>🟡 Yellow Network State Channels</div>
              </div>
            </div>

            {/* SDK Status */}
            <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
              <div className="text-green-300 font-medium text-sm mb-1">Yellow SDK Ready</div>
              <div className="text-white/70 text-xs">
                Native randomness available for {gameType} via ERC-7824 SDK
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700/50 text-white/70 py-3 px-4 rounded-lg hover:bg-gray-600/50 transition-all text-sm font-medium"
            >
              Cancel
            </button>
            
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white py-3 px-4 rounded-lg hover:from-yellow-700 hover:to-yellow-600 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <FaNetworkWired />
                  Connect & Play
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default YellowNetworkModal;