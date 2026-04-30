import { ethers } from 'ethers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Environment (server-side only)
const RPC_URL = process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';
const CASINO_ADDRESS = process.env.NEXT_PUBLIC_YELLOW_CASINO_ADDRESS || '';
const CASINO_PRIVKEY = process.env.CASINO_WALLET_PRIVATE_KEY || process.env.TREASURY_PRIVATE_KEY || '';

// Minimal ABI with createGameSession and minBet
const ABI = [
  "function createGameSession(bytes32 sessionId, uint8 gameType, bytes32 yellowChannelId) external payable",
  "function minBet() view returns (uint256)"
];

// Map game type to enum
const GAME_ENUM = {
  MINES: 0,
  PLINKO: 1,
  ROULETTE: 2,
  WHEEL: 3,
};

export async function POST(request) {
  try {
    if (!CASINO_ADDRESS || !CASINO_PRIVKEY) {
      return new Response(JSON.stringify({ ok: false, error: 'Casino wallet or contract not configured' }), { status: 400 });
    }

    const body = await request.json();
    const { sessionId, gameType, channelId, valueMatic } = body || {};

    if (!sessionId || !gameType || !channelId) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing sessionId/gameType/channelId' }), { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(CASINO_PRIVKEY, provider);
    const contract = new ethers.Contract(CASINO_ADDRESS, ABI, wallet);

    // Use hashed bytes32 to avoid out-of-bounds errors from long strings
    const sessionBytes = ethers.keccak256(ethers.toUtf8Bytes(String(sessionId)));
    const channelBytes = ethers.keccak256(ethers.toUtf8Bytes(String(channelId)));
    const gameEnum = GAME_ENUM[String(gameType).toUpperCase()];
    if (gameEnum === undefined) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid gameType' }), { status: 400 });
    }

    // Ensure at least minBet value is sent
    let minBetWei = 0n;
    try {
      minBetWei = await contract.minBet();
    } catch {}

    let sendValue = 0n;
    if (valueMatic !== undefined && valueMatic !== null) {
      try { sendValue = ethers.parseEther(String(valueMatic)); } catch {}
    }
    if (sendValue < minBetWei) sendValue = minBetWei;

    const tx = await contract.createGameSession(sessionBytes, gameEnum, channelBytes, {
      value: sendValue,
    });
    const receipt = await tx.wait();

    return new Response(JSON.stringify({ ok: true, txHash: tx.hash, blockNumber: receipt.blockNumber }), { status: 200 });
  } catch (err) {
    const message = err?.reason || err?.shortMessage || err?.message || String(err);
    // If session already exists, treat as idempotent success to avoid spamming errors
    if (message && message.toLowerCase().includes('session already exists')) {
      return new Response(JSON.stringify({ ok: true, warning: 'Session already exists' }), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500 });
  }
}


