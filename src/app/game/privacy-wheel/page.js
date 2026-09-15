'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PrivacyCasinoClient,
  GAME_TYPES,
} from '@/lib/midnight/PrivacyCasinoClient';
import LaceConnectPanel from '@/components/LaceConnectPanel';

const SECTORS = ['0', '1', '2', '3', '4', '5', '6', '7'];
const DAPP_URL = process.env.NEXT_PUBLIC_MIDNIGHT_DAPP_URL || 'http://localhost:5173';

export default function PrivacyWheelPage() {
  const client = useMemo(() => new PrivacyCasinoClient(), []);
  const [choice, setChoice] = useState(3);
  const [amount, setAmount] = useState('10');
  const [houseOutcome, setHouseOutcome] = useState(3);
  const [lastPlace, setLastPlace] = useState(null);
  const [lastSettle, setLastSettle] = useState(null);
  const [houseCommit, setHouseCommit] = useState(null);
  const [error, setError] = useState('');
  const [log, setLog] = useState([]);

  const push = (msg) => setLog((prev) => [msg, ...prev].slice(0, 12));

  const onPlace = () => {
    try {
      setError('');
      const result = client.placeBet({
        gameType: GAME_TYPES.WHEEL,
        choice,
        amount: BigInt(amount || '0'),
      });
      setLastPlace(result);
      setLastSettle(null);
      push(
        'placeBet -> round #' +
          result.publicLedger.roundId +
          ' (commitment only on ledger)',
      );
    } catch (e) {
      setError(e.message || String(e));
    }
  };

  const onCommitHouse = () => {
    const commit = client.commitHouseSeed();
    setHouseCommit(commit);
    push('commitHouseSeed -> ' + commit.slice(0, 18) + '...');
  };

  const onSettle = () => {
    try {
      setError('');
      const settled = client.settleWheel(Number(houseOutcome));
      setLastSettle(settled);
      push(
        'settleWheel -> ' +
          (settled.won ? 'WIN' : 'LOSS') +
          ' payout=' +
          settled.payout +
          ' outcome=' +
          settled.outcome,
      );
    } catch (e) {
      setError(e.message || String(e));
    }
  };

  return (
    <div className="min-h-screen bg-[#070005] text-white px-4 py-10 md:px-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#c4a1ff]">
              Midnight Compact
            </p>
            <h1 className="text-3xl md:text-5xl font-semibold mt-2">
              Privacy Wheel
            </h1>
            <p className="mt-3 text-white/70 max-w-2xl">
              Local Compact semantics demo. Connect once via the navbar (1AM) —
              this page shares that session. Preprod MVP contract is live — Join 33d34f16…be92 in the Compact DApp
              (Lace on Preprod + local proof server) for on-chain placeBet.
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Link
              href="/game/wheel"
              className="underline text-white/60 hover:text-white"
            >
              Classic wheel
            </Link>
            <a
              href={DAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="bg-[#059669] hover:bg-[#047857] px-4 py-2 text-sm"
            >
              Open on-chain Compact DApp
            </a>
          </div>
        </div>

        {/* Status only — connect lives in navbar (shared WalletStatusProvider) */}
        <LaceConnectPanel />

        <div className="grid md:grid-cols-2 gap-6">
          <section className="border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-xl font-medium">1. Private inputs (witnesses)</h2>
            <label className="block text-sm text-white/70">
              Sector choice (0-7)
              <select
                className="mt-1 w-full bg-black/40 border border-white/20 px-3 py-2"
                value={choice}
                onChange={(e) => setChoice(Number(e.target.value))}
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-white/70">
              Bet amount
              <input
                className="mt-1 w-full bg-black/40 border border-white/20 px-3 py-2"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^0-9]/g, ''))
                }
              />
            </label>
            <button
              type="button"
              onClick={onPlace}
              className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] py-3 font-medium"
            >
              placeBet (ZK circuit)
            </button>
          </section>

          <section className="border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-xl font-medium">2. Public ledger view</h2>
            {lastPlace ? (
              <pre className="text-xs overflow-auto bg-black/50 p-3 whitespace-pre-wrap">
                {JSON.stringify(lastPlace.publicLedger, null, 2)}
              </pre>
            ) : (
              <p className="text-white/50 text-sm">
                No round yet. Place a private bet.
              </p>
            )}
            {lastPlace && (
              <div className="text-sm text-emerald-300/90">
                Kept only locally: choice=
                {lastPlace.privateKeptLocally.choice}, amount=
                {lastPlace.privateKeptLocally.amount}, salt=
                {lastPlace.privateKeptLocally.saltHex}
              </div>
            )}
          </section>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <section className="border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-xl font-medium">3. House commit-reveal</h2>
            <button
              type="button"
              onClick={onCommitHouse}
              className="w-full border border-white/30 py-3 hover:bg-white/10"
            >
              commitHouseSeed
            </button>
            {houseCommit && (
              <p className="text-xs break-all text-white/60">
                commit: {houseCommit}
              </p>
            )}
            <label className="block text-sm text-white/70">
              House outcome sector
              <select
                className="mt-1 w-full bg-black/40 border border-white/20 px-3 py-2"
                value={houseOutcome}
                onChange={(e) => setHouseOutcome(Number(e.target.value))}
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={onSettle}
              className="w-full bg-[#059669] hover:bg-[#047857] py-3 font-medium"
            >
              settleWheel (prove + disclose)
            </button>
          </section>

          <section className="border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-xl font-medium">4. Settlement disclosure</h2>
            {lastSettle ? (
              <pre className="text-xs overflow-auto bg-black/50 p-3 whitespace-pre-wrap">
                {JSON.stringify(lastSettle, null, 2)}
              </pre>
            ) : (
              <p className="text-white/50 text-sm">
                Settle to selectively disclose outcome and payout.
              </p>
            )}
            <p className="text-sm text-white/60">
              Contract source: <code>midnight-contract/casino.compact</code>{' '}
              (compiles with Compact 0.31 / language 0.23). Start proof server
              with <code>npm run proof:up</code>.
            </p>
          </section>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <section className="border border-white/10 bg-black/30 p-4">
          <h3 className="text-sm uppercase tracking-widest text-white/50 mb-2">
            Activity
          </h3>
          <ul className="space-y-1 text-sm text-white/80">
            {log.map((line, i) => (
              <li key={i + '-' + line}>{line}</li>
            ))}
            {log.length === 0 && (
              <li className="text-white/40">No circuit calls yet.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
