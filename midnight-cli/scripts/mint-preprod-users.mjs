/**
 * L5 helper: mint Preprod wallets + fund them from a funder seed.
 *
 * Generate (no secrets needed):
 *   node scripts/mint-preprod-users.mjs --generate [--count 50]
 *
 * Fund (needs proof server + funded seed in env):
 *   export PATH=…; npm run proof:up
 *   MIDNIGHT_FUNDER_SEED=<64-hex> node scripts/mint-preprod-users.mjs --fund [--amount 0.1]
 *
 * Env fallbacks for funder: MIDNIGHT_FUNDER_SEED → MIDNIGHT_PREPROD_SEED → MIDNIGHT_TREASURY_SEED
 * Loaded from repo .env.preprod / .env.local / .env (never commit seeds).
 *
 * Outputs:
 *   .l5-wallets.secrets.json  (gitignored — seeds)
 *   docs/l5-wallets.public.csv (addresses only)
 *   Updates USERS.md wallet column placeholders
 *
 * Apache-2.0
 */

import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket } from 'ws';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js/network-id';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { unshieldedToken } from '@midnight-ntwrk/ledger-v8';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { HDWallet, Roles, generateRandomSeed } from '@midnight-ntwrk/wallet-sdk-hd';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import {
  createKeystore,
  PublicKey,
  UnshieldedWallet,
  InMemoryTransactionHistoryStorage,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { toHex } from '@midnight-ntwrk/midnight-js/utils';
import * as Rx from 'rxjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliRoot = resolve(__dirname, '..');
const repoRoot = resolve(cliRoot, '..');
const secretsPath = resolve(repoRoot, '.l5-wallets.secrets.json');
const publicCsvPath = resolve(repoRoot, 'docs', 'l5-wallets.public.csv');
const usersPath = resolve(repoRoot, 'USERS.md');

globalThis.WebSocket = WebSocket;

function loadEnv() {
  for (const f of ['.env.preprod', '.env.local', '.env']) {
    const p = resolve(repoRoot, f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      if (!process.env[m[1]]) {
        process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
      }
    }
  }
}

function parseArgs(argv) {
  const out = {
    generate: false,
    fund: false,
    count: 50,
    amount: '0.1',
    start: 0,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--generate') out.generate = true;
    else if (a === '--fund') out.fund = true;
    else if (a === '--count') out.count = Number(argv[++i]);
    else if (a === '--amount') out.amount = argv[++i];
    else if (a === '--start') out.start = Number(argv[++i]);
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
  if (hdWallet.type !== 'seedOk') throw new Error('Invalid seed');
  const derivationResult = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  if (derivationResult.type !== 'keysDerived') throw new Error('Key derivation failed');
  hdWallet.hdWallet.clear();
  return derivationResult.keys;
}

function addressFromSeed(seedHex, networkId) {
  const keys = deriveKeys(seedHex);
  const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], networkId);
  return unshieldedKeystore.getBech32Address().toString();
}

function writePublicArtifacts(wallets) {
  const header = 'index,unshielded_address,network\n';
  const rows = wallets
    .map((w) => `${w.index},${w.unshieldedAddress},${w.network}`)
    .join('\n');
  writeFileSync(publicCsvPath, header + rows + '\n');

  // Patch USERS.md wallet column for rows 1..N (leave Name/Email/Feedback blank)
  if (!existsSync(usersPath)) return;
  let md = readFileSync(usersPath, 'utf8');
  for (const w of wallets) {
    const re = new RegExp(
      `\\| ${w.index} \\|[^|]*\\|[^|]*\\|[^|]*\\|[^|]*\\|`,
    );
    if (!re.test(md)) {
      console.warn(`USERS.md: no row match for #${w.index}`);
      continue;
    }
    md = md.replace(
      re,
      `| ${w.index} | | | \`${w.unshieldedAddress}\` | |`,
    );
  }
  md = md.replace(
    /\*\*Current count:\*\* \d+ \/ 50/,
    `**Current count:** ${wallets.length} / 50 (addresses minted — name/email/feedback pending)`,
  );
  writeFileSync(usersPath, md);
  console.log(`Updated ${usersPath} and ${publicCsvPath}`);
}

