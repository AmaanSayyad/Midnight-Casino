/**
 * Headless Midnight Casino E2E (no Lace).
 * Spins up local node/indexer/proof-server via testcontainers,
 * funds genesis wallet, deploys casino.compact, placeBet → commit → settle.
 * Apache-2.0
 */

import path from 'path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as api from '../api';
import { type CasinoProviders } from '../common-types';
import { currentDir } from '../config';
import { createLogger } from '../logger-utils';
import { TestEnvironment } from './commons';
import type { WalletContext } from '../api';

const logDir = path.resolve(currentDir, '..', 'logs', 'tests', `${new Date().toISOString()}.log`);
const logger = await createLogger(logDir);

/** Local-only secret for circuit ownership — not a Lace seed. */
const PLAYER_SECRET = new Uint8Array(32).fill(7);

describe('Casino API (headless local Midnight)', () => {
  let testEnvironment: TestEnvironment;
  let walletCtx: WalletContext;
  let providers: CasinoProviders;

  beforeAll(
    async () => {
      api.setLogger(logger);
      testEnvironment = new TestEnvironment(logger);
      const testConfiguration = await testEnvironment.start();
      walletCtx = await testEnvironment.getWallet();
      providers = await api.configureProviders(walletCtx, testConfiguration.dappConfig);
    },
    1000 * 60 * 45,
  );

  afterAll(async () => {
    await testEnvironment.shutdown();
  });

  it('deploys casino, places private bet, commits house seed, settles WIN [@slow]', async () => {
    const casino = await api.deploy(providers, PLAYER_SECRET);
    expect(casino).not.toBeNull();
    const address = casino.deployTxData.public.contractAddress;
    logger.info(`Deployed at ${address}`);

    const choice = 3;
    const amount = 25n;
    const placeTx = await api.placeBet(providers, casino, 0, choice, amount);
    expect(placeTx.txId).toMatch(/[0-9a-f]{64}/i);
    expect(placeTx.blockHeight).toBeGreaterThan(0n);

    await new Promise((r) => setTimeout(r, 2000));
    let ledger = await api.getCasinoLedgerState(providers, address);
    expect(ledger).not.toBeNull();
    expect(ledger!.totalRounds).toEqual(1n);
    expect(ledger!.nextRoundId).toEqual(1n);
    expect(ledger!.rounds.member(1n)).toBe(true);
    expect(ledger!.rounds.lookup(1n).status).toBe(0); // OPEN
    expect(Number(ledger!.rounds.lookup(1n).gameType)).toBe(0);

    const houseCommit = crypto.getRandomValues(new Uint8Array(32));
    const commitTx = await api.commitHouseSeed(casino, houseCommit);
    expect(commitTx.txId).toMatch(/[0-9a-f]{64}/i);

    await new Promise((r) => setTimeout(r, 2000));
    const settleTx = await api.settleWheel(casino, 1n, choice); // match choice → WIN
    expect(settleTx.txId).toMatch(/[0-9a-f]{64}/i);
    expect(settleTx.blockHeight).toBeGreaterThan(0n);

    await new Promise((r) => setTimeout(r, 2000));
    ledger = await api.getCasinoLedgerState(providers, address);
    expect(ledger).not.toBeNull();
    const round = ledger!.rounds.lookup(1n);
    expect(round.status).toBe(1); // SETTLED
    expect(round.won).toBe(true);
    expect(round.payout).toEqual(50n); // 2x amount
    expect(Number(round.outcome)).toBe(choice);
  });
});
