/**
 * Midnight Network Configuration for Yellow Network Casino
 * Optimized for Midnight Network testnet with Yellow Network integration
 */

import { arbitrumSepolia } from 'viem/chains';

// Midnight Network Chain Configuration
export const ARBITRUM_SEPOLIA_CONFIG = {
  chainId: 421614,
  name: 'Midnight Network',
  network: 'midnight-network',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc'],
    },
    public: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arbiscan Sepolia',
      url: 'https://sepolia.arbiscan.io',
    },
  },
  testnet: true,
};

// Midnight Network Tokens
export const ARBITRUM_SEPOLIA_TOKENS = {
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
    isNative: true,
    icon: '⟠',
    faucet: 'https://faucet.arbitrum.io'
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    isStablecoin: true,
    icon: '💰',
    faucet: 'https://faucet.arbitrum.io'
  }
};

// Yellow Network Configuration for Midnight Network
export const YELLOW_ARBITRUM_CONFIG = {
  clearNodeUrl: 'wss://testnet.clearnode.yellow.org/ws',
  apiUrl: 'https://testnet.clearnode.yellow.org/api',
  defaultToken: ARBITRUM_SEPOLIA_TOKENS.ETH,
  supportedTokens: Object.values(ARBITRUM_SEPOLIA_TOKENS),
  
  // Casino specific settings
  casino: {
    minBet: '0.001', // 0.001 ETH
    maxBet: '1.0',   // 1 ETH
    defaultBet: '0.01', // 0.01 ETH
    
    // Game specific settings
    games: {
      MINES: {
        minMines: 1,
        maxMines: 24,
        defaultMines: 3,
        gridSize: 25 // 5x5 grid
      },
      ROULETTE: {
        minBet: '0.001',
        maxBet: '1.0',
        houseEdge: 0.027 // 2.7%
      },
      PLINKO: {
        minBet: '0.001',
        maxBet: '1.0',
        rows: [8, 12, 16],
        defaultRows: 12
      },
      WHEEL: {
        minBet: '0.001',
        maxBet: '1.0',
        segments: [2, 10, 20, 40, 50]
      }
    }
  },
  
  // State channel settings
  stateChannel: {
    channelTimeout: 3600, // 1 hour
    maxChannelValue: '10', // 10 ETH
    minChannelValue: '0.01', // 0.01 ETH
    settlementDelay: 300, // 5 minutes
    autoRefillThreshold: '0.1' // Auto refill when below 0.1 ETH
  }
};

// Faucet URLs
export const ARBITRUM_SEPOLIA_FAUCETS = {
  primary: 'https://faucet.arbitrum.io',
  secondary: 'https://sepoliafaucet.com',
  usdc: 'https://faucet.circle.com'
};

// Contract addresses (if any deployed)
export const ARBITRUM_SEPOLIA_CONTRACTS = {
  // Add contract addresses when deployed
  // vrfConsumer: '0x...',
  // casino: '0x...'
};

// Network switching helper
export const switchToArbitrumSepolia = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not found');
  }

  try {
    // Try to switch to Midnight Network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x66eee' }], // 421614 in hex
    });
  } catch (switchError) {
    // If network doesn't exist, add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x66eee',
          chainName: 'Midnight Network',
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
          blockExplorerUrls: ['https://sepolia.arbiscan.io'],
        }],
      });
    } else {
      throw switchError;
    }
  }
};

export default ARBITRUM_SEPOLIA_CONFIG;