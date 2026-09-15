/**
 * Browser-side adapter that mirrors Compact casino circuits for the UI.
 * Private inputs stay in memory; only commitments / settlement facts are “public”.
 * On-chain deployment uses midnight-contract CompiledCasinoContract + Lace / proof server.
 * Apache-2.0
 */

export const GAME_TYPES = {
  WHEEL: 0,
  ROULETTE: 1,
  MINES: 2,
  PLINKO: 3,
};

function persistentHash(parts) {
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
}

function randomBytes(n = 32) {
  const out = new Uint8Array(n);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(out);
  } else {
    for (let i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256);
  }
  return out;
}

export function createLocalPlayer() {
  return {
    secretKey: randomBytes(32),
  };
}

export class PrivacyCasinoClient {
  constructor() {
    this.player = createLocalPlayer();
    this.rounds = new Map();
    this.nextId = 0n;
    this.houseSeedCommit = null;
    this.pendingPrivate = null;
  }

  ownerCommitment() {
    return persistentHash([
      new TextEncoder().encode('casino:owner:'),
      this.player.secretKey,
    ]);
  }

  betCommitment(choice, amount, salt) {
    return persistentHash([choice, amount, salt]);
  }

  /**
   * placeBet circuit — choice & amount remain private.
   */
  placeBet({ gameType = GAME_TYPES.WHEEL, choice, amount }) {
    if (gameType >= 4) throw new Error('invalid game type');
    if (choice < 0 || choice > 7) throw new Error('choice out of range');
    if (amount <= 0n) throw new Error('amount must be positive');

    const salt = randomBytes(32);
    this.nextId += 1n;
    const roundId = this.nextId;
    const publicRound = {
      roundId: roundId.toString(),
      ownerHash: this.ownerCommitment(),
      gameType,
      betCommit: this.betCommitment(choice, amount, salt),
      status: 'OPEN',
      outcome: null,
      payout: null,
      won: null,
    };

    this.pendingPrivate = { choice, amount, salt, roundId };
    this.rounds.set(roundId.toString(), publicRound);
    return {
      publicLedger: { ...publicRound },
      privateKeptLocally: {
        choice,
        amount: amount.toString(),
        saltHex:
          Array.from(salt)
            .slice(0, 8)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('') + '…',
      },
    };
  }

  commitHouseSeed() {
    const seed = randomBytes(32);
    this.houseSeedCommit = persistentHash([seed]);
    this._houseSeed = seed;
    return this.houseSeedCommit;
  }

  /**
   * settleWheel circuit — proves commitment match + ownership, discloses outcome/payout.
   */
  settleWheel(houseOutcome) {
    if (!this.pendingPrivate) throw new Error('no open private bet');
    const { choice, amount, salt, roundId } = this.pendingPrivate;
    const key = roundId.toString();
    const round = this.rounds.get(key);
    if (!round || round.status !== 'OPEN') throw new Error('round not open');

    if (this.betCommitment(choice, amount, salt) !== round.betCommit) {
      throw new Error('bet commitment mismatch');
    }

    const won = choice === houseOutcome;
    const payout = won ? amount * 2n : 0n;
    const settled = {
      ...round,
      status: 'SETTLED',
      outcome: houseOutcome,
      payout: payout.toString(),
      won,
    };
    this.rounds.set(key, settled);
    this.pendingPrivate = null;
    return settled;
  }

  getPublicRounds() {
    return Array.from(this.rounds.values());
  }
}
