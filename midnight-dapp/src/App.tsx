/**
 * Midnight Casino DApp — 1AM / Lace Connector + Compact. Connect first; load deploy stack on demand.
 * Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { CasinoAPI } from './casino-api';
import type { CasinoDerivedState } from './casino-types';

const NETWORK_ID = import.meta.env.VITE_NETWORK_ID ?? 'preprod';
const ONE_AM_INSTALL_URL = 'https://1am.xyz/';
const PREPROD_FAUCET = 'https://midnight-tmnight-preprod.nethermind.dev/';
const DEFAULT_JOIN =
  (import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined)?.trim() ||
  '33d34f168e360498df9b9e08baca1c999cdf50e61642f8af2888eaed7ec4be92';

type WalletState = 'detecting' | 'no-wallet' | 'ready' | 'connecting' | 'connected';

function truncAddr(addr: string): string {
  return addr.length <= 28 ? addr : `${addr.slice(0, 16)}…${addr.slice(-10)}`;
}

function friendlyError(e: unknown): string {
  const msg = extractErrorMessage(e);
  if (msg.includes('User rejected') || msg.includes('rejected')) {
    return 'Transaction / connect cancelled in wallet.';
  }
  if (
    msg.includes('proof server') ||
    msg.includes('Proof Server') ||
    msg.includes('Failed to fetch')
  ) {
    return 'Proof server unreachable. Run `npm run proof:up` and point the wallet at http://127.0.0.1:6300.';
  }
  if (msg.includes('DUST') || msg.includes('insufficient')) {
    return `Insufficient DUST/NIGHT. Fund unshielded Preprod address at ${PREPROD_FAUCET}, then Generate tDUST in the wallet.`;
  }
  if (msg.includes('No Midnight wallet') || msg.includes('Could not find')) {
    return `Install 1AM (${ONE_AM_INSTALL_URL}), unlock it, set network to Preprod, proof server http://127.0.0.1:6300, then refresh.`;
  }
  if (msg.includes("'ctor'") || msg.includes('CompactContext')) {
    return 'Compact stack failed to load (runtime/module mismatch). Hard-refresh http://localhost:5173 and retry Deploy. If it persists, restart: npm run midnight:dapp';
  }
  return msg || 'Unexpected error — check browser console.';
}

function extractErrorMessage(e: any): string {
  if (!e) return '';
  if (e.message) return e.message;
  const failure = e?.cause?.failure;
  if (failure?.message) return failure.message;
  if (e?.cause?.message) return e.cause.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

function scoreWallet(w: InitialAPI): number {
  const blob = `${(w as any).name || ''} ${(w as any).rdns || ''}`.toLowerCase();
  if (blob.includes('1am') || blob.includes('1 am') || blob.includes('webisoft')) return 200;
  if (blob.includes('lace')) return 80;
  if (blob.includes('midnight')) return 50;
  return 10;
}

function findWallet(): InitialAPI | undefined {
  const midnight = (window as any).midnight;
  if (!midnight) return undefined;
  const wallets = Object.values(midnight).filter(
    (w): w is InitialAPI => !!w && typeof w === 'object' && 'apiVersion' in w,
  );
  if (!wallets.length) return undefined;
  return [...wallets].sort((a, b) => scoreWallet(b) - scoreWallet(a))[0];
}

export default function App() {
  const [walletState, setWalletState] = useState<WalletState>('detecting');
  const [walletAPI, setWalletAPI] = useState<InitialAPI | undefined>();
  const [wallet, setWallet] = useState<ConnectedAPI | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [contractAddress, setContractAddress] = useState('');
  const [joinInput, setJoinInput] = useState(DEFAULT_JOIN);
  const [deploying, setDeploying] = useState(false);
  const [busy, setBusy] = useState(false);

  const [choice, setChoice] = useState(3);
  const [amount, setAmount] = useState('10');
  const [houseOutcome, setHouseOutcome] = useState(3);
  const [roundId, setRoundId] = useState('1');
  const [ledger, setLedger] = useState<CasinoDerivedState | null>(null);

  const apiRef = useRef<CasinoAPI | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const found = findWallet();
    if (found) {
      setWalletAPI(found);
      setWalletState('ready');
      return;
    }
    let elapsed = 0;
    const t = setInterval(() => {
      elapsed += 100;
      const w = findWallet();
      if (w) {
        setWalletAPI(w);
        setWalletState('ready');
        clearInterval(t);
      } else if (elapsed >= 5_000) {
        setWalletState('no-wallet');
        clearInterval(t);
      }
    }, 100);
    return () => clearInterval(t);
  }, []);

  useEffect(() => () => unsubRef.current?.(), []);

  const connect = useCallback(async () => {
    if (!walletAPI) return;
    setWalletState('connecting');
    setError(null);
    try {
      const c = await walletAPI.connect(NETWORK_ID);
      setWallet(c);
      const { unshieldedAddress } = await c.getUnshieldedAddress();
      setAddress(unshieldedAddress);
      setWalletState('connected');
      setStatus(`Connected to Midnight ${NETWORK_ID}`);
    } catch (e) {
      setError(friendlyError(e));
      setWalletState('ready');
    }
  }, [walletAPI]);

  const disconnect = useCallback(async () => {
    try {
      const maybe = wallet as ConnectedAPI & { disconnect?: () => Promise<void> | void };
      await maybe?.disconnect?.();
    } catch {
      /* wallet may not expose disconnect — clear local session anyway */
    }
    unsubRef.current?.();
    unsubRef.current = null;
    apiRef.current = null;
    setWallet(null);
    setAddress(null);
    setContractAddress('');
    setLedger(null);
    setWalletState(walletAPI ? 'ready' : 'no-wallet');
    setStatus(`Disconnected from Midnight ${NETWORK_ID}`);
    setError(null);
  }, [wallet, walletAPI]);

  const attachApi = useCallback(async (api: CasinoAPI) => {
    unsubRef.current?.();
    apiRef.current = api;
    setContractAddress(api.deployedContractAddress);
    const sub = api.state$.subscribe({
      next: (s) => setLedger(s),
      error: (err) => setError(friendlyError(err)),
    });
    unsubRef.current = () => sub.unsubscribe();
    setStatus(`Contract ready: ${api.deployedContractAddress}`);
  }, []);

  const loadManager = useCallback(async () => {
    const [{ BrowserCasinoManager }, pinoMod] = await Promise.all([
      import('./BrowserCasinoManager'),
      import('pino'),
    ]);
    const pino = (pinoMod as any).default ?? pinoMod;
    return new BrowserCasinoManager(pino({ level: 'info', browser: { asObject: true } }));
  }, []);

  const waitDeployment = (deployment$: any) =>
    new Promise<any>((resolve, reject) => {
      const sub = deployment$.subscribe((d: any) => {
        if (d.status === 'deployed') {
          Promise.resolve().then(() => sub.unsubscribe());
          resolve(d);
        }
        if (d.status === 'failed') {
          Promise.resolve().then(() => sub.unsubscribe());
          reject(d.error);
        }
      });
    });

  const deployContract = useCallback(async () => {
    if (!wallet) return;
    setDeploying(true);
    setError(null);
    setStatus('Loading Compact stack + deploying…');
    try {
      const manager = await loadManager();
      const result = await waitDeployment(manager.resolve());
      await attachApi(result.api);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setDeploying(false);
    }
  }, [wallet, loadManager, attachApi]);

  const joinContract = useCallback(async () => {
    if (!wallet) return;
    const addr = joinInput.trim();
    if (!/^[0-9a-fA-F]{64}$/.test(addr)) {
      setError('Contract address must be 64 hex characters.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const manager = await loadManager();
      const result = await waitDeployment(manager.resolve(addr as any));
      await attachApi(result.api);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }, [wallet, joinInput, loadManager, attachApi]);

  const onPlaceBet = useCallback(async () => {
    if (!apiRef.current) return;
    setBusy(true);
    setError(null);
    try {
      await apiRef.current.placeBet(0, choice, BigInt(amount || '0'));
      setStatus('placeBet submitted.');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }, [choice, amount]);

  const onCommitHouse = useCallback(async () => {
    if (!apiRef.current) return;
    setBusy(true);
    setError(null);
    try {
      const commit = crypto.getRandomValues(new Uint8Array(32));
      await apiRef.current.commitHouseSeed(commit);
      setStatus('House seed commitment submitted.');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const onSettle = useCallback(async () => {
    if (!apiRef.current) return;
    setBusy(true);
    setError(null);
    try {
      await apiRef.current.settleWheel(BigInt(roundId), houseOutcome);
      setStatus('settleWheel submitted.');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }, [roundId, houseOutcome]);

  const stepConnected = walletState === 'connected';
  const stepJoined = !!contractAddress;
  const stepProgress = [
    { label: 'Connect wallet', done: stepConnected },
    { label: 'Join / Deploy', done: stepJoined },
    { label: 'placeBet → commit → settle', done: stepJoined && !!ledger },
  ];

  return (
    <div className="app">
      <h1>Midnight Casino (1AM + Compact)</h1>
      <p className="muted">
        DApp Connector v4 on <strong>{NETWORK_ID}</strong>. Seed phrases stay
        in the wallet — this app never asks for them. Preferred:{' '}
        <a href={ONE_AM_INSTALL_URL} target="_blank" rel="noreferrer">
          1AM
        </a>
        .
      </p>

      <div className="card" style={{ padding: '0.75rem 1rem' }}>
        <p className="muted" style={{ margin: '0 0 0.5rem' }}>
          Progress (L5 UX)
        </p>
        <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
          {stepProgress.map((s) => (
            <li key={s.label} style={{ color: s.done ? '#34d399' : undefined }}>
              {s.done ? '✓ ' : '○ '}
              {s.label}
            </li>
          ))}
        </ol>
        <p className="muted" style={{ margin: '0.75rem 0 0' }}>
          After a round, leave Preprod feedback:{' '}
          <a
            href="https://midnight-casino-eta.vercel.app/feedback"
            target="_blank"
            rel="noreferrer"
          >
            midnight-casino-eta.vercel.app/feedback
          </a>
        </p>
      </div>

      <div className="card">
        <h2>1. Midnight wallet</h2>
        {walletState === 'detecting' && <p className="muted">Detecting window.midnight…</p>}
        {walletState === 'no-wallet' && (
          <p className="error">
            No Midnight wallet detected. Install/unlock{' '}
            <a href={ONE_AM_INSTALL_URL} target="_blank" rel="noreferrer">
              1AM
            </a>{' '}
            on Preprod, then refresh.
          </p>
        )}
        {(walletState === 'ready' || walletState === 'connecting') && (
          <button disabled={walletState === 'connecting'} onClick={connect}>
            {walletState === 'connecting' ? 'Approve in wallet…' : 'Connect Lace / 1AM'}
          </button>
        )}
        {walletState === 'connected' && address && (
          <div className="row" style={{ alignItems: 'center' }}>
            <p className="ok" style={{ margin: 0 }}>
              Connected: {truncAddr(address)}
            </p>
            <button className="secondary" disabled={busy || deploying} onClick={disconnect}>
              Disconnect
            </button>
          </div>
        )}
        <p className="muted" style={{ marginTop: '0.75rem' }}>
          Wallet must be on <strong>Preprod</strong> with proof server{' '}
          <code>http://127.0.0.1:6300</code>. Faucet:{' '}
          <a href={PREPROD_FAUCET} target="_blank" rel="noreferrer">
            tNIGHT Preprod
          </a>
          .
        </p>
      </div>

      <div className="card">
        <h2>2. Compact contract</h2>
        <div className="row">
          <button disabled={!wallet || deploying || busy} onClick={deployContract}>
            {deploying ? 'Deploying…' : 'Deploy casino.compact'}
          </button>
        </div>
        <div className="row" style={{ marginTop: '0.75rem' }}>
          <input
            style={{ flex: 1, minWidth: 220 }}
            placeholder="Join existing contract (64-hex)"
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value)}
          />
          <button className="secondary" disabled={!wallet || busy} onClick={joinContract}>
            Join Preprod MVP
          </button>
        </div>
        {contractAddress && (
          <p className="muted" style={{ marginTop: '0.75rem', wordBreak: 'break-all' }}>
            Active: {contractAddress}
          </p>
        )}
      </div>

      <div className="card">
        <h2>3. Private bet / settle</h2>
        <div className="row">
          <label>
            Choice{' '}
            <select value={choice} onChange={(e) => setChoice(Number(e.target.value))}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            Amount{' '}
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </label>
          <button disabled={!contractAddress || busy} onClick={onPlaceBet}>
            placeBet
          </button>
        </div>
        <div className="row" style={{ marginTop: '0.75rem' }}>
          <button
            className="secondary"
            disabled={!contractAddress || busy}
            onClick={onCommitHouse}
          >
            commitHouseSeed
          </button>
          <label>
            Round ID{' '}
            <input
              value={roundId}
              onChange={(e) => setRoundId(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </label>
          <label>
            House outcome{' '}
            <select
              value={houseOutcome}
              onChange={(e) => setHouseOutcome(Number(e.target.value))}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button disabled={!contractAddress || busy} onClick={onSettle}>
            settleWheel
          </button>
        </div>
      </div>

      <div className="card">
        <h2>4. Public ledger</h2>
        {!ledger && <p className="muted">Deploy or join to stream ledger state.</p>}
        {ledger && (
          <>
            <p className="muted">
              nextRoundId={ledger.nextRoundId} · totalRounds={ledger.totalRounds}
            </p>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Outcome</th>
                  <th>Payout</th>
                  <th>Won</th>
                </tr>
              </thead>
              <tbody>
                {ledger.rounds.map((r) => (
                  <tr key={r.roundId}>
                    <td>{r.roundId}</td>
                    <td>{r.status}</td>
                    <td>{r.outcome}</td>
                    <td>{r.payout}</td>
                    <td>{String(r.won)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {status && <p className="ok">{status}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
