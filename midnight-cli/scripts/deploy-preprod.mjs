/**
 * Deploy casino.compact to Midnight Preprod (headless, no Lace).
 * Usage:
 *   MIDNIGHT_PREPROD_SEED=<64-hex> node scripts/deploy-preprod.mjs
 * Or omit seed to generate one (printed once; also written to ../.env.preprod).
 *
 * Requires: local proof server on :6300, funded Preprod wallet (tNIGHT + DUST).
 * Apache-2.0
 */

import { createRequire } from 'node:module';
import { randomBytes, createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket } from 'ws';

globalThis.WebSocket = WebSocket;

const require = createRequire(import.meta.url);
const protobuf = require('protobufjs');
const Long = require('long');
protobuf.util.Long = Long;
protobuf.configure();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const envPath = path.join(root, '.env.preprod');
const outPath = path.join(root, 'docs', 'PREPROD_DEPLOY.json');

function loadDotEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

loadDotEnv(envPath);
loadDotEnv(path.join(root, '.env'));

function ensureSeed() {
  let seed = process.env.MIDNIGHT_PREPROD_SEED || process.env.TEST_WALLET_SEED;
  if (seed && /^[0-9a-fA-F]{64}$/.test(seed)) return seed.toLowerCase();
  seed = randomBytes(32).toString('hex');
  const body = `MIDNIGHT_PREPROD_SEED=${seed}\n`;
  writeFileSync(envPath, body, { mode: 0o600 });
  console.log(`\nGenerated MIDNIGHT_PREPROD_SEED and wrote ${envPath}`);
  console.log('Save this seed offline — it will not be printed again after this run.\n');
  return seed;
}

const seed = ensureSeed();

const { PreprodConfig } = await import('../src/config.ts');
const api = await import('../src/api.ts');
const { createLogger } = await import('../src/logger-utils.ts');

const config = new PreprodConfig();
const logger = await createLogger(config.logDir);
api.setLogger(logger);

const PLAYER_SECRET = createHash('sha256').update(`casino-preprod:${seed}`).digest();

console.log('Proof server expected at', config.proofServer);
console.log('Indexer', config.indexer);

const walletCtx = await api.buildWalletAndWaitForFunds(config, seed);
const providers = await api.configureProviders(walletCtx, config);

const casino = await api.deploy(providers, PLAYER_SECRET);
const address = casino.deployTxData.public.contractAddress;
console.log('\n=== PREPROD CONTRACT ADDRESS ===');
console.log(address);
console.log('Explorer: https://preprod.midnightexplorer.com/');
console.log('================================\n');

let placeBetTxId = null;
try {
  const place = await api.placeBet(providers, casino, 0, 3, 10n);
  placeBetTxId = place.txId;
  console.log('placeBet ok:', placeBetTxId, 'block', String(place.blockHeight));
} catch (e) {
  console.warn('placeBet skipped/failed (deploy still valid):', e?.message || e);
}

writeFileSync(
  outPath,
  JSON.stringify(
    {
      network: 'preprod',
      contractAddress: address,
      placeBetTxId,
      deployedAt: new Date().toISOString(),
      explorer: 'https://preprod.midnightexplorer.com/',
      faucet: 'https://midnight-tmnight-preprod.nethermind.dev/',
    },
    null,
    2,
  ),
);
console.log('Wrote', outPath);

try {
  await walletCtx.wallet.stop?.();
} catch {
  /* ignore */
}
process.exit(0);
