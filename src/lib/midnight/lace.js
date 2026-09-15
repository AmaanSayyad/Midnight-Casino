/**
 * Midnight DApp Connector — Lace, 1AM, and other window.midnight wallets.
 * Prefers 1AM (https://1am.xyz/) when present. Connector API v4.
 * Unshielded Night (tNIGHT) via getUnshieldedBalances + makeTransfer.
 * Apache-2.0
 */

export const MIDNIGHT_NETWORK_CANDIDATES = [
  'preview',
  'preprod',
  'undeployed',
  'testnet',
  'devnet',
  'qanet',
  'mainnet',
];

/** Preferred wallet product (1AM). Falls back to Lace / any Midnight connector. */
export const PREFERRED_WALLET_HINTS = ['1am', '1 am', 'webisoft'];

export const ONE_AM_INSTALL_URL = 'https://1am.xyz/';

/** Native / unshielded Night token type (ledger-v8 nativeToken().raw). */
export const NIGHT_TOKEN_TYPE =
  '0000000000000000000000000000000000000000000000000000000000000000';

/** Lace README: 10_000_000 = 10 Night → 6 decimals. */
export const TNIGHT_DECIMALS = 6;

const ATOMIC = 10n ** BigInt(TNIGHT_DECIMALS);

export function listMidnightWallets() {
  if (typeof window === 'undefined' || !window.midnight) return [];
  return Object.values(window.midnight).filter(
    (w) => w && typeof w === 'object' && typeof w.connect === 'function',
  );
}

export function walletLabel(w) {
  return (w?.name || w?.rdns || 'Midnight wallet').trim();
}

export function isOneAmWallet(w) {
  const blob = `${w?.name || ''} ${w?.rdns || ''}`.toLowerCase();
  return PREFERRED_WALLET_HINTS.some((h) => blob.includes(h));
}

export function scoreMidnightWallet(w) {
  const blob = `${w?.name || ''} ${w?.rdns || ''}`.toLowerCase();
  if (PREFERRED_WALLET_HINTS.some((h) => blob.includes(h))) return 200;
  if (blob.includes('lace')) return 80;
  if (blob.includes('nocturne')) return 70;
  if (blob.includes('midnight')) return 50;
  if (blob.includes('temple') || blob.includes('metamask') || blob.includes('phantom')) {
    return -100;
  }
  return 10;
}

/** Prefer window.midnight['1am'], then Lace, then any other Midnight connector. */
export function findMidnightWallet(preferredRdns) {
  if (typeof window !== 'undefined' && window.midnight?.['1am']) {
    const oneAm = window.midnight['1am'];
    if (oneAm && typeof oneAm.connect === 'function') return oneAm;
  }

  const wallets = listMidnightWallets();
  if (!wallets.length) return null;

  if (preferredRdns) {
    const match =
      wallets.find((w) => w.rdns === preferredRdns) ||
      (typeof window !== 'undefined' && window.midnight?.[preferredRdns]) ||
      null;
    if (match && scoreMidnightWallet(match) >= 0) return match;
  }

  const ranked = [...wallets].sort(
    (a, b) => scoreMidnightWallet(b) - scoreMidnightWallet(a),
  );
  const best = ranked[0];
  if (scoreMidnightWallet(best) < 0) return null;
  return best;
}

/** Pull hex tx string from Connector makeTransfer / balance* results (Lace + 1AM). */
export function extractSubmitableTx(result) {
  if (!result) return null;
  if (typeof result === 'string' && result.length > 16) return result;
  if (typeof result === 'object') {
    const candidates = [
      result.tx,
      result.transaction,
      result.signedTx,
      result.hex,
      result.data?.tx,
      result.result?.tx,
      result.payload?.tx,
    ];
    for (const c of candidates) {
      if (typeof c === 'string' && c.length > 16) return c;
      if (c && typeof c === 'object' && typeof c.tx === 'string' && c.tx.length > 16) {
        return c.tx;
      }
    }
    // Wallet already submitted / finalized — no hex for us to relay
    if (
      result.submitted === true ||
      result.txSubmitted === true ||
      result.status === 'submitted' ||
      result.status === 'finalized' ||
      result.status === 'confirmed' ||
      typeof result.txHash === 'string' ||
      typeof result.txId === 'string'
    ) {
      return { alreadySubmitted: true, meta: result };
    }
  }
  return null;
}