function generateWallets(count) {
  setNetworkId('preprod');
  const network = getNetworkId();
  const wallets = [];
  for (let i = 1; i <= count; i++) {
    const seed = toHex(Buffer.from(generateRandomSeed()));
    const unshieldedAddress = addressFromSeed(seed, network);
    wallets.push({
      index: i,
      seed,
      unshieldedAddress,
      network,
      createdAt: new Date().toISOString(),
    });
    console.log(`[${i}/${count}] ${unshieldedAddress}`);
  }
  writeFileSync(
    secretsPath,
    JSON.stringify(
      {
        network: 'preprod',
        createdAt: new Date().toISOString(),
        note: 'PRIVATE — do not commit. Seeds for L5 minted wallets.',
        wallets: wallets.map(({ index, seed, unshieldedAddress, network, createdAt }) => ({
          index,
          seed,
          unshieldedAddress,
          network,
          createdAt,
        })),
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  writePublicArtifacts(
    wallets.map(({ index, unshieldedAddress, network }) => ({
      index,
      unshieldedAddress,
      network,
    })),
  );
  console.log(`\nWrote secrets → ${secretsPath} (gitignored)`);
  console.log(`Public addresses → ${publicCsvPath}`);
}

async function buildFunderWallet(seed, proofServer) {
  setNetworkId('preprod');
  const networkId = getNetworkId();
  const indexer = 'https://indexer.preprod.midnight.network/api/v4/graphql';
  const indexerWS = 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws';
  const node = 'https://rpc.preprod.midnight.network';

  const keys = deriveKeys(seed);
  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], networkId);
  const funderAddr = unshieldedKeystore.getBech32Address().toString();

  const walletConfig = {
    networkId,
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
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
  };

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

  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore, funderAddr };
}

async function waitSynced(wallet, minNight) {
  return Promise.race([
    Rx.firstValueFrom(
      wallet.state().pipe(
        Rx.throttleTime(2_000),
        Rx.filter((s) => {
          if (s.isSynced) return true;
          const night = s.unshielded?.balances?.[unshieldedToken().raw] ?? 0n;
          const coins = s.unshielded?.availableCoins?.length ?? 0;
          return night >= minNight && coins > 0;
        }),
      ),
    ),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Funder sync timed out (4 min). Check Preprod indexer + funds.')),
        240_000,
      ),
    ),
  ]);
}

async function ensureDust(wallet, unshieldedKeystore) {
  const state = await Rx.firstValueFrom(wallet.state());
  let dust = state.dust?.balance?.(new Date()) ?? 0n;
  if (dust > 0n) return dust;

  const nightUtxos = (state.unshielded?.availableCoins || []).filter(
    (coin) => coin.meta?.registeredForDustGeneration !== true,
  );
  if (nightUtxos.length > 0) {
    console.log(`Registering ${nightUtxos.length} UTXO(s) for DUST…`);
    try {
      const recipe = await wallet.registerNightUtxosForDustGeneration(
        nightUtxos,
        unshieldedKeystore.getPublicKey(),
        (payload) => unshieldedKeystore.signData(payload),
      );
      const finalized = await wallet.finalizeRecipe(recipe);
      await wallet.submitTransaction(finalized);
    } catch (e) {
      console.warn('DUST register failed:', e?.message || e);
    }
  }

  try {
    dust = await Promise.race([
      Rx.firstValueFrom(
        wallet.state().pipe(
          Rx.throttleTime(3_000),
          Rx.map((s) => s.dust.balance(new Date())),
          Rx.filter((d) => d > 0n),
        ),
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DUST still 0 after 90s')), 90_000),
      ),
    ]);
  } catch (e) {
    throw new Error(
      `${e.message}. Import funder seed into 1AM, Generate tDUST, then retry --fund.`,
    );
  }
  return dust;
}

