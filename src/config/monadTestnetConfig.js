// Midnight Network Configuration
export const monadTestnetConfig = {
  id: 41454,
  name: 'Midnight Network',
  network: 'midnight-network',
  nativeCurrency: {
    decimals: 18,
    name: 'MATIC',
    symbol: 'MATIC',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Midnight Network Explorer',
      url: 'https://testnet-explorer.monad.xyz',
    },
  },
  testnet: true,
};

export const monadTestnetTokens = {
  MATIC: {
    address: 'native',
    decimals: 18,
    symbol: 'MATIC',
    name: 'Midnight',
    isNative: true,
  },
};

export default monadTestnetConfig;