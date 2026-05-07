// Casino Treasury Configuration
// This file contains the treasury wallet address and related configuration

// Test Treasury Address (Replace with your actual treasury address in production)
export const TREASURY_CONFIG = {
  // Midnight Network Treasury Wallet (for deposits/withdrawals)
  ADDRESS: process.env.MIDNIGHT_TREASURY_ADDRESS || process.env.POLYGON_TREASURY_ADDRESS || process.env.TREASURY_ADDRESS || '0x025182b20Da64b5997d09a5a62489741F68d9B96',
  
  // ⚠️  DEVELOPMENT ONLY - Never use in production!
  PRIVATE_KEY: process.env.MIDNIGHT_TREASURY_PRIVATE_KEY || process.env.POLYGON_TREASURY_PRIVATE_KEY || process.env.TREASURY_PRIVATE_KEY || '0x73e0cfb4d786d6e542533e18eb78fb5c727ab802b89c6850962042a8f0835f0c',
  
  // Network configuration for Midnight Network (for deposit/withdraw)
  NETWORK: {
    CHAIN_ID: process.env.NEXT_PUBLIC_MIDNIGHT_CHAIN_ID_HEX || '0x13882',
    CHAIN_NAME: 'Midnight Network',
    RPC_URL: process.env.NEXT_PUBLIC_MIDNIGHT_RPC || process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology',
    EXPLORER_URL: process.env.NEXT_PUBLIC_MIDNIGHT_EXPLORER || process.env.NEXT_PUBLIC_POLYGON_AMOY_EXPLORER || 'https://midnight.network'
  },
  
  // Gas settings for transactions
  GAS: {
    DEPOSIT_LIMIT: process.env.GAS_LIMIT_DEPOSIT ? '0x' + parseInt(process.env.GAS_LIMIT_DEPOSIT).toString(16) : '0x7530', // 30000 gas for Midnight transfers
    WITHDRAW_LIMIT: process.env.GAS_LIMIT_WITHDRAW ? '0x' + parseInt(process.env.GAS_LIMIT_WITHDRAW).toString(16) : '0x186A0', // 100000 gas for more complex operations
  },
  
  // Minimum and maximum deposit amounts (in MIDN)
  LIMITS: {
    MIN_DEPOSIT: parseFloat(process.env.MIN_DEPOSIT) || 0.001, // 0.001 MIDN minimum
    MAX_DEPOSIT: parseFloat(process.env.MAX_DEPOSIT) || 100, // 100 MIDN maximum
  }
};

// Helper function to validate treasury address
export const isValidTreasuryAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Helper function to get treasury info
export const getTreasuryInfo = () => {
  return {
    address: TREASURY_CONFIG.ADDRESS,
    network: TREASURY_CONFIG.NETWORK.CHAIN_NAME,
    chainId: TREASURY_CONFIG.NETWORK.CHAIN_ID
  };
};
