/**
 * Browser Lace + Midnight.js provider bridge for Casino Compact.
 * Apache-2.0 — patterned on midnightntwrk/midnight-leaderboard.
 */

import {
  BehaviorSubject,
  catchError,
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  type Observable,
  take,
  throwError,
  timeout,
} from 'rxjs';
import { pipe as fnPipe } from 'fp-ts/function';
import { type Logger } from 'pino';
import { type ConnectedAPI, type InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import semver from 'semver';
import {
  Binding,
  type FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
  type TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { type ContractAddress, fromHex, toHex } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type NetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import {
  CasinoAPI,
  type CasinoCircuitKeys,
  type CasinoProviders,
} from './casino-api';
import { inMemoryPrivateStateProvider } from './in-memory-private-state-provider';
import type { CasinoPrivateState } from '../../midnight-contract/src/index';

export type CasinoDeployment =
  | { readonly status: 'in-progress' }
  | { readonly status: 'deployed'; readonly api: CasinoAPI }
  | { readonly status: 'failed'; readonly error: Error };

const COMPATIBLE_CONNECTOR_API_VERSION = '4.x';

export class BrowserCasinoManager {
  readonly #deploymentsSubject = new BehaviorSubject<
    Array<BehaviorSubject<CasinoDeployment>>
  >([]);
  #initializedProviders: Promise<CasinoProviders> | undefined;

  constructor(private readonly logger: Logger) {}

  resolve(contractAddress?: ContractAddress): Observable<CasinoDeployment> {
    const deployments = this.#deploymentsSubject.value;
    const existing = deployments.find(
      (d) =>
        d.value.status === 'deployed' &&
        d.value.api.deployedContractAddress === contractAddress,
    );
    if (existing) return existing;

    const secretKey = this.getSecretKey();
    const deployment = new BehaviorSubject<CasinoDeployment>({
      status: 'in-progress',
    });
    if (contractAddress) {
      void this.run(deployment, (providers) =>
        CasinoAPI.join(providers, contractAddress, secretKey, this.logger),
      );
    } else {
      void this.run(deployment, (providers) =>
        CasinoAPI.deploy(providers, secretKey, this.logger),
      );
    }
    this.#deploymentsSubject.next([...deployments, deployment]);
    return deployment;
  }

  private getSecretKey(): Uint8Array {
    const storageKey = 'midnight-casino-secret';
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
    }
    const secret = crypto.getRandomValues(new Uint8Array(32));
    localStorage.setItem(storageKey, btoa(String.fromCharCode(...secret)));
    return secret;
  }

  private getProviders(): Promise<CasinoProviders> {
    return (
      this.#initializedProviders ??
      (this.#initializedProviders = initializeProviders(this.logger))
    );
  }

  private async run(
    deployment: BehaviorSubject<CasinoDeployment>,
    factory: (providers: CasinoProviders) => Promise<CasinoAPI>,
  ): Promise<void> {
    try {
      const providers = await this.getProviders();
      const api = await factory(providers);
      deployment.next({ status: 'deployed', api });
    } catch (error: unknown) {
      console.error('Casino contract operation failed:', error);
      const err =
        error instanceof Error
          ? error
          : new Error(JSON.stringify(error) || 'Unknown contract error');
      deployment.next({ status: 'failed', error: err });
    }
  }
}

const initializeProviders = async (logger: Logger): Promise<CasinoProviders> => {
  const networkId = (import.meta.env.VITE_NETWORK_ID ?? 'preview') as NetworkId;
  setNetworkId(networkId);

  const connectedAPI = await connectToWallet(logger, networkId);
  const config = await connectedAPI.getConfiguration();
  const proofServerUri = config.proverServerUri;
  if (!proofServerUri) {
    throw new Error(
      'Wallet did not return a proof server URI. Start a local proof server (npm run proof:up) and set it in 1AM settings.',
    );
  }
  const shieldedAddresses = await connectedAPI.getShieldedAddresses();
  const zkConfigProvider = new FetchZkConfigProvider<CasinoCircuitKeys>(
    window.location.origin,
    fetch.bind(window),
  );

  return {
    privateStateProvider: inMemoryPrivateStateProvider<
      string,
      CasinoPrivateState
    >(),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(proofServerUri, zkConfigProvider),
    publicDataProvider: indexerPublicDataProvider(
      config.indexerUri,
      config.indexerWsUri,
    ),
    walletProvider: {
      getCoinPublicKey: () => shieldedAddresses.shieldedCoinPublicKey,
      getEncryptionPublicKey: () => shieldedAddresses.shieldedEncryptionPublicKey,
      balanceTx: async (tx: UnboundTransaction): Promise<FinalizedTransaction> => {
        const received = await connectedAPI.balanceUnsealedTransaction(
          toHex(tx.serialize()),
        );
        return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
          'signature',
          'proof',
          'binding',
          fromHex(received.tx),
        );
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        await connectedAPI.submitTransaction(toHex(tx.serialize()));
        return tx.identifiers()[0];
      },
    },
  };
};

const PREFERRED_WALLET_HINTS = ['1am', '1 am', 'webisoft'];

const scoreWallet = (wallet: InitialAPI): number => {
  const blob = `${(wallet as any).name || ''} ${(wallet as any).rdns || ''}`.toLowerCase();
  if (PREFERRED_WALLET_HINTS.some((h) => blob.includes(h))) return 200;
  if (blob.includes('lace')) return 80;
  if (blob.includes('midnight')) return 50;
  return 10;
};

const getFirstCompatibleWallet = (): InitialAPI | undefined => {
  if (!window.midnight) return undefined;
  const wallets = Object.values(window.midnight).filter(
    (wallet): wallet is InitialAPI =>
      !!wallet &&
      typeof wallet === 'object' &&
      'apiVersion' in wallet &&
      semver.satisfies((wallet as InitialAPI).apiVersion, COMPATIBLE_CONNECTOR_API_VERSION),
  );
  if (!wallets.length) return undefined;
  return [...wallets].sort((a, b) => scoreWallet(b) - scoreWallet(a))[0];
};

export const findMidnightWallet = getFirstCompatibleWallet;

export const connectMidnightWallet = async (
  networkId: string,
): Promise<{ api: ConnectedAPI; unshieldedAddress: string }> => {
  const initial = getFirstCompatibleWallet();
  if (!initial) {
    throw new Error('No Midnight wallet found. Install 1AM (https://1am.xyz/) and refresh.');
  }
  const api = await initial.connect(networkId);
  const { unshieldedAddress } = await api.getUnshieldedAddress();
  return { api, unshieldedAddress };
};

const connectToWallet = (logger: Logger, networkId: string): Promise<ConnectedAPI> =>
  firstValueFrom(
    fnPipe(
      interval(100),
      map(() => getFirstCompatibleWallet()),
      filter((api): api is InitialAPI => !!api),
      take(1),
      timeout({
        first: 5_000,
        with: () =>
          throwError(() => new Error('Could not find Midnight wallet (1AM preferred).')),
      }),
      concatMap(async (initialAPI) => {
        logger.info({ networkId, wallet: (initialAPI as any).name }, 'Connecting Midnight wallet');
        return initialAPI.connect(networkId);
      }),
      timeout({
        first: 120_000,
        with: () =>
          throwError(() => new Error('Wallet failed to respond / was rejected.')),
      }),
      catchError((error) =>
        throwError(() =>
          error instanceof Error ? error : new Error('Wallet not authorized'),
        ),
      ),
    ),
  );
