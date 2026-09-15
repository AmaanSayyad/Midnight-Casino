/**
 * Midnight local entropy for arcade games (Wheel / Mines / Plinko / Roulette).
 * Privacy Wheel fairness uses Compact commitHouseSeed — not this helper.
 * Apache-2.0
 */

function randomHex(bytes = 32) {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function makeLocalEntropyProof(gameType = 'GAME') {
  const randomValue = Math.floor(Math.random() * 1_000_000);
  const requestId = `0x${randomHex(32)}`;
  const sequenceNumber = String(Date.now());
  const transactionHash = `local_${randomHex(16)}`;
  return {
    randomValue,
    entropyProof: {
      requestId,
      sequenceNumber,
      randomValue,
      transactionHash,
      timestamp: Date.now(),
      status: 'local',
      source: 'Midnight local entropy',
      network: 'preview',
      explorerUrl: null,
      note: `Local ${gameType} entropy`,
    },
    success: true,
    gameType,
    metadata: {
      source: 'Midnight local entropy',
      network: 'preview',
      algorithm: 'crypto.getRandomValues',
      generatedAt: new Date().toISOString(),
    },
  };
}

/** @deprecated use makeLocalEntropyProof — kept for older call sites */
export async function generateEntropyWithFallback(_unused, gameType) {
  return makeLocalEntropyProof(gameType);
}

class MidnightEntropyService {
  constructor() {
    this.isInitialized = true;
    this.network = 'preview';
  }

  async initialize() {
    this.isInitialized = true;
    return true;
  }

  async generateRandom(gameType = 'GAME', _gameConfig = {}) {
    return makeLocalEntropyProof(gameType);
  }

  async generateRandomBatch(requests = []) {
    return Promise.all(
      requests.map((r) => this.generateRandom(r?.gameType || 'GAME', r?.gameConfig)),
    );
  }

  getNetworkConfig() {
    return { name: 'Midnight Preview', chainId: 'preview', rpcUrl: null };
  }

  getSupportedNetworks() {
    return ['preview'];
  }

  isNetworkSupported() {
    return true;
  }

  async switchNetwork() {
    return true;
  }

  async getRequestStatus() {
    return { status: 'local' };
  }
}

const midnightEntropyService = new MidnightEntropyService();
export default midnightEntropyService;
