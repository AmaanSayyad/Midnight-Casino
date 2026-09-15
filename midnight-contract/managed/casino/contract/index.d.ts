import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  localSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  getBetChoice(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  getBetAmount(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  getBetSalt(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  placeBet(context: __compactRuntime.CircuitContext<PS>, gameType_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  commitHouseSeed(context: __compactRuntime.CircuitContext<PS>,
                  commit_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  settleWheel(context: __compactRuntime.CircuitContext<PS>,
              roundId_0: bigint,
              houseOutcome_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  verifyRoundOwnership(context: __compactRuntime.CircuitContext<PS>,
                       roundId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  placeBet(context: __compactRuntime.CircuitContext<PS>, gameType_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  commitHouseSeed(context: __compactRuntime.CircuitContext<PS>,
                  commit_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  settleWheel(context: __compactRuntime.CircuitContext<PS>,
              roundId_0: bigint,
              houseOutcome_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  verifyRoundOwnership(context: __compactRuntime.CircuitContext<PS>,
                       roundId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  ownerCommitment(sk_0: Uint8Array): Uint8Array;
  betCommitment(choice_0: bigint, amount_0: bigint, salt_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  ownerCommitment(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  betCommitment(context: __compactRuntime.CircuitContext<PS>,
                choice_0: bigint,
                amount_0: bigint,
                salt_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  placeBet(context: __compactRuntime.CircuitContext<PS>, gameType_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  commitHouseSeed(context: __compactRuntime.CircuitContext<PS>,
                  commit_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  settleWheel(context: __compactRuntime.CircuitContext<PS>,
              roundId_0: bigint,
              houseOutcome_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  verifyRoundOwnership(context: __compactRuntime.CircuitContext<PS>,
                       roundId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  rounds: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): { ownerHash: Uint8Array,
                             gameType: bigint,
                             betCommit: Uint8Array,
                             status: number,
                             outcome: bigint,
                             payout: bigint,
                             won: boolean
                           };
    [Symbol.iterator](): Iterator<[bigint, { ownerHash: Uint8Array,
  gameType: bigint,
  betCommit: Uint8Array,
  status: number,
  outcome: bigint,
  payout: bigint,
  won: boolean
}]>
  };
  readonly nextRoundId: bigint;
  readonly totalRounds: bigint;
  readonly houseSeedCommit: Uint8Array;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
