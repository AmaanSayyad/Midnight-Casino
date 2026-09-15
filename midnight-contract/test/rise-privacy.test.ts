/**
 * Rise In L3 privacy gates (sealed-bid style assertions).
 * Runs with the main midnight-contract Vitest suite.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CasinoSimulator, RoundStatus } from './casino-simulator.js';

const sk = () => new Uint8Array(32).fill(7);
const otherSk = () => new Uint8Array(32).fill(9);
const salt = () => new Uint8Array(32).fill(3);

describe('Rise In — sealed-bid privacy gates', () => {
  let sim: CasinoSimulator;

  beforeEach(() => {
    sim = new CasinoSimulator();
  });

  it('circuit logic: placeBet stores commitment only (no raw choice/amount)', () => {
    const roundId = sim.placeBet(sk(), 0, 4, 100n, salt());
    const pub = sim.publicLedgerView(roundId)!;
    expect(pub.betCommit).toBeTruthy();
    expect(Object.keys(pub)).not.toContain('choice');
    expect(Object.keys(pub)).not.toContain('amount');
    expect(Object.keys(pub)).not.toContain('secretKey');
  });

  it('state transition: OPEN → SETTLED with payout', () => {
    const roundId = sim.placeBet(sk(), 0, 3, 50n, salt());
    expect(sim.publicLedgerView(roundId)!.status).toBe(RoundStatus.OPEN);
    const settled = sim.settleWheel(roundId, sk(), 3, 50n, salt(), 3);
    expect(settled.status).toBe(RoundStatus.SETTLED);
    expect(settled.won).toBe(true);
    expect(settled.payout).toBe(100n);
  });

  it('privacy: private inputs never exposed on public ledger view', () => {
    const roundId = sim.placeBet(sk(), 0, 2, 10n, salt());
    const pub = sim.publicLedgerView(roundId)!;
    expect(Object.keys(pub)).not.toContain('choice');
    expect(Object.keys(pub)).not.toContain('amount');
    expect(Object.keys(pub)).not.toContain('secretKey');
    const serialized = JSON.stringify(pub, (_k, v) =>
      typeof v === 'bigint' ? v.toString() : v,
    );
    expect(serialized).not.toMatch(/"choice"/);
    expect(serialized).not.toMatch(/"amount"/);
    expect(serialized).not.toContain('secretKey');
  });

  it('rejects non-owner settlement (ownership proof)', () => {
    const roundId = sim.placeBet(sk(), 0, 2, 10n, salt());
    expect(() => sim.settleWheel(roundId, otherSk(), 2, 10n, salt(), 2)).toThrow(
      'not round owner',
    );
  });
});
