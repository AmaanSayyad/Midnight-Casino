/**
 * Casino API types for Midnight Compact integration.
 * Apache-2.0
 */

import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import { type CasinoPrivateState } from '../../midnight-contract/src/index.js';

export const casinoPrivateStateKey = 'casinoPrivateState';
export type PrivateStateId = typeof casinoPrivateStateKey;

export type CasinoCircuitKeys =
  | 'placeBet'
  | 'commitHouseSeed'
  | 'settleWheel'
  | 'verifyRoundOwnership';

export type CasinoProviders = MidnightProviders<
  CasinoCircuitKeys,
  PrivateStateId,
  CasinoPrivateState
>;

export type DeployedCasinoContract = FoundContract<any>;

export interface CasinoRoundView {
  readonly roundId: string;
  readonly gameType: number;
  readonly status: string;
  readonly outcome: number;
  readonly payout: string;
  readonly won: boolean;
  readonly betCommit: string;
}

export interface CasinoDerivedState {
  readonly totalRounds: number;
  readonly nextRoundId: number;
  readonly rounds: CasinoRoundView[];
}
