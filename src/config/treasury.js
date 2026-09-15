// Casino Treasury Configuration — Midnight unshielded (tNIGHT), not EVM.
// Apache-2.0

export const TREASURY_CONFIG = {
  /**
   * Unshielded Midnight Bech32 treasury (mn_…).
   * Deposits: wallet makeTransfer → this address.
   * Withdraws: server signs with MIDNIGHT_TREASURY_SEED via /api/midnight-withdraw.
   * Set in .env.local: NEXT_PUBLIC_MIDNIGHT_TREASURY_UNSHIELDED=mn_addr…
   */
  UNSHIELDED_ADDRESS:
    process.env.NEXT_PUBLIC_MIDNIGHT_TREASURY_UNSHIELDED ||
    process.env.MIDNIGHT_TREASURY_UNSHIELDED ||
    '',

  // Legacy EVM fields kept only for old Polygon scripts — do not use for Lace.
  ADDRESS:
    process.env.MIDNIGHT_TREASURY_ADDRESS ||
    process.env.POLYGON_TREASURY_ADDRESS ||
    process.env.TREASURY_ADDRESS ||
    '',
  PRIVATE_KEY: process.env.MIDNIGHT_TREASURY_PRIVATE_KEY || '',

  NETWORK: {
    CHAIN_NAME: 'Midnight Preview',
    NETWORK_ID: process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK || 'preview',
  },

  LIMITS: {
    MIN_DEPOSIT: parseFloat(process.env.MIN_DEPOSIT) || 0.001,
    MAX_DEPOSIT: parseFloat(process.env.MAX_DEPOSIT) || 100,
  },

  CURRENCY: 'tNIGHT',
  DECIMALS: 6,
};

export const isValidMidnightUnshieldedAddress = (address) => {
  return typeof address === 'string' && /^mn_addr/i.test(address);
};

export const getTreasuryUnshieldedAddress = () => TREASURY_CONFIG.UNSHIELDED_ADDRESS;

export const getTreasuryInfo = () => {
  return {
    address: TREASURY_CONFIG.UNSHIELDED_ADDRESS,
    network: TREASURY_CONFIG.NETWORK.CHAIN_NAME,
    networkId: TREASURY_CONFIG.NETWORK.NETWORK_ID,
    currency: TREASURY_CONFIG.CURRENCY,
  };
};
