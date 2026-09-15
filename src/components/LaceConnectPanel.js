'use client';

import useWalletStatus from '@/hooks/useWalletStatus';

const DAPP_URL = process.env.NEXT_PUBLIC_MIDNIGHT_DAPP_URL || 'http://localhost:5173';

/**
 * Status-only panel — connect lives in the navbar (shared WalletStatusProvider).
 */
export default function LaceConnectPanel({ compact = false }) {
  const {
    isConnected,
    address,
    networkId,
    walletName,
    proofServerUri,
    detecting,
  } = useWalletStatus();

  return (
    <div
      className={
        compact
          ? 'border border-white/15 bg-black/40 p-3 text-sm'
          : 'border border-white/10 bg-white/5 p-6 space-y-3'
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#c4a1ff]">
            {walletName || '1AM / Midnight'}
          </p>
          <p className="text-white/80 mt-1">
            Network: <code>{networkId || 'preview'}</code>
          </p>
          {isConnected && proofServerUri && (
            <p className="text-white/50 text-xs mt-1 break-all">
              Proof server: {proofServerUri}
            </p>
          )}
          {isConnected && (
            <p className="text-white/50 text-xs mt-1">
              On-chain Compact UI:{' '}
              <a className="underline text-white" href={DAPP_URL} target="_blank" rel="noreferrer">
                {DAPP_URL}
              </a>
            </p>
          )}
        </div>
        {detecting ? (
          <span className="text-white/50">Detecting wallet…</span>
        ) : isConnected && address ? (
          <span className="text-emerald-300 text-xs break-all max-w-md">{address}</span>
        ) : (
          <span className="text-amber-300 text-sm">Connect 1AM in the navbar →</span>
        )}
      </div>
    </div>
  );
}
