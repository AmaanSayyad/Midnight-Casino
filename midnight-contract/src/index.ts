import { CompiledContract } from '@midnight-ntwrk/compact-js';

export * as Casino from '../managed/casino/contract/index.js';
export {
  createWitnesses,
  createCasinoPrivateState,
  setBetInputs,
} from './witnesses.js';
export type { CasinoPrivateState } from './witnesses.js';

import * as CasinoContract from '../managed/casino/contract/index.js';
import { createWitnesses } from './witnesses.js';

export const CompiledCasinoContract = CompiledContract.make(
  'casino',
  CasinoContract.Contract,
).pipe(
  CompiledContract.withWitnesses(createWitnesses()),
  CompiledContract.withCompiledFileAssets('./managed/casino'),
);
