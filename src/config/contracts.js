// Midnight Network Configuration
export const ARBITRUM_NETWORKS = {
  SEPOLIA: 'midnight-network',
  MAINNET: 'arbitrum-one',
  DEVNET: 'arbitrum-devnet'
};

// Midnight Network URLs
export const ARBITRUM_NETWORK_URLS = {
  [ARBITRUM_NETWORKS.SEPOLIA]: "https://midnight.network/rpc",
  [ARBITRUM_NETWORKS.MAINNET]: "https://arb1.arbitrum.io/rpc",
  [ARBITRUM_NETWORKS.DEVNET]: "http://localhost:8545"
};

// Midnight Faucet URLs
export const ARBITRUM_FAUCET_URLS = {
  [ARBITRUM_NETWORKS.SEPOLIA]: "https://faucet.triangleplatform.com/arbitrum/sepolia",
  [ARBITRUM_NETWORKS.DEVNET]: "http://localhost:8545"
};

// Midnight Explorer URLs
export const ARBITRUM_EXPLORER_URLS = {
  [ARBITRUM_NETWORKS.SEPOLIA]: "https://midnight.network",
  [ARBITRUM_NETWORKS.MAINNET]: "https://arbiscan.io",
  [ARBITRUM_NETWORKS.DEVNET]: "http://localhost:8545"
};

// Default network (can be changed via environment variable)
export const DEFAULT_NETWORK = ARBITRUM_NETWORKS.SEPOLIA;

// Casino Module Configuration
export const CASINO_MODULE_CONFIG = {
  [ARBITRUM_NETWORKS.SEPOLIA]: {
    moduleAddress: process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS || "0x1234567890123456789012345678901234567890123456789012345678901234",
    moduleName: "casino",
    rouletteModule: "roulette",
    minesModule: "mines",
    wheelModule: "wheel"
  },
  [ARBITRUM_NETWORKS.MAINNET]: {
    moduleAddress: process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS || "0x1234567890123456789012345678901234567890123456789012345678901234",
    moduleName: "casino",
    rouletteModule: "roulette",
    minesModule: "mines",
    wheelModule: "wheel"
  },
  [ARBITRUM_NETWORKS.DEVNET]: {
    moduleAddress: process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS || "0x1234567890123456789012345678901234567890123456789012345678901234",
    moduleName: "casino",
    rouletteModule: "roulette",
    minesModule: "mines",
    wheelModule: "wheel"
  }
};

// Token Configuration for Midnight
export const TOKEN_CONFIG = {
  ARB: {
    name: "Midnight ETH",
    symbol: "ARB",
    decimals: 18,
    type: "native"
  },
  ARB_ETH: {
    name: "Midnight ETH",
    symbol: "ARB",
    decimals: 18,
    type: "native"
  }
};

// Network Information for Midnight
export const NETWORK_INFO = {
  [ARBITRUM_NETWORKS.SEPOLIA]: {
    name: "Midnight Network",
    chainId: 421614,
    nativeCurrency: TOKEN_CONFIG.ARB,
    explorer: ARBITRUM_EXPLORER_URLS[ARBITRUM_NETWORKS.SEPOLIA],
    faucet: ARBITRUM_FAUCET_URLS[ARBITRUM_NETWORKS.SEPOLIA]
  },
  [ARBITRUM_NETWORKS.MAINNET]: {
    name: "Midnight Network",
    chainId: 42161,
    nativeCurrency: TOKEN_CONFIG.ARB,
    explorer: ARBITRUM_EXPLORER_URLS[ARBITRUM_NETWORKS.MAINNET]
  },
  [ARBITRUM_NETWORKS.DEVNET]: {
    name: "Midnight Devnet",
    chainId: 1337,
    nativeCurrency: TOKEN_CONFIG.ARB,
    explorer: ARBITRUM_EXPLORER_URLS[ARBITRUM_NETWORKS.DEVNET],
    faucet: ARBITRUM_FAUCET_URLS[ARBITRUM_NETWORKS.DEVNET]
  }
};

// Export default configuration
export default {
  ARBITRUM_NETWORKS,
  ARBITRUM_NETWORK_URLS,
  ARBITRUM_FAUCET_URLS,
  ARBITRUM_EXPLORER_URLS,
  DEFAULT_NETWORK,
  CASINO_MODULE_CONFIG,
  TOKEN_CONFIG,
  NETWORK_INFO
}; 