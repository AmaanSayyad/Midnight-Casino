/**
 * Platform-agnostic Casino Compact API (Lace browser or CLI providers).
 * Apache-2.0
 */

import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type Logger } from 'pino';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { map, type Observable } from 'rxjs';
import * as Casino from '../midnight-contract/managed/casino/contract/index.js';
import {
  CompiledCasinoContract,
  createCasinoPrivateState,
  setBetInputs,
  type CasinoPrivateState,
} from '../midnight-contract/src/index.js';
import {
  casinoPrivateStateKey,
  type CasinoDerivedState,
  type CasinoProviders,
  type CasinoRoundView,
  type DeployedCasinoContract,
} from './common-types.js';

function bytesToHex(bytes: Uint8Array | { toString(): string }): string {
  if (bytes instanceof Uint8Array) {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return String(bytes);
}

export class CasinoAPI {
  private constructor(
    public readonly deployedContract: DeployedCasinoContract,
    private readonly providers: CasinoProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    providers.privateStateProvider.setContractAddress(this.deployedContractAddress);

    this.state$ = providers.publicDataProvider
      .contractStateObservable(this.deployedContractAddress, { type: 'latest' })
      .pipe(
        map((contractState) => Casino.ledger(contractState.data)),
        map((ledgerState): CasinoDerivedState => {
          const rounds: CasinoRoundView[] = [];
          for (const [key, round] of ledgerState.rounds) {
            rounds.push({
              roundId: String(key),
              gameType: Number(round.gameType),
              status: String(round.status),
              outcome: Number(round.outcome),
              payout: String(round.payout),
              won: Boolean(round.won),
              betCommit: bytesToHex(round.betCommit as Uint8Array),
            });
          }
          rounds.sort((a, b) => Number(b.roundId) - Number(a.roundId));
          return {
            totalRounds: Number(ledgerState.totalRounds),
            nextRoundId: Number(ledgerState.nextRoundId),
            rounds,
          };
        }),
      );
  }

  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<CasinoDerivedState>;

  private async getPrivateState(): Promise<CasinoPrivateState> {
    const existing = await this.providers.privateStateProvider.get(casinoPrivateStateKey);
    if (existing) return existing;
    throw new Error('Casino private state missing — reconnect wallet and re-join contract.');
  }

  private async savePrivateState(state: CasinoPrivateState): Promise<void> {
    await this.providers.privateStateProvider.set(casinoPrivateStateKey, state);
  }

  /** Place a private bet (choice/amount stay in local private state). */
  async placeBet(gameType: number, choice: number, amount: bigint): Promise<void> {
    const current = await this.getPrivateState();
    const salt = crypto.getRandomValues(new Uint8Array(32));
    await this.savePrivateState(setBetInputs(current, choice, amount, salt));
    this.logger?.info({ gameType, choice }, 'placeBet');
    await (this.deployedContract as any).callTx.placeBet(BigInt(gameType));
  }

  async commitHouseSeed(commit: Uint8Array): Promise<void> {
    await (this.deployedContract as any).callTx.commitHouseSeed(commit);
  }

  async settleWheel(roundId: bigint, houseOutcome: number): Promise<void> {
    this.logger?.info({ roundId: String(roundId), houseOutcome }, 'settleWheel');
    await (this.deployedContract as any).callTx.settleWheel(roundId, BigInt(houseOutcome));
  }

  async verifyRoundOwnership(roundId: bigint): Promise<void> {
    await (this.deployedContract as any).callTx.verifyRoundOwnership(roundId);
  }

  static async deploy(
    providers: CasinoProviders,
    secretKey: Uint8Array,
    logger?: Logger,
  ): Promise<CasinoAPI> {
    const deployedContract = await deployContract(providers as any, {
      compiledContract: CompiledCasinoContract,
      privateStateId: casinoPrivateStateKey,
      initialPrivateState: createCasinoPrivateState(secretKey),
    });
    return new CasinoAPI(deployedContract, providers, logger);
  }

  static async join(
    providers: CasinoProviders,
    contractAddress: ContractAddress,
    secretKey: Uint8Array,
    logger?: Logger,
  ): Promise<CasinoAPI> {
    const deployedContract = await findDeployedContract(providers as any, {
      contractAddress,
      compiledContract: CompiledCasinoContract,
      privateStateId: casinoPrivateStateKey,
      initialPrivateState: createCasinoPrivateState(secretKey),
    });
    return new CasinoAPI(deployedContract, providers, logger);
  }
}

export * from './common-types.js';
