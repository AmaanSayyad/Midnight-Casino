'use client';

/**
 * Primary wallet status for Midnight Casino.
 * Midnight wallet via window.midnight (1AM preferred) — balances are real unshielded tNIGHT.
 * Apache-2.0
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  connectLace,
  findMidnightWallet,
  listMidnightWallets,
  getLaceBalances,
  transferUnshieldedNight,
  transferUnshieldedNightBatch,
} from '@/lib/midnight/lace';

const WalletStatusContext = createContext(null);

const NETWORK =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK) ||
  'preview';

const STORAGE_KEY = 'midnight-lace-session';

function loadCachedSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCachedSession(session) {
  if (typeof window === 'undefined') return;
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      unshieldedAddress: session.unshieldedAddress,
      shieldedAddress: session.shieldedAddress,
      networkId: session.networkId,
      walletName: session.walletName,
      proofServerUri: session.proofServerUri,
      indexerUri: session.indexerUri,
    }),
  );
}

export function WalletStatusProvider({ children }) {
  const isDev =
    typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_DEV_WALLET === 'true';

  const [lace, setLace] = useState({
    isConnected: false,
    address: null,
    shieldedAddress: null,
    networkId: NETWORK,
    walletName: null,
    proofServerUri: null,
    api: null,
    detecting: true,
    extensionPresent: false,
    tnight: '0',
    dust: '0',
  });
  const [devWallet, setDevWallet] = useState({
    isConnected: false,
    address: null,
  });
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const mark = (present, stillDetecting) => {
      if (cancelled) return;
      setLace((prev) => ({
        ...prev,
        extensionPresent: present,
        detecting: stillDetecting,
      }));
    };

    const presentNow = () => listMidnightWallets().length > 0;
    if (presentNow()) {
      mark(true, false);
      return undefined;
    }

    mark(false, true);
    let elapsed = 0;
    const id = setInterval(() => {
      elapsed += 200;
      const present = presentNow();
      if (present) {
        mark(true, false);
        clearInterval(id);
        return;
      }
      if (elapsed >= 2000) {
        mark(false, false);
      }
    }, 200);

    const late = setInterval(() => {
      if (presentNow()) {
        mark(true, false);
        clearInterval(late);
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(id);
      clearInterval(late);
    };
  }, []);

  useEffect(() => {
    const cached = loadCachedSession();
    if (cached?.unshieldedAddress) {
      setLace((prev) => ({
        ...prev,
        address: cached.unshieldedAddress,
        shieldedAddress: cached.shieldedAddress,
        networkId: cached.networkId || NETWORK,
        walletName: cached.walletName,
        proofServerUri: cached.proofServerUri,
        // Show as connected for UI; API rehydrated below
        isConnected: true,
      }));
    }
  }, []);

  // Rehydrate ConnectedAPI after refresh so navbar + games stay in sync
  useEffect(() => {
    const cached = loadCachedSession();
    if (!cached?.unshieldedAddress) return undefined;
    if (isDev && !findMidnightWallet()) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const session = await connectLace(cached.networkId || NETWORK);
        if (cancelled) return;
        saveCachedSession(session);
        setLace({
          isConnected: true,
          address: session.unshieldedAddress,
          shieldedAddress: session.shieldedAddress,
          networkId: session.networkId,
          walletName: session.walletName,
          proofServerUri: session.proofServerUri,
          api: session.api,
          detecting: false,
          extensionPresent: true,
          tnight: session.tnight || '0',
          dust: session.dust || '0',
        });
        window.dispatchEvent(
          new CustomEvent('midnight-lace-connected', {
            detail: {
              address: session.unshieldedAddress,
              networkId: session.networkId,
              tnight: session.tnight || '0',
              dust: session.dust || '0',
              walletName: session.walletName,
            },
          }),
        );
      } catch (e) {
        // Keep cached address visible; user can click Connect again if authorize needed
        console.warn('Auto-reconnect wallet:', e?.message || e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDev]);

  useEffect(() => {
    if (!isDev) return;
    const savedState = localStorage.getItem('dev-wallet-state');
    if (savedState !== 'disconnected') {
      localStorage.setItem('dev-wallet-state', 'connected');
      setDevWallet({
        isConnected: true,
        address: '0xE2E0000000000000000000000000000000000001',
      });
    }
  }, [isDev]);

  const refreshBalances = useCallback(async () => {
    const api = lace.api;
    if (!api) return null;
    const balances = await getLaceBalances(api);
    setLace((prev) => ({
      ...prev,
      tnight: balances.tnight,
      dust: balances.dust,
    }));
    window.dispatchEvent(
      new CustomEvent('midnight-lace-balances', {
        detail: {
          tnight: balances.tnight,
          dust: balances.dust,
          address: lace.address,
        },
      }),
    );
    return balances;
  }, [lace.api, lace.address]);

  const connectWallet = useCallback(async (networkOverride, walletOrRdns) => {
    setError(null);

    if (isDev && !findMidnightWallet()) {
      localStorage.setItem('dev-wallet-state', 'connected');
      setDevWallet({
        isConnected: true,
        address: '0xE2E0000000000000000000000000000000000001',
      });
      return;
    }

    setConnecting(true);
    try {
      const targetNetwork = networkOverride || NETWORK;
      const opts =
        walletOrRdns && typeof walletOrRdns === 'object'
          ? { wallet: walletOrRdns }
          : walletOrRdns
            ? { preferredRdns: walletOrRdns }
            : {};
      const session = await connectLace(targetNetwork, opts);
      saveCachedSession(session);
      try {
        if (session.walletName) {
          localStorage.setItem('midnight_last_wallet_name', session.walletName);
        }
      } catch {
        // ignore
      }
      setLace({
        isConnected: true,
        address: session.unshieldedAddress,
        shieldedAddress: session.shieldedAddress,
        networkId: session.networkId,
        walletName: session.walletName,
        proofServerUri: session.proofServerUri,
        api: session.api,
        detecting: false,
        extensionPresent: true,
        tnight: session.tnight || '0',
        dust: session.dust || '0',
      });
      window.dispatchEvent(
        new CustomEvent('midnight-lace-connected', {
          detail: {
            address: session.unshieldedAddress,
            networkId: session.networkId,
            tnight: session.tnight || '0',
            dust: session.dust || '0',
            walletName: session.walletName,
          },
        }),
      );
    } catch (err) {
      const message = err?.message || String(err);
      setError(message);
      throw err;
    } finally {
      setConnecting(false);
    }
  }, [isDev]);

  const transferTnignt = useCallback(
    async (recipient, amountHuman) => {
      let api = lace.api;
      if (!api) {
        // Cached UI "connected" without ConnectedAPI — rehydrate from 1AM
        const targetNetwork = lace.networkId || NETWORK;
        const session = await connectLace(targetNetwork);
        saveCachedSession(session);
        api = session.api;
        setLace({
          isConnected: true,
          address: session.unshieldedAddress,
          shieldedAddress: session.shieldedAddress,
          networkId: session.networkId,
          walletName: session.walletName,
          proofServerUri: session.proofServerUri,
          api: session.api,
          detecting: false,
          extensionPresent: true,
          tnight: session.tnight || '0',
          dust: session.dust || '0',
        });
      }
      if (!api) {
        throw new Error(
          'Wallet session has no API. Click Connect 1AM again and approve the site.',
        );
      }
      const result = await transferUnshieldedNight(api, recipient, amountHuman);
      await refreshBalances();
      return result;
    },
    [lace.api, lace.networkId, refreshBalances],
  );

  const ensureApi = useCallback(async () => {
    if (lace.api) return lace.api;
    const targetNetwork = lace.networkId || NETWORK;
    const session = await connectLace(targetNetwork);
    saveCachedSession(session);
    setLace({
      isConnected: true,
      address: session.unshieldedAddress,
      shieldedAddress: session.shieldedAddress,
      networkId: session.networkId,
      walletName: session.walletName,
      proofServerUri: session.proofServerUri,
      api: session.api,
      detecting: false,
      extensionPresent: true,
      tnight: session.tnight || '0',
      dust: session.dust || '0',
    });
    return session.api;
  }, [lace.api, lace.networkId]);

  const transferTnigntBatch = useCallback(
    async (recipients, amountHuman) => {
      const api = await ensureApi();
      if (!api) {
        throw new Error(
          'Wallet session has no API. Click Reconnect on Preprod and approve.',
        );
      }
      const result = await transferUnshieldedNightBatch(
        api,
        recipients,
        amountHuman,
      );
      await refreshBalances();
      return result;
    },
    [ensureApi, refreshBalances],
  );

  useEffect(() => {
    const onCancel = () => {
      setConnecting(false);
      setError('Connection cancelled. Authorize localhost:3000 in 1AM, then retry.');
    };
    window.addEventListener('midnight-lace-connect-cancel', onCancel);
    return () => window.removeEventListener('midnight-lace-connect-cancel', onCancel);
  }, []);

  useEffect(() => {
    try {
      localStorage.removeItem('wagmi.connected');
      localStorage.removeItem('wagmi.store');
    } catch {
      // ignore
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    saveCachedSession(null);
    setLace((prev) => ({
      ...prev,
      isConnected: false,
      address: null,
      shieldedAddress: null,
      api: null,
      walletName: null,
      proofServerUri: null,
      tnight: '0',
      dust: '0',
    }));
    if (isDev) {
      localStorage.setItem('dev-wallet-state', 'disconnected');
      setDevWallet({ isConnected: false, address: null });
    }
    window.dispatchEvent(new CustomEvent('midnight-lace-disconnected'));
  }, [isDev]);

  const resetError = useCallback(() => setError(null), []);

  const laceConnected = !!lace.isConnected && !!lace.address;
  const devConnected = isDev && !!devWallet.isConnected;

  const currentStatus = {
    isConnected: laceConnected || devConnected,
    address: laceConnected ? lace.address : devConnected ? devWallet.address : lace.address,
    chain: {
      id: lace.networkId || NETWORK,
      name: `Midnight (${lace.networkId || NETWORK})`,
    },
    walletKind: laceConnected ? 'lace' : devConnected ? 'dev' : null,
    shieldedAddress: lace.shieldedAddress,
    walletName: lace.walletName || '1AM',
    proofServerUri: lace.proofServerUri,
    laceApi: lace.api,
    extensionPresent: lace.extensionPresent,
    detecting: lace.detecting,
    connecting,
    networkId: lace.networkId || NETWORK,
    tnightBalance: laceConnected ? lace.tnight : '0',
    dustBalance: laceConnected ? lace.dust : '0',
    apiReady: laceConnected && !!lace.api,
  };

  return (
    <WalletStatusContext.Provider
      value={{
        ...currentStatus,
        isDev,
        connectWallet,
        disconnectWallet,
        refreshBalances,
        transferTnignt,
        transferTnigntBatch,
        resetError,
        error,
      }}
    >
      {children}
    </WalletStatusContext.Provider>
  );
}

export default function useWalletStatus() {
  const context = useContext(WalletStatusContext);
  if (!context) {
    throw new Error('useWalletStatus must be used within a WalletStatusProvider');
  }
  return context;
}
