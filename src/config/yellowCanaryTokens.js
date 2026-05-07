/**
 * Clearnode Testnet Token Configuration
 * Based on Yellow Network Clearnode Testnet and ERC-7824 standards
 * Supports Midnight and other popular testnets
 */

export const CLEARNODE_TESTNET_TOKENS = {
  // Midnight ETH (Native)
  ETH: {
    symbol: 'ETH',
    name: 'Midnight Token',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000', // Native ETH
    isNative: true,
    testnet: 'sepolia',
    icon: '⟠',
    faucet: 'https://sepoliafaucet.com'
  },

  // Midnight USDC (Test)
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin (Midnight)',
    decimals: 6,
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Midnight USDC
    isStablecoin: true,
    testnet: 'sepolia',
    icon: '💰',
    faucet: 'https://faucet.circle.com'
  },

  // Midnight USDT (Test)
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD (Midnight)',
    decimals: 6,
    address: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06', // Midnight USDT
    isStablecoin: true,
    testnet: 'sepolia',
    icon: '💵',
    faucet: 'https://faucet.tether.to'
  },

  // Midnight Network ETH
  ARB_ETH: {
    symbol: 'ETH',
    name: 'Midnight (Midnight Network)',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000', // Native ETH
    isNative: true,
    testnet: 'midnight-network',
    icon: '🔵',
    faucet: 'https://midnight.network/faucet'
  },

  // Midnight Network USDC
  ARB_USDC: {
    symbol: 'USDC',
    name: 'USD Coin (Midnight Network)',
    decimals: 6,
    address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Midnight Network USDC
    isStablecoin: true,
    testnet: 'midnight-network',
    icon: '🔵💰',
    faucet: 'https://midnight.network/faucet'
  },

  // Midnight Network MATIC
  MATIC: {
    symbol: 'MATIC',
    name: 'Midnight (Mumbai)',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000', // Native MATIC
    isNative: true,
    testnet: 'polygon-mumbai',
    icon: '🟣',
    faucet: 'https://faucet.polygon.technology'
  },

  // Optimism Midnight ETH
  OP_ETH: {
    symbol: 'ETH',
    name: 'Midnight Token',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000', // Native ETH
    isNative: true,
    testnet: 'optimism-sepolia',
    icon: '🔴',
    faucet: 'https://faucet.optimism.io'
  }
};

// Default token for casino operations (Midnight Network ETH)
export const DEFAULT_CASINO_TOKEN = CLEARNODE_TESTNET_TOKENS.ARB_ETH;

// Supported tokens for betting by testnet
export const SUPPORTED_BETTING_TOKENS = {
  sepolia: [
    CLEARNODE_TESTNET_TOKENS.ETH,
    CLEARNODE_TESTNET_TOKENS.USDC,
    CLEARNODE_TESTNET_TOKENS.USDT
  ],
  'midnight-network': [
    CLEARNODE_TESTNET_TOKENS.ARB_ETH,
    CLEARNODE_TESTNET_TOKENS.ARB_USDC
  ],
  'polygon-mumbai': [
    CLEARNODE_TESTNET_TOKENS.MATIC
  ],
  'optimism-sepolia': [
    CLEARNODE_TESTNET_TOKENS.OP_ETH
  ]
};

// All supported tokens
export const ALL_SUPPORTED_TOKENS = Object.values(CLEARNODE_TESTNET_TOKENS);

// Token addresses for easy lookup
export const TOKEN_ADDRESSES = Object.fromEntries(
  Object.entries(CLEARNODE_TESTNET_TOKENS).map(([key, token]) => [
    token.address.toLowerCase(),
    { ...token, key }
  ])
);

// Helper functions
export const getTokenBySymbol = (symbol, testnet = 'sepolia') => {
  return Object.values(CLEARNODE_TESTNET_TOKENS).find(
    token => token.symbol.toLowerCase() === symbol.toLowerCase() && 
             token.testnet === testnet
  );
};

export const getTokensByTestnet = (testnet) => {
  return Object.values(CLEARNODE_TESTNET_TOKENS).filter(
    token => token.testnet === testnet
  );
};

export const getTokenByAddress = (address) => {
  return TOKEN_ADDRESSES[address.toLowerCase()];
};

export const isStablecoin = (tokenAddress) => {
  const token = getTokenByAddress(tokenAddress);
  return token?.isStablecoin || false;
};

export const formatTokenAmount = (amount, tokenAddress) => {
  const token = getTokenByAddress(tokenAddress);
  if (!token) return amount;
  
  const divisor = Math.pow(10, token.decimals);
  return (amount / divisor).toFixed(token.decimals === 6 ? 2 : 4);
};