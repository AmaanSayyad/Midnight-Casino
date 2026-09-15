/**
 * Simulator mirroring midnight-contract/casino.compact for QA.
 * Apache-2.0
 */

export enum RoundStatus {
  OPEN = 0,
  SETTLED = 1,
}

export type Round = {
  ownerHash: string;
  gameType: number;
  betCommit: string;
  status: RoundStatus;
  outcome: number;
  payout: bigint;
  won: boolean;
};

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

/** Stand-in for Compact persistentHash — deterministic for tests only. */
export const persistentHash = (parts: Array<Uint8Array | number | bigint>): string => {
  let hash = 0n;
  for (const part of parts) {
    if (typeof part === 'number' || typeof part === 'bigint') {
      hash = (hash * 31n + BigInt(part)) % 2n ** 252n;
    } else {
      for (let i = 0; i < part.length; i++) {
        hash = (hash * 31n + BigInt(part[i])) % 2n ** 252n;
      }
    }
  }
  return hash.toString(16).padStart(64, '0');
};

export class CasinoSimulator {
  rounds = new Map<bigint, Round>();
  nextRoundId = 0n;
  totalRounds = 0n;
  houseSeedCommit = '';

  ownerCommitment(sk: Uint8Array): string {
    return persistentHash([new TextEncoder().encode('casino:owner:'), sk]);
  }

  betCommitment(choice: number, amount: bigint, salt: Uint8Array): string {
    return persistentHash([choice, amount, salt]);
  }

  placeBet(
    sk: Uint8Array,
    gameType: number,
    choice: number,
    amount: bigint,
    salt: Uint8Array,
  ): bigint {
    if (gameType >= 4) throw new Error('invalid game type');
    if (choice >= 8) throw new Error('choice out of range');
    if (amount <= 0n) throw new Error('amount must be positive');

    this.nextRoundId += 1n;
    this.totalRounds += 1n;
    const roundId = this.nextRoundId;

    this.rounds.set(roundId, {
      ownerHash: this.ownerCommitment(sk),
      gameType,
      betCommit: this.betCommitment(choice, amount, salt),
      status: RoundStatus.OPEN,
      outcome: 0,
      payout: 0n,
      won: false,
    });

    return roundId;
  }

  commitHouseSeed(commit: string): void {
    this.houseSeedCommit = commit;
  }

  settleWheel(
    roundId: bigint,
    sk: Uint8Array,
    choice: number,
    amount: bigint,
    salt: Uint8Array,
    houseOutcome: number,
  ): Round {
    if (houseOutcome >= 8) throw new Error('invalid house outcome');
    const round = this.rounds.get(roundId);
    if (!round) throw new Error('round not found');
    if (round.status !== RoundStatus.OPEN) throw new Error('round already settled');
    if (round.gameType !== 0) throw new Error('not a wheel round');
    if (this.ownerCommitment(sk) !== round.ownerHash) throw new Error('not round owner');
    if (this.betCommitment(choice, amount, salt) !== round.betCommit) {
      throw new Error('bet commitment mismatch');
    }

    const won = choice === houseOutcome;
    const settled: Round = {
      ...round,
      status: RoundStatus.SETTLED,
      outcome: houseOutcome,
      payout: won ? amount * 2n : 0n,
      won,
    };
    this.rounds.set(roundId, settled);
    return settled;
  }

  verifyRoundOwnership(roundId: bigint, sk: Uint8Array): boolean {
    const round = this.rounds.get(roundId);
    if (!round) return false;
    return this.ownerCommitment(sk) === round.ownerHash;
  }

  /** Public ledger view — never includes secret key, choice, amount, or salt. */
  publicLedgerView(roundId: bigint): Omit<Round, never> | undefined {
    return this.rounds.get(roundId);
  }

  debugCommitHex(salt: Uint8Array): string {
    return toHex(salt);
  }
}
