// Polygon Amoy Testnet Configuration
export const polygonAmoyConfig = {
  id: 80002,
  name: 'Polygon Amoy',
  network: 'polygon-amoy',
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
      name: 'Polygon Amoy Explorer',
      url: 'https://amoy.polygonscan.com',
    },
  },
  testnet: true,
};

export const polygonAmoyTokens = {
  MATIC: {
    address: 'native',
    decimals: 18,
    symbol: 'MATIC',
    name: 'MATIC',
    isNative: true,
  },
};

export default polygonAmoyConfig;