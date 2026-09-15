import { describe, it, expect, beforeEach } from 'vitest';
import { CasinoSimulator, RoundStatus } from './casino-simulator.js';

const sk = () => new Uint8Array(32).fill(7);
const otherSk = () => new Uint8Array(32).fill(9);
const salt = () => new Uint8Array(32).fill(3);

describe('Midnight Casino Compact (simulator)', () => {
  let sim: CasinoSimulator;

  beforeEach(() => {
    sim = new CasinoSimulator();
  });

  it('places a private bet and only stores a commitment publicly', () => {
    const roundId = sim.placeBet(sk(), 0, 4, 100n, salt());
    const pub = sim.publicLedgerView(roundId)!;

    expect(roundId).toBe(1n);
    expect(pub.status).toBe(RoundStatus.OPEN);
    expect(pub.gameType).toBe(0);
    expect(pub.betCommit).toBeTruthy();
    expect(pub.outcome).toBe(0);
    expect(pub.payout).toBe(0n);
    // Public view has no raw choice/amount fields
    expect(Object.keys(pub)).not.toContain('choice');
    expect(Object.keys(pub)).not.toContain('amount');
  });

  it('rejects invalid game type / choice / amount', () => {
    expect(() => sim.placeBet(sk(), 4, 1, 1n, salt())).toThrow('invalid game type');
    expect(() => sim.placeBet(sk(), 0, 8, 1n, salt())).toThrow('choice out of range');
    expect(() => sim.placeBet(sk(), 0, 1, 0n, salt())).toThrow('amount must be positive');
  });

  it('settles a winning wheel round with 2x payout', () => {
    const roundId = sim.placeBet(sk(), 0, 3, 50n, salt());
    const settled = sim.settleWheel(roundId, sk(), 3, 50n, salt(), 3);
    expect(settled.won).toBe(true);
    expect(settled.payout).toBe(100n);
    expect(settled.status).toBe(RoundStatus.SETTLED);
    expect(settled.outcome).toBe(3);
  });

  it('settles a losing wheel round with zero payout', () => {
    const roundId = sim.placeBet(sk(), 0, 1, 50n, salt());
    const settled = sim.settleWheel(roundId, sk(), 1, 50n, salt(), 5);
    expect(settled.won).toBe(false);
    expect(settled.payout).toBe(0n);
  });

  it('rejects settlement by non-owner', () => {
    const roundId = sim.placeBet(sk(), 0, 2, 10n, salt());
    expect(() => sim.settleWheel(roundId, otherSk(), 2, 10n, salt(), 2)).toThrow(
      'not round owner',
    );
  });

  it('rejects tampered bet reveal (commitment mismatch)', () => {
    const roundId = sim.placeBet(sk(), 0, 2, 10n, salt());
    expect(() => sim.settleWheel(roundId, sk(), 2, 99n, salt(), 2)).toThrow(
      'bet commitment mismatch',
    );
  });

  it('verifies ownership via secret key commitment', () => {
    const roundId = sim.placeBet(sk(), 0, 0, 1n, salt());
    expect(sim.verifyRoundOwnership(roundId, sk())).toBe(true);
    expect(sim.verifyRoundOwnership(roundId, otherSk())).toBe(false);
  });

  it('supports house seed commit-reveal bookkeeping', () => {
    sim.commitHouseSeed('abc123');
    expect(sim.houseSeedCommit).toBe('abc123');
  });

  it('keeps different players’ ownership commitments distinct', () => {
    const a = sim.placeBet(sk(), 0, 1, 5n, salt());
    const b = sim.placeBet(otherSk(), 0, 1, 5n, salt());
    expect(sim.publicLedgerView(a)!.ownerHash).not.toBe(
      sim.publicLedgerView(b)!.ownerHash,
    );
  });
});
