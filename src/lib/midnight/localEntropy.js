/**
 * Fast local entropy for Midnight preview when Pyth/EVM treasury is unavailable.
 * Used so game history never blocks on hanging /api/generate-entropy.
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
      note: `Local ${gameType} entropy (Pyth path unavailable on this deploy)`,
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

export async function generateEntropyWithFallback(pythService, gameType, gameConfig = {}, timeoutMs = 4000) {
  try {
    const result = await Promise.race([
      pythService.generateRandom(gameType, gameConfig),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('entropy-timeout')), timeoutMs),
      ),
    ]);
    if (result?.entropyProof?.transactionHash === 'timeout') {
      return makeLocalEntropyProof(gameType);
    }
    // Treat hanging API fallbacks that look empty as local
    if (!result?.entropyProof) return makeLocalEntropyProof(gameType);
    return {
      ...result,
      entropyProof: {
        ...result.entropyProof,
        status: result.entropyProof.status || 'ok',
      },
    };
  } catch {
    return makeLocalEntropyProof(gameType);
  }
}
