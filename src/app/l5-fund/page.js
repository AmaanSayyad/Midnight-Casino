'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import useWalletStatus from '@/hooks/useWalletStatus';
import walletList from '@/data/l5-wallets.json';

const STORAGE_KEY = 'mc-l5-fund-progress';

function trunc(addr) {
  if (!addr || addr.length < 24) return addr || '';
  return `${addr.slice(0, 18)}…${addr.slice(-10)}`;
}

export default function L5FundPage() {
  const {
    isConnected,
    address,
    tnightBalance,
    dustBalance,
    connecting,
    connectWallet,
    transferTnignt,
    refreshBalances,
    error: walletError,
    networkId,
    apiReady,
  } = useWalletStatus();

  const wallets = walletList.wallets || [];
  const [amount, setAmount] = useState(walletList.amountDefault || '0.1');
  const [startIndex, setStartIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const pauseRef = React.useRef(false);
  const [results, setResults] = useState([]);
  const [current, setCurrent] = useState(null);
  const [localError, setLocalError] = useState('');
  const [ensuring, setEnsuring] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved.results)) setResults(saved.results);
        if (typeof saved.startIndex === 'number') setStartIndex(saved.startIndex);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const okCount = useMemo(() => results.filter((r) => r.ok).length, [results]);
  const totalNeed = useMemo(() => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return '—';
    return (n * wallets.length).toFixed(4);
  }, [amount, wallets.length]);

  const onPreview = String(networkId || '').toLowerCase() === 'preview';
  const balanceNum = Number(tnightBalance);
  const needNum = Number(totalNeed);
  const shortFunds =
    Number.isFinite(balanceNum) &&
    Number.isFinite(needNum) &&
    balanceNum + 1e-9 < needNum;

  const persist = (nextResults, nextStart) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ results: nextResults, startIndex: nextStart }),
      );
    } catch {
      /* ignore */
    }
  };

  const onPause = () => {
    pauseRef.current = true;
    setPaused(true);
  };

  const ensureLiveApi = useCallback(async () => {
    setEnsuring(true);
    setLocalError('');
    try {
      // Force a real ConnectedAPI on Preprod (cached navbar session is not enough)
      await connectWallet('preprod');
      if (typeof refreshBalances === 'function') {
        await refreshBalances();
      }
    } catch (e) {
      setLocalError(e?.message || String(e));
      throw e;
    } finally {
      setEnsuring(false);
    }
  }, [connectWallet, refreshBalances]);

  const runBatch = useCallback(async () => {
    if (!amount || Number(amount) <= 0) {
      setLocalError('Enter a positive tNIGHT amount per wallet.');
      return;
    }
    setLocalError('');
    setRunning(true);
    pauseRef.current = false;
    setPaused(false);

    try {
      if (!apiReady) {
        await ensureLiveApi();
      }
    } catch {
      setRunning(false);
      return;
    }

    let nextResults = [...results];
    let i = startIndex;

    for (; i < wallets.length; i++) {
      if (pauseRef.current) break;
      const w = wallets[i];
      setCurrent({ index: w.index, address: w.address });
      try {
        await transferTnignt(w.address, amount);
        nextResults = [
          ...nextResults.filter((r) => r.index !== w.index),
          {
            index: w.index,
            address: w.address,
            ok: true,
            at: new Date().toISOString(),
            amount,
          },
        ];
        setResults(nextResults);
        persist(nextResults, i + 1);
        setStartIndex(i + 1);
        await new Promise((r) => setTimeout(r, 1500));
      } catch (e) {
        const msg = e?.message || String(e);
        nextResults = [
          ...nextResults.filter((r) => r.index !== w.index),
          {
            index: w.index,
            address: w.address,
            ok: false,
            error: msg,
            at: new Date().toISOString(),
          },
        ];
        setResults(nextResults);
        persist(nextResults, i);
        setLocalError(`Stopped at #${w.index}: ${msg}`);
        break;
      }
    }

    setCurrent(null);
    setRunning(false);
    setPaused(false);
  }, [
    amount,
    apiReady,
    ensureLiveApi,
    results,
    startIndex,
    wallets,
    transferTnignt,
  ]);

  const resetProgress = () => {
    setResults([]);
    setStartIndex(0);
    setLocalError('');
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-[#070005] text-white px-4 py-10 md:px-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#c4a1ff]">
            Rise In · Level 5 / 6
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold mt-2">
            Fund Preprod wallets (1AM)
          </h1>
          <p className="mt-3 text-white/70 max-w-2xl">
            Recipients are <code className="text-white/90">mn_addr_preprod…</code>.
            Connect 1AM on <strong>Preprod</strong>, then send a small tNIGHT
            amount. Approve each transfer in the wallet popup.
          </p>
        </div>

        <div className="border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100/90 space-y-2">
          <p className="font-medium text-amber-50">How the transaction works</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              <strong>You send tNIGHT</strong> to each recipient address.
            </li>
            <li>
              <strong>Your wallet spends tDUST as the fee</strong> (or 1AM
              sponsors). DUST is never transferred to them.
            </li>
            <li>
              Recipients register received tNIGHT in 1AM to generate their own
              tDUST later.
            </li>
          </ol>
          <p>
            Need ≈ <code>{totalNeed}</code> tNIGHT + fee DUST / sponsorship for{' '}
            {wallets.length} × {amount || '?'}.
          </p>
        </div>

        {onPreview && (
          <div className="border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            Wallet network is <strong>preview</strong>, but recipients are{' '}
            <strong>preprod</strong>. Click <em>Reconnect on Preprod</em> (and
            switch 1AM → Preprod) before funding.
          </div>
        )}

        {shortFunds && (
          <div className="border border-orange-500/40 bg-orange-500/10 p-4 text-sm text-orange-100">
            Wallet shows ~{tnightBalance} tNIGHT but this run needs ~{totalNeed}.
            Lower the per-address amount (e.g. <code>0.1</code>) or faucet more
            tNIGHT on Preprod.
          </div>
        )}

        <section className="border border-white/10 bg-white/5 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-white/70">
              {isConnected ? (
                <>
                  Address: <code className="text-emerald-300">{trunc(address)}</code>
                  <br />
                  Network: {networkId || '—'} · API:{' '}
                  {apiReady ? (
                    <span className="text-emerald-400">ready</span>
                  ) : (
                    <span className="text-amber-300">
                      cached only — reconnect required
                    </span>
                  )}
                  <br />
                  tNIGHT: {tnightBalance ?? '—'} · DUST: {dustBalance ?? '—'}
                </>
              ) : (
                'Not connected — connect 1AM on Preprod.'
              )}
            </div>
            <button
              type="button"
              disabled={connecting || ensuring || running}
              onClick={() => ensureLiveApi().catch(() => {})}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 px-4 py-2 text-sm font-medium"
            >
              {connecting || ensuring
                ? 'Connecting…'
                : apiReady && !onPreview
                  ? 'Refresh Preprod session'
                  : 'Reconnect on Preprod'}
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-sm text-white/70">
              tNIGHT per address
              <input
                className="mt-1 w-full bg-black/40 border border-white/20 px-3 py-2"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^0-9.]/g, ''))
                }
                disabled={running}
              />
            </label>
            <label className="block text-sm text-white/70">
              Resume from index (0-based)
              <input
                type="number"
                min={0}
                max={wallets.length}
                className="mt-1 w-full bg-black/40 border border-white/20 px-3 py-2"
                value={startIndex}
                onChange={(e) =>
                  setStartIndex(
                    Math.max(
                      0,
                      Math.min(wallets.length, Number(e.target.value) || 0),
                    ),
                  )
                }
                disabled={running}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            {!running ? (
              <button
                type="button"
                onClick={runBatch}
                className="bg-[#059669] hover:bg-[#047857] px-5 py-3 font-medium"
              >
                {startIndex > 0
                  ? `Resume funding (${startIndex + 1}→${wallets.length})`
                  : `Fund all ${wallets.length} addresses`}
              </button>
            ) : (
              <button
                type="button"
                onClick={onPause}
                className="border border-white/30 px-5 py-3 hover:bg-white/10"
              >
                {paused ? 'Pausing…' : 'Pause after current'}
              </button>
            )}
            <button
              type="button"
              onClick={resetProgress}
              disabled={running}
              className="border border-white/20 px-4 py-3 text-sm text-white/70 disabled:opacity-40"
            >
              Reset progress
            </button>
            <Link
              href="/onboard"
              className="self-center text-sm underline text-white/60 hover:text-white"
            >
              Onboard guide
            </Link>
          </div>

          {(localError || walletError) && (
            <p className="text-red-400 text-sm">{localError || walletError}</p>
          )}

          {current && (
            <p className="text-amber-200/90 text-sm" role="status">
              Sending #{current.index}: {trunc(current.address)} — approve in
              1AM…
            </p>
          )}

          <p className="text-sm text-white/50">
            Progress: {okCount} / {wallets.length} succeeded · next index{' '}
            {startIndex}
          </p>
        </section>

        <section className="border border-white/10 bg-black/30 p-4 max-h-80 overflow-auto">
          <h2 className="text-sm uppercase tracking-widest text-white/50 mb-3">
            Recipients
          </h2>
          <ul className="space-y-1 text-xs font-mono text-white/70">
            {wallets.map((w) => {
              const r = results.find((x) => x.index === w.index);
              return (
                <li key={w.index} className="flex gap-2">
                  <span className="text-white/40 w-6">{w.index}</span>
                  <span className="break-all flex-1">{w.address}</span>
                  <span
                    className={
                      r?.ok
                        ? 'text-emerald-400'
                        : r
                          ? 'text-red-400'
                          : 'text-white/30'
                    }
                  >
                    {r?.ok ? '✓' : r ? '✗' : '·'}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