async function transferOnce(ctx, to, value) {
  const { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore } = ctx;
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
  return typeof txId === 'string' ? txId : String(txId ?? '');
}

async function fundWallets(opts) {
  loadEnv();
  const seed =
    process.env.MIDNIGHT_FUNDER_SEED ||
    process.env.MIDNIGHT_PREPROD_SEED ||
    process.env.MIDNIGHT_TREASURY_SEED;
  if (!seed || !/^[0-9a-fA-F]{64}$/.test(seed)) {
    throw new Error(
      'Set MIDNIGHT_FUNDER_SEED (64-hex) in .env.preprod — do not paste the seed in chat.',
    );
  }
  if (!existsSync(secretsPath) && !existsSync(publicCsvPath)) {
    throw new Error('Run --generate first');
  }

  const proofServer =
    process.env.PROOF_SERVER_URL ||
    process.env.MIDNIGHT_PROOF_SERVER ||
    'http://127.0.0.1:6300';

  let recipients = [];
  if (existsSync(publicCsvPath)) {
    const lines = readFileSync(publicCsvPath, 'utf8').trim().split('\n').slice(1);
    recipients = lines
      .map((line) => {
        const [index, unshieldedAddress] = line.split(',');
        return { index: Number(index), unshieldedAddress };
      })
      .filter((r) => r.unshieldedAddress);
  }

  const value = parseAmountToAtomic(opts.amount);
  const need = value * BigInt(recipients.length);
  console.log(
    `Funding ${recipients.length} wallets with ${opts.amount} tNIGHT each (need ≥ ${Number(need) / 1e6} + fees)`,
  );
  console.log(`Proof server: ${proofServer}`);

  const ctx = await buildFunderWallet(seed.toLowerCase(), proofServer);
  console.log(`Funder: ${ctx.funderAddr}`);

  try {
    console.log('Syncing funder…');
    const synced = await waitSynced(ctx.wallet, value);
    const bal = synced.unshielded.balances[unshieldedToken().raw] ?? 0n;
    console.log(`Funder balance: ${Number(bal) / 1e6} tNIGHT`);
    if (bal < need) {
      throw new Error(
        `Insufficient funder balance (have ${Number(bal) / 1e6}, need ~${Number(need) / 1e6}). Top up faucet then retry.`,
      );
    }
    await ensureDust(ctx.wallet, ctx.unshieldedKeystore);

    const results = [];
    for (let i = opts.start; i < recipients.length; i++) {
      const r = recipients[i];
      process.stdout.write(`[${i + 1}/${recipients.length}] → ${r.unshieldedAddress.slice(0, 28)}… `);
      try {
        const txId = await transferOnce(ctx, r.unshieldedAddress, value);
        console.log(`ok ${txId}`);
        results.push({ ...r, txId, amount: opts.amount, ok: true });
        // brief pause between txs
        await new Promise((r) => setTimeout(r, 2000));
      } catch (e) {
        console.log(`FAIL ${e?.message || e}`);
        results.push({ ...r, error: e?.message || String(e), ok: false });
        // stop on first hard failure so user can fix DUST/funds
        break;
      }
    }

    const out = resolve(repoRoot, 'docs', 'l5-fund-results.json');
    writeFileSync(out, JSON.stringify({ fundedAt: new Date().toISOString(), results }, null, 2));
    console.log(`\nResults → ${out}`);
    console.log(`OK: ${results.filter((x) => x.ok).length} / ${recipients.length}`);
  } finally {
    try {
      await ctx.wallet.stop();
    } catch {
      /* ignore */
    }
  }
}

async function main() {
  const opts = parseArgs(process.argv);
  if (!opts.generate && !opts.fund) {
    console.log(`Usage:
  node scripts/mint-preprod-users.mjs --generate [--count 50]
  MIDNIGHT_FUNDER_SEED=<64-hex> node scripts/mint-preprod-users.mjs --fund [--amount 0.1] [--start 0]
`);
    process.exit(1);
  }
  if (opts.generate) generateWallets(opts.count);
  if (opts.fund) await fundWallets(opts);
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
