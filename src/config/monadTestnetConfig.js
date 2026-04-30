// Monad Testnet Configuration
export const monadTestnetConfig = {
  id: 41454,
  name: 'Monad Testnet',
  network: 'monad-testnet',
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
      name: 'Monad Testnet Explorer',
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
    name: 'Monad',
    isNative: true,
  },
};

export default monadTestnetConfig;