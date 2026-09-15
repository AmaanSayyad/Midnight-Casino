'use client';

/**
 * Disabled — MetaMask/Temple auto-reconnect fought Lace Midnight.
 * Lace connection is handled only by useWalletStatus + Connect Lace button.
 */
export const useGlobalWalletPersistence = () => {
  return { isReconnecting: false };
};

export default useGlobalWalletPersistence;
