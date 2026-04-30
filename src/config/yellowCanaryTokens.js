/**
 * Clearnode Testnet Token Configuration
 * Based on Yellow Network Clearnode Testnet and ERC-7824 standards
 * Supports Sepolia and other popular testnets
 */

export const CLEARNODE_TESTNET_TOKENS = {
  // Sepolia ETH (Native)
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum (Sepolia)',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000', // Native ETH
    isNative: true,
    testnet: 'sepolia',
    icon: '⟠',
    faucet: 'https://sepoliafaucet.com'
  },

  // Sepolia USDC (Test)
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin (Sepolia)',
    decimals: 6,
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia USDC
    isStablecoin: true,
    testnet: 'sepolia',
    icon: '💰',
    faucet: 'https://faucet.circle.com'
  },

  // Sepolia USDT (Test)
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD (Sepolia)',
    decimals: 6,
    address: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06', // Sepolia USDT
    isStablecoin: true,
    testnet: 'sepolia',
    icon: '💵',
    faucet: 'https://faucet.tether.to'
  },

  // Arbitrum Sepolia ETH
  ARB_ETH: {
    symbol: 'ETH',
    name: 'Ethereum (Arbitrum Sepolia)',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000', // Native ETH
    isNative: true,
    testnet: 'arbitrum-sepolia',
    icon: '🔵',
    faucet: 'https://faucet.arbitrum.io'
  },

  // Arbitrum Sepolia USDC
  ARB_USDC: {
    symbol: 'USDC',
    name: 'USD Coin (Arbitrum Sepolia)',
    decimals: 6,
    address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Arbitrum Sepolia USDC
    isStablecoin: true,
    testnet: 'arbitrum-sepolia',
    icon: '🔵💰',
    faucet: 'https://faucet.arbitrum.io'
  },

  // Polygon Mumbai MATIC
  MATIC: {
    symbol: 'MATIC',
    name: 'Polygon (Mumbai)',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000', // Native MATIC
    isNative: true,
    testnet: 'polygon-mumbai',
    icon: '🟣',
    faucet: 'https://faucet.polygon.technology'
  },

  // Optimism Sepolia ETH
  OP_ETH: {
    symbol: 'ETH',
    name: 'Ethereum (Optimism Sepolia)',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000', // Native ETH
    isNative: true,
    testnet: 'optimism-sepolia',
    icon: '🔴',
    faucet: 'https://faucet.optimism.io'
  }
};

// Default token for casino operations (Arbitrum Sepolia ETH)
export const DEFAULT_CASINO_TOKEN = CLEARNODE_TESTNET_TOKENS.ARB_ETH;

// Supported tokens for betting by testnet
export const SUPPORTED_BETTING_TOKENS = {
  sepolia: [
    CLEARNODE_TESTNET_TOKENS.ETH,
    CLEARNODE_TESTNET_TOKENS.USDC,
    CLEARNODE_TESTNET_TOKENS.USDT
  ],
  'arbitrum-sepolia': [
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