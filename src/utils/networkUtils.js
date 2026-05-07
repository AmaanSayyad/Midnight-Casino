// Network utilities for Midnight Network
import { midnightNetwork } from '@/config/chains';

export const MIDNIGHT_NETWORK_CONFIG = {
  chainId: `0x${midnightNetwork.id.toString(16)}`,
  chainName: midnightNetwork.name,
  nativeCurrency: {
    name: 'Midnight',
    symbol: 'MIDN',
    decimals: 18,
  },
  rpcUrls: midnightNetwork.rpcUrls.default.http,
  blockExplorerUrls: [midnightNetwork.blockExplorers.default.url],
};

export const switchToMidnightNetwork = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Try to switch to Midnight Network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MIDNIGHT_NETWORK_CONFIG.chainId }],
    });
  } catch (switchError) {
    // If the chain is not added, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [MIDNIGHT_NETWORK_CONFIG],
        });
      } catch (addError) {
        throw new Error('Failed to add Midnight Network to MetaMask');
      }
    } else {
      throw new Error('Failed to switch to Midnight Network');
    }
  }
};

export const isMidnightNetwork = (chainId) => {
  const hexId = `0x${midnightNetwork.id.toString(16)}`;
  return chainId === midnightNetwork.id || chainId === hexId;
};

export const formatMidnightBalance = (balance, decimals = 5) => {
  const numBalance = parseFloat(balance || '0');
  return `${numBalance.toFixed(decimals)} MIDN`;
};

export const getMidnightExplorerUrl = (txHash) => {
  return `${midnightNetwork.blockExplorers.default.url}/tx/${txHash}`;
};

// Backward-compatible aliases using Midnight naming.
export const MIDNIGHT_CONFIG = MIDNIGHT_NETWORK_CONFIG;
export const switchNetwork = switchToMidnightNetwork;
export const isSupportedNetwork = isMidnightNetwork;
export const formatNetworkBalance = formatMidnightBalance;
export const getExplorerUrl = getMidnightExplorerUrl;