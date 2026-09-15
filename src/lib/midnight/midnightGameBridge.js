/**
 * Shared Compact-shaped privacy bridge for Mines / Plinko / Roulette / Wheel.
 * Records private bet commitments locally (PrivacyCasinoClient) when Lace is connected.
 * Full on-chain submit still goes through midnight-dapp + Lace + proof server.
 * Apache-2.0
 */

import { PrivacyCasinoClient, GAME_TYPES } from '@/lib/midnight/PrivacyCasinoClient';

let clientSingleton = null;

export function getPrivacyClient() {
  if (!clientSingleton) clientSingleton = new PrivacyCasinoClient();
  return clientSingleton;
}

export { GAME_TYPES };

/**
 * Map UI game name → Compact gameType enum.
 */
export function resolveGameType(gameName) {
  const key = String(gameName || '').toUpperCase();
  if (key.includes('WHEEL')) return GAME_TYPES.WHEEL;
  if (key.includes('ROULETTE')) return GAME_TYPES.ROULETTE;
  if (key.includes('MINES')) return GAME_TYPES.MINES;
  if (key.includes('PLINKO')) return GAME_TYPES.PLINKO;
  return GAME_TYPES.WHEEL;
}

/**
 * Place a private Compact-style bet then settle with disclosed outcome.
 * @returns public ledger view + private summary (no secrets persisted to server)
 */
export function recordPrivateGameRound({
  gameName,
  choice = 0,
  amount,
  outcome = 0,
  won = false,
  payout = 0n,
  playerAddress = null,
}) {
  const client = getPrivacyClient();
  const gameType = resolveGameType(gameName);
  const amt =
    typeof amount === 'bigint'
      ? amount
      : BigInt(Math.max(1, Math.floor(Number(amount) * 1e9) || 1));

  // Compact choice is Uint<8> 0..7 — clamp UI outcomes into that range for commitment.
  const choiceClamped = Math.max(0, Math.min(7, Number(choice) || 0));
  const outcomeClamped = Math.max(0, Math.min(7, Number(outcome) || 0));

  const placed = client.placeBet({
    gameType,
    choice: choiceClamped,
    amount: amt,
  });

  client.commitHouseSeed();

  // Generic settle: overwrite wheel equality with explicit won/payout from the game engine.
  const pending = client.pendingPrivate;
  const key = pending.roundId.toString();
  const round = client.rounds.get(key);
  const payoutBn =
    typeof payout === 'bigint'
      ? payout
      : BigInt(Math.max(0, Math.floor(Number(payout) * 1e9) || 0));

  const settled = {
    ...round,
    status: 'SETTLED',
    outcome: outcomeClamped,
    payout: (won ? payoutBn || amt * 2n : 0n).toString(),
    won: !!won,
    playerAddress,
    gameName,
  };
  client.rounds.set(key, settled);
  client.pendingPrivate = null;

  if (typeof window !== 'undefined') {
    const history = JSON.parse(localStorage.getItem('midnight-privacy-rounds') || '[]');
    history.unshift({
      ...settled,
      placedAt: Date.now(),
      betCommit: placed.publicLedger.betCommit,
    });
    localStorage.setItem(
      'midnight-privacy-rounds',
      JSON.stringify(history.slice(0, 50)),
    );
    window.dispatchEvent(
      new CustomEvent('midnight-privacy-round', { detail: settled }),
    );
  }

  return {
    publicLedger: settled,
    privateKeptLocally: placed.privateKeptLocally,
    dappUrl: process.env.NEXT_PUBLIC_MIDNIGHT_DAPP_URL || 'http://localhost:5173',
  };
}
