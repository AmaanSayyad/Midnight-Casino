/**
 * Browser-side CompiledContract binding.
 * Built in the dapp so Vite keeps a single compact-js module instance (Symbol TypeId).
 * Apache-2.0
 */
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import * as CasinoContract from '../../midnight-contract/managed/casino/contract/index.js';
import {
  createWitnesses,
  createCasinoPrivateState,
  setBetInputs,
  type CasinoPrivateState,
} from '../../midnight-contract/src/witnesses.js';

if (typeof CasinoContract.Contract !== 'function') {
  throw new Error('Casino Contract constructor missing from managed output');
}

/** ZK assets are served from Vite public/ (keys + zkir) via FetchZkConfigProvider(origin). */
export const CompiledCasinoContract = CompiledContract.make(
  'casino',
  CasinoContract.Contract,
).pipe(
  CompiledContract.withWitnesses(createWitnesses()),
  // Relative to FetchZkConfigProvider base URL (window.location.origin)
  CompiledContract.withCompiledFileAssets('.'),
);

export { createCasinoPrivateState, setBetInputs };
export type { CasinoPrivateState };
export { CasinoContract };
