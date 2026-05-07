/**
 * Midnight Network Configuration for Yellow Network Casino
 * Optimized for Midnight Network testnet with Yellow Network integration
 */

// Midnight Network Chain Configuration
export const MIDNIGHT_NETWORK_CONFIG = {
  chainId: 421614,
  name: 'Midnight Network',
  network: 'midnight-network',
  nativeCurrency: {
    decimals: 18,
    name: 'Midnight',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://midnight.network/rpc'],
    },
    public: {
      http: ['https://midnight.network/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Midnight Explorer',
      url: 'https://midnight.network',
    },
  },
  testnet: true,
};

// Midnight Network Tokens
export const MIDNIGHT_NETWORK_TOKENS = {
  ETH: {
    symbol: 'ETH',
    name: 'Midnight',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
    isNative: true,
    icon: '⟠',
    faucet: 'https://midnight.network/faucet'
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    isStablecoin: true,
    icon: '💰',
    faucet: 'https://midnight.network/faucet'
  }
};

// Yellow Network Configuration for Midnight Network
export const YELLOW_MIDNIGHT_CONFIG = {
  clearNodeUrl: 'wss://testnet.clearnode.yellow.org/ws',
  apiUrl: 'https://testnet.clearnode.yellow.org/api',
  defaultToken: MIDNIGHT_NETWORK_TOKENS.ETH,
  supportedTokens: Object.values(MIDNIGHT_NETWORK_TOKENS),
  
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
export const MIDNIGHT_NETWORK_FAUCETS = {
  primary: 'https://midnight.network/faucet',
  secondary: 'https://sepoliafaucet.com',
  usdc: 'https://faucet.circle.com'
};

// Contract addresses (if any deployed)
export const MIDNIGHT_NETWORK_CONTRACTS = {
  // Add contract addresses when deployed
  // vrfConsumer: '0x...',
  // casino: '0x...'
};

// Network switching helper
export const switchToMidnightNetwork = async () => {
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
            name: 'Midnight',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['https://midnight.network/rpc'],
          blockExplorerUrls: ['https://midnight.network'],
        }],
      });
    } else {
      throw switchError;
    }
  }
};

export default MIDNIGHT_NETWORK_CONFIG;