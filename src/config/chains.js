/**
 * Custom Chain Definitions
 * Defines custom chains not included in wagmi/chains
 */

import { defineChain } from 'viem';

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_MIDNIGHT_CHAIN_ID || 80002);
const RPC_URL = process.env.NEXT_PUBLIC_MIDNIGHT_RPC || process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology';
const EXPLORER_URL = process.env.NEXT_PUBLIC_MIDNIGHT_EXPLORER || process.env.NEXT_PUBLIC_POLYGON_AMOY_EXPLORER || 'https://midnight.network';

// Primary Midnight network definition used app-wide.
export const midnightNetwork = defineChain({
  id: CHAIN_ID,
  name: 'Midnight Network',
  nativeCurrency: {
    decimals: 18,
    name: 'Midnight',
    symbol: 'tNIGHT',
  },
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
    public: {
      http: [RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'Midnight Network Explorer',
      url: EXPLORER_URL,
    },
  },
  testnet: true,
});

export default {
  midnightNetwork,
};