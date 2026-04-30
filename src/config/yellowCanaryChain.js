/**
 * Yellow Canary Testnet Chain Configuration
 * For use with wagmi, viem, and Yellow Network integration
 */

import { defineChain } from 'viem';

// Yellow Canary Testnet Chain Definition
export const yellowCanary = defineChain({
  id: 5001,
  name: 'Yellow Canary Testnet',
  network: 'yellow-canary',
  nativeCurrency: {
    decimals: 18,
    name: 'Yellow Token',
    symbol: 'YELLOW',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.canary.yellow.org'],
      webSocket: ['wss://canary.yellow.org/ws'],
    },
    public: {
      http: ['https://rpc.canary.yellow.org'],
      webSocket: ['wss://canary.yellow.org/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Yellow Canary Explorer',
      url: 'https://explorer.canary.yellow.org',
    },
  },
  contracts: {
    // Add contract addresses when available
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 1,
    },
  },
  testnet: true,
});

// Network configuration for wallet connections
export const YELLOW_CANARY_NETWORK = {
  chainId: '0x1389', // 5001 in hex
  chainName: 'Yellow Canary Testnet',
  nativeCurrency: {
    name: 'Yellow Token',
    symbol: 'YELLOW',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.canary.yellow.org'],
  blockExplorerUrls: ['https://explorer.canary.yellow.org'],
};

// Faucet information
export const YELLOW_CANARY_FAUCET = {
  url: 'https://faucet.canary.yellow.org',
  dailyLimit: '100 YELLOW',
  description: 'Get testnet YELLOW tokens for development and testing',
};

// Bridge information
export const YELLOW_CANARY_BRIDGE = {
  url: 'https://bridge.canary.yellow.org',
  supportedChains: ['Ethereum Sepolia', 'Arbitrum Sepolia', 'Polygon Mumbai'],
  description: 'Bridge tokens to Yellow Canary testnet',
};

// Yellow Network Clearnode Testnet configuration
// This provides state channels for gasless gaming while using Arbitrum Sepolia for settlement
export const CLEARNODE_TESTNET_CONFIG = {
  clearNodeUrl: 'wss://clearnet-sandbox.yellow.com/ws',
  apiUrl: 'https://clearnet-sandbox.yellow.com',
  
  // Primary settlement network
  primaryNetwork: 'arbitrum-sepolia',
  primaryChainId: 421614,
  
  // State channel configuration
  channelTimeout: 3600, // 1 hour
  maxChannelValue: '10', // 10 ETH max
  minChannelValue: '0.001', // 0.001 ETH min
  settlementDelay: 300, // 5 minutes
  
  // Supported networks for Yellow Network integration
  supportedTestnets: [
    'arbitrum-sepolia', // Primary: Arbitrum Sepolia
    'sepolia', // Secondary: Ethereum Sepolia
    'polygon-mumbai', // Polygon Mumbai
    'optimism-sepolia' // Optimism Sepolia
  ]
};