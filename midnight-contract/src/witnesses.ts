/**
 * Private state + Compact witnesses for Midnight Casino.
 * Secret key, bet choice, amount, and salt never leave the client.
 * Apache-2.0
 */

export type CasinoPrivateState = {
  readonly secretKey: Uint8Array;
  choice: number;
  amount: bigint;
  salt: Uint8Array;
};

export const createCasinoPrivateState = (
  secretKey: Uint8Array,
  choice = 0,
  amount = 1n,
  salt?: Uint8Array,
): CasinoPrivateState => ({
  secretKey,
  choice,
  amount,
  salt: salt ?? globalThis.crypto.getRandomValues(new Uint8Array(32)),
});

export const setBetInputs = (
  privateState: CasinoPrivateState,
  choice: number,
  amount: bigint,
  salt?: Uint8Array,
): CasinoPrivateState => ({
  ...privateState,
  choice,
  amount,
  salt: salt ?? privateState.salt,
});

export const createWitnesses = () => ({
  localSecretKey: ({
    privateState,
  }: {
    privateState: CasinoPrivateState;
  }): [CasinoPrivateState, Uint8Array] => [privateState, privateState.secretKey],

  getBetChoice: ({
    privateState,
  }: {
    privateState: CasinoPrivateState;
  }): [CasinoPrivateState, bigint] => [privateState, BigInt(privateState.choice)],

  getBetAmount: ({
    privateState,
  }: {
    privateState: CasinoPrivateState;
  }): [CasinoPrivateState, bigint] => [privateState, BigInt(privateState.amount)],

  getBetSalt: ({
    privateState,
  }: {
    privateState: CasinoPrivateState;
  }): [CasinoPrivateState, Uint8Array] => [privateState, privateState.salt],
});