function errMessage(err) {
  if (!err) return '';
  if (typeof err === 'string') return err;
  return err.message || err.reason || String(err.code || '') || JSON.stringify(err);
}

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms / 1000}s.`));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export function parseTnigntToAtomic(amountHuman) {
  const n = Number(amountHuman);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error('Enter a valid tNIGHT amount');
  }
  // Avoid float drift: work in string to 6dp
  const fixed = n.toFixed(TNIGHT_DECIMALS);
  const [whole, frac = ''] = fixed.split('.');
  const fracPad = (frac + '000000').slice(0, TNIGHT_DECIMALS);
  return BigInt(whole) * ATOMIC + BigInt(fracPad);
}

export function formatAtomicTnignt(atomic) {
  const v = typeof atomic === 'bigint' ? atomic : BigInt(atomic || 0);
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const whole = abs / ATOMIC;
  const frac = abs % ATOMIC;
  const fracStr = frac.toString().padStart(TNIGHT_DECIMALS, '0').replace(/0+$/, '');
  const body = fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
  return neg ? `-${body}` : body;
}

/**
 * Read unshielded Night (tNIGHT) + dust from ConnectedAPI.
 */
export async function getLaceBalances(api) {
  if (!api || typeof api.getUnshieldedBalances !== 'function') {
    throw new Error('Wallet API missing getUnshieldedBalances — update 1AM / reconnect.');
  }

  const balances = await api.getUnshieldedBalances();
  let atomic = 0n;
  if (balances && typeof balances === 'object') {
    if (balances[NIGHT_TOKEN_TYPE] != null) {
      atomic = BigInt(balances[NIGHT_TOKEN_TYPE]);
    } else {
      // Fallback: largest unshielded balance (preview usually only Night)
      for (const v of Object.values(balances)) {
        const b = BigInt(v ?? 0);
        if (b > atomic) atomic = b;
      }
    }
  }

  let dustAtomic = 0n;
  let dustCap = 0n;
  try {
    if (typeof api.getDustBalance === 'function') {
      const dust = await api.getDustBalance();
      dustAtomic = BigInt(dust?.balance ?? 0);
      dustCap = BigInt(dust?.cap ?? 0);
    }
  } catch {
    // optional
  }

  return {
    tnightAtomic: atomic,
    tnight: formatAtomicTnignt(atomic),
    dustAtomic,
    dust: formatAtomicTnignt(dustAtomic),
    dustCap: formatAtomicTnignt(dustCap),
    rawUnshielded: balances,
  };
}

/**
 * On-chain unshielded Night transfer via DApp Connector (approve in wallet).
 * 1AM usually sponsors dust via ProofStation — local DUST can be 0 and still work.
 * Failures: pending prior tx, sponsorship down, or user Reject on dust modal.
 * @returns {{ txSubmitted: true, alreadySubmitted?: boolean }}
 */
export async function transferUnshieldedNight(api, recipientBech32, amountHuman) {
  if (!api || typeof api.makeTransfer !== 'function') {
    throw new Error('Wallet API missing makeTransfer — update 1AM.');
  }
  if (!recipientBech32 || !/^mn_addr/i.test(String(recipientBech32))) {
    throw new Error(
      'Treasury must be a Midnight Bech32 address (mn_addr…). Set NEXT_PUBLIC_MIDNIGHT_TREASURY_UNSHIELDED.',
    );
  }

  const value = parseTnigntToAtomic(amountHuman);

  // Preflight spendable Night only — 1AM sponsors dust; do not hard-block on dust=0
  try {
    const bal = await getLaceBalances(api);
    if (bal.tnightAtomic < value) {
      throw new Error(
        `Not enough spendable tNIGHT (wallet ${bal.tnight}). Wait until Pending clears to a real balance.`,
      );
    }
    if (bal.dustAtomic === 0n) {
      console.warn(
        'Wallet DUST is 0 — 1AM may still sponsor fees. If deposit fails, open 1AM → YOUR DUST and wait for any pending tx to clear.',
      );
    }
  } catch (e) {
    if (/Not enough spendable/i.test(errMessage(e))) throw e;
    console.warn('Balance preflight skipped:', errMessage(e));
  }

  if (typeof api.hintUsage === 'function') {
    try {
      await withTimeout(
        api.hintUsage(['makeTransfer', 'submitTransaction', 'getUnshieldedBalances']),
        15_000,
        'wallet.hintUsage',
      );
    } catch (e) {
      console.warn('hintUsage:', errMessage(e));
    }
  }

  let result;
  try {
    result = await withTimeout(
      api.makeTransfer(
        [
          {
            kind: 'unshielded',
            type: NIGHT_TOKEN_TYPE,
            value,
            recipient: recipientBech32,
          },
        ],
        { payFees: true },
      ),
      180_000,
      'wallet.makeTransfer',
    );
  } catch (e) {
    const msg = errMessage(e);
    if (/timed out/i.test(msg)) {
      throw new Error(
        'makeTransfer timed out after Sign. In 1AM: wait for any pending tx, open YOUR DUST / wait for sponsorship, then retry Deposit.',
      );
    }
    if (/pending|already|sponsor|dust/i.test(msg)) {
      throw new Error(
        `${msg} — In 1AM Activity: wait until no pending send. DUST is 0 so “Pay with My Dust” is disabled; wait for sponsorship or tap YOUR DUST to generate.`,
      );
    }
    throw e instanceof Error ? e : new Error(msg);
  }

  const extracted = extractSubmitableTx(result);
  if (extracted && typeof extracted === 'object' && extracted.alreadySubmitted) {
    console.info('makeTransfer already submitted by wallet:', extracted.meta);
    return { txSubmitted: true, alreadySubmitted: true };
  }

  const tx = typeof extracted === 'string' ? extracted : null;
  if (!tx) {
    console.error('makeTransfer unexpected result:', result);
    const hint =
      result && typeof result === 'object'
        ? `keys=${Object.keys(result).join(',')}`
        : typeof result;
    throw new Error(
      `Wallet did not return a submitable tx (${hint}). Open 1AM → Activity: if you see Sent UNSHIELDED Success for this deposit, click Unblock play. If you saw “Dust Sponsorship Failed / transaction already pending”, wait for that pending tx, then YOUR DUST or retry when sponsorship works.`,
    );
  }

  try {
    await withTimeout(api.submitTransaction(tx), 120_000, 'wallet.submitTransaction');
  } catch (e) {
    const msg = errMessage(e);
    console.error('submitTransaction failed:', msg, e);
    if (/already|duplicate|pending/i.test(msg)) {
      return { txSubmitted: true, alreadySubmitted: true };
    }
    throw new Error(
      `Signed OK, but submit failed: ${msg}. Check 1AM Activity — if Sent UNSHIELDED is Success, use Unblock play. Else wait for pending/sponsorship, then retry.`,
    );
  }
  return { txSubmitted: true };
}

async function sessionFromConnectedApi(api, networkId, walletName) {
  let unshieldedAddress = null;

  if (typeof api.getUnshieldedAddress === 'function') {
    const res = await api.getUnshieldedAddress();
    unshieldedAddress = res?.unshieldedAddress || res?.address || null;
  }

  if (!unshieldedAddress && typeof api.state === 'function') {
    const state = await api.state();
    unshieldedAddress = state?.address || state?.unshieldedAddress || null;
  }

  if (!unshieldedAddress) {
    try {
      const status = await api.getConnectionStatus?.();
      if (status?.networkId) {
        unshieldedAddress = `lace:${status.networkId}`;
      }
    } catch {
      // ignore
    }
  }

  if (!unshieldedAddress) {
    throw new Error('Wallet connected but no address yet. Unlock Midnight account and retry.');
  }

  let shieldedAddress = null;
  try {
    if (typeof api.getShieldedAddresses === 'function') {
      const shielded = await api.getShieldedAddresses();
      shieldedAddress = shielded.shieldedAddress ?? null;
    }
  } catch {
    // optional
  }

  let config = null;
  try {
    if (typeof api.getConfiguration === 'function') {
      config = await api.getConfiguration();
    }
  } catch {
    // optional
  }

  let balances = { tnight: '0', dust: '0', tnightAtomic: 0n };
  try {
    balances = await getLaceBalances(api);
  } catch (e) {
    console.warn('getLaceBalances after connect:', errMessage(e));
  }

  return {
    api,
    networkId,
    unshieldedAddress,
    shieldedAddress,
    proofServerUri: config?.proverServerUri ?? null,
    indexerUri: config?.indexerUri ?? null,
    walletName: walletName || 'Midnight wallet',
    tnight: balances.tnight,
    dust: balances.dust,
    tnightAtomic: balances.tnightAtomic,
  };
}

/**
 * Connect Midnight wallet (1AM preferred, then Lace / others).
 * networkId must be lowercase: preview | preprod | …
 * @param {string} preferredNetwork
 * @param {{ wallet?: object, preferredRdns?: string }} [opts]
 */
export async function connectLace(preferredNetwork = 'preview', opts = {}) {
  const networkId = String(preferredNetwork || 'preview').toLowerCase();
  if (!MIDNIGHT_NETWORK_CANDIDATES.includes(networkId)) {
    throw new Error(
      `Invalid network "${preferredNetwork}". Use: ${MIDNIGHT_NETWORK_CANDIDATES.join(', ')}`,
    );
  }

  const wallet = opts.wallet || findMidnightWallet(opts.preferredRdns);
  if (!wallet) {
    throw new Error(
      'No Midnight wallet found. Install 1AM (https://1am.xyz/), unlock it, set network preview, refresh this page.',
    );
  }

  console.log('Midnight wallet connect:', {
    networkId,
    wallet: wallet.name || wallet.rdns,
    apiVersion: wallet.apiVersion,
    preferred: isOneAmWallet(wallet) ? '1AM' : walletLabel(wallet),
  });

  try {
    console.log(`wallet.connect('${networkId}')…`);
    const api = await withTimeout(
      wallet.connect(networkId),
      90_000,
      `Wallet(${networkId})`,
    );
    return await sessionFromConnectedApi(api, networkId, walletLabel(wallet));
  } catch (err) {
    const msg = errMessage(err);
    console.warn(`wallet.connect(${networkId}) failed:`, msg);

    if (/locked/i.test(msg)) {
      throw new Error(
        'Wallet is locked. Unlock 1AM (or Lace), then Connect again.',
      );
    }

    if (/reject|denied|cancel|not been authorized|unauthorized/i.test(msg)) {
      throw new Error(
        'Authorize cancelled. In the wallet popup: Select Account → Authorize, then retry.',
      );
    }

    if (/mismatch/i.test(msg)) {
      throw new Error(
        `Network mismatch. In the wallet set Midnight to "${networkId}" (tNIGHT → preview), then Connect again.`,
      );
    }

    if (/invalid network id/i.test(msg)) {
      throw new Error(
        `Invalid network ID "${networkId}". Valid: ${MIDNIGHT_NETWORK_CANDIDATES.join(', ')}`,
      );
    }

    throw new Error(msg || `Wallet connect failed on ${networkId}`);
  }
}
