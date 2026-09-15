'use client';

import React, { useEffect, useState } from 'react';
import useWalletStatus from '@/hooks/useWalletStatus';
import {
  ONE_AM_INSTALL_URL,
  isOneAmWallet,
  listMidnightWallets,
  scoreMidnightWallet,
  walletLabel,
} from '@/lib/midnight/lace';

const NETWORK_OPTIONS = [
  { id: 'preview', label: 'preview' },
  { id: 'preprod', label: 'preprod' },
  { id: 'undeployed', label: 'undeployed' },
];

function shortAddr(addr) {
  if (!addr || addr.length < 12) return addr || '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function safeIcon(src) {
  if (!src || typeof src !== 'string') return null;
  if (src.startsWith('data:') || src.startsWith('https://') || src.startsWith('http://')) {
    return src;
  }
  return null;
}

export default function MidnightConnectWalletButton() {
  const {
    isConnected,
    address,
    connecting,
    detecting,
    extensionPresent,
    connectWallet,
    disconnectWallet,
    networkId,
    error,
    walletName,
  } = useWalletStatus();

  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('preview');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [wallets, setWallets] = useState([]);

  const refreshWallets = () => {
    const list = listMidnightWallets()
      .filter((w) => scoreMidnightWallet(w) >= 0)
      .sort((a, b) => scoreMidnightWallet(b) - scoreMidnightWallet(a));
    setWallets(list);
    return list;
  };

  useEffect(() => {
    refreshWallets();
    const id = setInterval(refreshWallets, 1500);
    return () => clearInterval(id);
  }, []);

  const connectWith = async (wallet) => {
    setLocalError('');
    setBusy(true);
    setPickerOpen(false);
    try {
      await connectWallet(selectedNetwork, wallet);
    } catch (e) {
      setLocalError(e?.message || 'Connection failed');
    } finally {
      setBusy(false);
    }
  };

  const onConnectClick = () => {
    setLocalError('');
    const list = refreshWallets();
    if (!list.length) {
      setLocalError('No Midnight wallet detected. Install 1AM, unlock, refresh.');
      return;
    }
    if (list.length === 1) {
      connectWith(list[0]);
      return;
    }
    setPickerOpen(true);
  };

  if (detecting) {
    return (
      <button type="button" disabled className="px-4 py-2 rounded-lg bg-white/10 text-white/60 text-sm">
        Detecting wallet…
      </button>
    );
  }

  if (!extensionPresent && !isConnected) {
    return (
      <a
        href={ONE_AM_INSTALL_URL}
        target="_blank"
        rel="noreferrer"
        className="px-4 py-2 rounded-lg bg-[#7c3aed] text-white text-sm font-medium"
      >
        Install 1AM
      </a>
    );
  }

  if (isConnected && address) {
    const label = walletName || 'Midnight';
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-[10px] uppercase tracking-wider text-[#c4a1ff]">
            {label} · {networkId}
          </span>
          <span className="text-xs text-white/90 font-mono">{shortAddr(address)}</span>
        </div>
        <button
          type="button"
          onClick={() => disconnectWallet()}
          className="px-3 py-2 rounded-lg bg-[#1a0a2e] text-white text-sm border border-[#7c3aed]/40"
        >
          Disconnect
        </button>
      </div>
    );
  }

  const waiting = busy || connecting;

  return (
    <div className="flex flex-col items-end gap-1 max-w-[360px] relative">
      <div className="flex items-center gap-2">
        <select
          value={selectedNetwork}
          onChange={(e) => setSelectedNetwork(e.target.value)}
          disabled={waiting}
          className="text-xs bg-[#1a0a2e] border border-[#7c3aed]/40 text-white rounded-lg px-2 py-2"
        >
          {NETWORK_OPTIONS.map((n) => (
            <option key={n.id} value={n.id}>
              {n.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={waiting}
          onClick={onConnectClick}
          className="px-4 py-2 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white text-sm font-medium"
        >
          {waiting ? 'Approve in wallet…' : 'Connect 1AM'}
        </button>
        {waiting && (
          <button
            type="button"
            onClick={() => {
              setBusy(false);
              window.dispatchEvent(new CustomEvent('midnight-lace-connect-cancel'));
            }}
            className="px-3 py-2 rounded-lg bg-white/10 text-white/80 text-sm"
          >
            Cancel
          </button>
        )}
      </div>

      {pickerOpen && (
        <div className="absolute top-full right-0 mt-2 z-50 w-72 rounded-xl border border-[#7c3aed]/40 bg-[#12081f] shadow-xl p-3">
          <div className="text-xs text-white/70 mb-2">Choose Midnight wallet</div>
          <div className="flex flex-col gap-2 max-h-64 overflow-auto">
            {wallets.map((w, i) => {
              const icon = safeIcon(w.icon);
              const preferred = isOneAmWallet(w);
              return (
                <button
                  key={`${w.rdns || w.name || i}`}
                  type="button"
                  onClick={() => connectWith(w)}
                  className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                    preferred
                      ? 'border-[#7c3aed] bg-[#7c3aed]/20 hover:bg-[#7c3aed]/30'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={icon} alt="" className="w-7 h-7 rounded" />
                  ) : (
                    <span className="w-7 h-7 rounded bg-[#7c3aed]/40 flex items-center justify-center text-xs">
                      {(walletLabel(w)[0] || '?').toUpperCase()}
                    </span>
                  )}
                  <span className="flex-1 text-sm text-white">
                    {walletLabel(w)}
                    {preferred ? (
                      <span className="ml-2 text-[10px] uppercase text-[#c4a1ff]">preferred</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="mt-2 w-full text-xs text-white/50 hover:text-white/80"
            onClick={() => setPickerOpen(false)}
          >
            Cancel
          </button>
        </div>
      )}

      {(localError || error) && (
        <span className="text-[11px] text-red-400 text-right leading-snug">{localError || error}</span>
      )}
      <span className="text-[10px] text-white/50 text-right">
        Preferred: <a className="underline" href={ONE_AM_INSTALL_URL} target="_blank" rel="noreferrer">1AM</a>
        {' '}· unlock · network = preview · Authorize
      </span>
    </div>
  );
}
