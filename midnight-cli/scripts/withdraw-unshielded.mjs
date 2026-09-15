/**
 * Unshielded tNIGHT payout from house treasury seed → player mn_addr.
 * Invoked by /api/midnight-withdraw (cwd = midnight-cli).
 *
 *   node scripts/withdraw-unshielded.mjs --to mn_addr… --amount 0.1
 *
 * Apache-2.0
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket } from 'ws';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js/network-id';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { unshieldedToken } from '@midnight-ntwrk/ledger-v8';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import {
  createKeystore,
  PublicKey,
  UnshieldedWallet,
  InMemoryTransactionHistoryStorage,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import * as Rx from 'rxjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliRoot = resolve(__dirname, '..');
const repoRoot = resolve(cliRoot, '..');

globalThis.WebSocket = WebSocket;

function loadEnv() {
  for (const f of ['.env.local', '.env']) {
    const p = resolve(repoRoot, f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      if (!process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
}

function parseArgs(argv) {
  const out = { to: null, amount: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--to') out.to = argv[++i];
    else if (argv[i] === '--amount') out.amount = argv[++i];
  }
  return out;
}

function parseAmountToAtomic(human) {
  const s = String(human).trim();
  if (!/^\d+(\.\d+)?$/.test(s)) throw new Error(`Invalid amount: ${human}`);
  const [w, f = ''] = s.split('.');
  const frac = (f + '000000').slice(0, 6);
  return BigInt(w) * 1_000_000n + BigInt(frac);
}

function deriveKeys(seedHex) {
  const hdWallet = HDWallet.fromSeed(Buffer.from(seedHex, 'hex'));
  if (hdWallet.type !== 'seedOk') throw new Error('Invalid treasury seed');
  const derivationResult = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  if (derivationResult.type !== 'keysDerived') throw new Error('Key derivation failed');
  hdWallet.hdWallet.clear();
  return derivationResult.keys;
}

async function main() {
  loadEnv();
  const args = parseArgs(process.argv);
  const to = args.to || process.env.WITHDRAW_TO;
  const amountHuman = args.amount || process.env.WITHDRAW_AMOUNT;
  const seed = process.env.MIDNIGHT_TREASURY_SEED;
  const expectedTreasury =
    process.env.NEXT_PUBLIC_MIDNIGHT_TREASURY_UNSHIELDED ||
    process.env.MIDNIGHT_TREASURY_UNSHIELDED ||
    '';
  const networkId = process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK || 'preview';
  const proofServer =
    process.env.PROOF_SERVER_URL ||
    process.env.MIDNIGHT_PROOF_SERVER ||
    'http://127.0.0.1:6300';
  const indexer = `https://indexer.${networkId}.midnight.network/api/v3/graphql`;
  const indexerWS = `wss://indexer.${networkId}.midnight.network/api/v3/graphql/ws`;
  const node = `https://rpc.${networkId}.midnight.network`;

  if (!seed || seed.length < 32) {
    throw new Error('MIDNIGHT_TREASURY_SEED missing in .env.local');
  }
  if (!to || !/^mn_addr/i.test(to)) {
    throw new Error('Recipient must be mn_addr… (--to)');
  }
  if (!amountHuman) throw new Error('Amount required (--amount)');

  const value = parseAmountToAtomic(amountHuman);
  if (value <= 0n) throw new Error('Amount must be > 0');

  setNetworkId(networkId);
  const keys = deriveKeys(seed);
  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], getNetworkId());
  const treasuryAddr = unshieldedKeystore.getBech32Address().toString();

  if (expectedTreasury && treasuryAddr !== expectedTreasury) {
    throw new Error(
      `Treasury seed derives ${treasuryAddr} but env expects ${expectedTreasury}`,
    );
  }

  const walletConfig = {
    networkId: getNetworkId(),
    indexerClientConnection: {
      indexerHttpUrl: indexer,
      indexerWsUrl: indexerWS,
    },
    provingServerUrl: new URL(proofServer),
    relayURL: new URL(node.replace(/^http/, 'ws')),
    costParameters: {
      additionalFeeOverhead: 300_000_000_000_000n,
      feeBlocksMargin: 5,
    },
    // Required by unshielded sync (otherwise Sync.js crashes on txHistoryStorage.create)
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
  };

  console.error(JSON.stringify({ stage: 'init', treasuryAddr, to, amountHuman, proofServer }));

  const wallet = await WalletFacade.init({
    configuration: walletConfig,
    shielded: (cfg) => ShieldedWallet(cfg).startWithSecretKeys(shieldedSecretKeys),
    unshielded: (cfg) =>
      UnshieldedWallet(cfg).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
    dust: (cfg) =>
      DustWallet(cfg).startWithSecretKey(
        dustSecretKey,
        ledger.LedgerParameters.initialParameters().dust,
      ),
  });
  await wallet.start(shieldedSecretKeys, dustSecretKey);

  try {
    console.error(JSON.stringify({ stage: 'syncing' }));
    let lastLog = 0;
    const progressSub = wallet.state().subscribe((s) => {
      const now = Date.now();
      if (now - lastLog < 5000) return;
      lastLog = now;
      try {
        console.error(
          JSON.stringify({
            stage: 'sync_progress',
            synced: !!s.isSynced,
            night: String(s.unshielded?.balances?.[unshieldedToken().raw] ?? 0n),
            dust: String(s.dust?.balance?.(new Date()) ?? 0n),
            uCoins: s.unshielded?.availableCoins?.length ?? 0,
          }),
        );
      } catch {
        // ignore
      }
    });

    // Full isSynced can hang on Preview (shielded/dust/RPC). Proceed when
    // unshielded UTXOs are available with enough Night for the payout.
    const synced = await Promise.race([
      Rx.firstValueFrom(
        wallet.state().pipe(
          Rx.throttleTime(2_000),
          Rx.filter((s) => {
            if (s.isSynced) return true;
            const night = s.unshielded?.balances?.[unshieldedToken().raw] ?? 0n;
            const coins = s.unshielded?.availableCoins?.length ?? 0;
            return night >= value && coins > 0;
          }),
        ),
      ),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Treasury wallet sync timed out (3 min). Check indexer/rpc preview endpoints.',
              ),
            ),
          180_000,
        ),
      ),
    ]);
    progressSub.unsubscribe();

    const bal = synced.unshielded.balances[unshieldedToken().raw] ?? 0n;
    const dust = synced.dust.balance(new Date());
    console.error(
      JSON.stringify({
        stage: 'synced',
        nightAtomic: bal.toString(),
        dustAtomic: dust.toString(),
      }),
    );

    if (bal < value) {
      throw new Error(
        `Treasury has insufficient tNIGHT (have ${Number(bal) / 1e6}, need ${amountHuman})`,
      );
    }

    if (dust === 0n) {
      const nightUtxos = synced.unshielded.availableCoins.filter(
        (coin) => coin.meta?.registeredForDustGeneration !== true,
      );
      if (nightUtxos.length > 0) {
        console.error(JSON.stringify({ stage: 'register_dust', utxos: nightUtxos.length }));
        try {
          const recipe = await wallet.registerNightUtxosForDustGeneration(
            nightUtxos,
            unshieldedKeystore.getPublicKey(),
            (payload) => unshieldedKeystore.signData(payload),
          );
          const finalized = await wallet.finalizeRecipe(recipe);
          const regId = await wallet.submitTransaction(finalized);
          console.error(JSON.stringify({ stage: 'register_dust_submitted', regId: String(regId ?? '') }));
        } catch (regErr) {
          console.error(
            JSON.stringify({
              stage: 'register_dust_failed',
              error: regErr?.message || String(regErr),
            }),
          );
        }
      }

      // Short poll only — do not hang the UI for minutes
      console.error(JSON.stringify({ stage: 'wait_dust_brief' }));
      let dustNow = 0n;
      try {
        await Promise.race([
          Rx.firstValueFrom(
            wallet.state().pipe(
              Rx.throttleTime(3_000),
              Rx.map((s) => s.dust.balance(new Date())),
              Rx.tap((d) =>
                console.error(JSON.stringify({ stage: 'dust_progress', dustAtomic: String(d) })),
              ),
              Rx.filter((d) => d > 0n),
            ),
          ).then((d) => {
            dustNow = d;
          }),
          new Promise((resolve) => setTimeout(resolve, 25_000)),
        ]);
      } catch {
        // ignore
      }
      if (dustNow === 0n) {
        const latest = await Rx.firstValueFrom(wallet.state());
        dustNow = latest.dust?.balance?.(new Date()) ?? 0n;
      }
      if (dustNow === 0n) {
        throw new Error(
          'Treasury has tNIGHT but tDUST is still 0 (fees). Dust is generating — wait 2–5 minutes and retry Withdraw. Or import MIDNIGHT_TREASURY_SEED into 1AM → YOUR DUST once, then retry.',
        );
      }
    }

    console.error(JSON.stringify({ stage: 'transfer' }));
    const tokenType = unshieldedToken().raw;
    const finalizedTx = await wallet
      .transferTransaction(
        [
          {
            type: 'unshielded',
            outputs: [
              {
                amount: value,
                receiverAddress: to,
                type: tokenType,
              },
            ],
          },
        ],
        { shieldedSecretKeys, dustSecretKey },
        { ttl: new Date(Date.now() + 30 * 60 * 1000), payFees: true },
      )
      .then((recipe) =>
        wallet.signRecipe(recipe, (payload) => unshieldedKeystore.signData(payload)),
      )
      .then((recipe) => wallet.finalizeRecipe(recipe));

    const txId = await wallet.submitTransaction(finalizedTx);
    const result = {
      success: true,
      txId: typeof txId === 'string' ? txId : String(txId ?? ''),
      amount: amountHuman,
      recipient: to,
      treasury: treasuryAddr,
      networkId,
    };
    console.log(JSON.stringify(result));
  } finally {
    try {
      await wallet.stop();
    } catch {
      // ignore
    }
  }
}

main().catch((e) => {
  console.error(JSON.stringify({ success: false, error: e?.message || String(e) }));
  process.exit(1);
});

process.on('unhandledRejection', (e) => {
  const msg = e?.message || String(e);
  console.error(JSON.stringify({ success: false, error: msg }));
  process.exit(1);
});

process.on('uncaughtException', (e) => {
  const msg = e?.message || String(e);
  console.error(JSON.stringify({ success: false, error: msg }));
  process.exit(1);
});
