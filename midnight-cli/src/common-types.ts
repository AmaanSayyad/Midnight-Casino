/**
 * Casino CLI provider / circuit types.
 * Apache-2.0
 */

import type { MidnightProviders } from '@midnight-ntwrk/midnight-js/types';
import type { DeployedContract, FoundContract } from '@midnight-ntwrk/midnight-js/contracts';
import type { ProvableCircuitId } from '@midnight-ntwrk/compact-js';
import {
  Casino,
  type CasinoPrivateState,
} from '@midnight-casino/contract';

export type CasinoCircuits = ProvableCircuitId<Casino.Contract<CasinoPrivateState>>;

export const CasinoPrivateStateId = 'casinoPrivateState';

export type CasinoProviders = MidnightProviders<
  CasinoCircuits,
  typeof CasinoPrivateStateId,
  CasinoPrivateState
>;

export type CasinoContract = Casino.Contract<CasinoPrivateState>;

export type DeployedCasinoContract =
  | DeployedContract<CasinoContract>
  | FoundContract<CasinoContract>;
