// Midnight Network Testnet Configuration
export const midnightNetworkConfig = {
  id: 80002,
  name: 'Midnight Network',
  network: 'midnight-network',
  nativeCurrency: {
    decimals: 18,
    name: 'MATIC',
    symbol: 'MATIC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-amoy.polygon.technology'],
    },
    public: {
      http: ['https://rpc-amoy.polygon.technology'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Midnight Network Explorer',
      url: 'https://midnight.network',
    },
  },
  testnet: true,
};

export const midnightNetworkTokens = {
  MATIC: {
    address: 'native',
    decimals: 18,
    symbol: 'MATIC',
    name: 'MATIC',
    isNative: true,
  },
};

export default midnightNetworkConfig;