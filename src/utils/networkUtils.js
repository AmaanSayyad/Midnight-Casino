// Network utilities for Polygon Amoy Testnet
import { polygonAmoy } from '@/config/chains';

export const POLYGON_AMOY_CONFIG = {
  chainId: '0x13882', // 80002 in hex
  chainName: 'Polygon Amoy',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: ['https://rpc-amoy.polygon.technology'],
  blockExplorerUrls: ['https://amoy.polygonscan.com'],
};

export const switchToPolygonAmoy = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Try to switch to Polygon Amoy
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: POLYGON_AMOY_CONFIG.chainId }],
    });
  } catch (switchError) {
    // If the chain is not added, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [POLYGON_AMOY_CONFIG],
        });
      } catch (addError) {
        throw new Error('Failed to add Polygon Amoy to MetaMask');
      }
    } else {
      throw new Error('Failed to switch to Polygon Amoy');
    }
  }
};

export const isPolygonAmoy = (chainId) => {
  return chainId === 80002 || chainId === '0x13882';
};

export const formatPolBalance = (balance, decimals = 5) => {
  const numBalance = parseFloat(balance || '0');
  return `${numBalance.toFixed(decimals)} MATIC`;
};

export const getPolygonAmoyExplorerUrl = (txHash) => {
  return `https://amoy.polygonscan.com/tx/${txHash}`;
};

// Legacy functions for backward compatibility
export const isMonadTestnet = (chainId) => {
  return isPolygonAmoy(chainId);
};

export const formatMonBalance = (balance, decimals = 5) => {
  return formatPolBalance(balance, decimals);
};

export const getMonadTestnetExplorerUrl = (txHash) => {
  return getPolygonAmoyExplorerUrl(txHash);
};