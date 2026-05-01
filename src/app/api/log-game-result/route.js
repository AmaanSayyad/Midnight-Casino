import { ethers } from 'ethers';

// Midnight Network Configuration
const POLYGON_AMOY_RPC = process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC || 'https://rpc-amoy.midnight.technology';
const POLYGON_TREASURY_PRIVATE_KEY = process.env.POLYGON_TREASURY_PRIVATE_KEY || process.env.TREASURY_PRIVATE_KEY;
const POLYGON_TREASURY_ADDRESS = process.env.POLYGON_TREASURY_ADDRESS || process.env.TREASURY_ADDRESS;

// Game Logger Contract ABI (minimal)
const GAME_LOGGER_ABI = [
  "function logGameResult(string gameType, address player, uint256 betAmount, uint256 payout, bool won, string entropyTxHash, string metadata) external",
  "function getGameHistory(address player, uint256 limit) external view returns (tuple(string gameType, address player, uint256 betAmount, uint256 payout, bool won, string entropyTxHash, string metadata, uint256 timestamp, uint256 blockNumber)[])",
  "event GameLogged(address indexed player, string gameType, uint256 betAmount, uint256 payout, bool won, string entropyTxHash, uint256 timestamp)"
];

export async function POST(request) {
  try {
    const { 
      gameType, 
      player, 
      betAmount, 
      payout, 
      won, 
      entropyTxHash, 
      metadata = {} 
    } = await request.json();

    console.log('🎮 Logging game result to Midnight Network:', {
      gameType,
      player,
      betAmount,
      payout,
      won,
      entropyTxHash
    });

    // Validate input
    if (!gameType || !player || !betAmount || entropyTxHash === undefined) {
      return Response.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Create provider and wallet for Midnight Network
    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
    
    if (!POLYGON_TREASURY_PRIVATE_KEY) {
      throw new Error('POLYGON_TREASURY_PRIVATE_KEY not configured');
    }

    const wallet = new ethers.Wallet(POLYGON_TREASURY_PRIVATE_KEY, provider);
    
    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    const minBalance = ethers.parseEther("0.001"); // 0.001 MIDN for gas
    
    if (balance < minBalance) {
      console.warn(`⚠️ Low balance on Midnight Network: ${ethers.formatEther(balance)} MIDN`);
    }

    // For now, we'll create a simple transaction with the game data in the transaction data
    // In a real implementation, you'd deploy a GameLogger contract
    
    // Create transaction data with game information
    const gameData = {
      gameType,
      player,
      betAmount: betAmount.toString(),
      payout: payout.toString(),
      won,
      entropyTxHash,
      metadata: JSON.stringify(metadata),
      timestamp: Date.now()
    };

    // Encode game data as hex
    const gameDataString = JSON.stringify(gameData);
    const gameDataHex = ethers.hexlify(ethers.toUtf8Bytes(gameDataString));

    // Get current nonce and gas price
    const nonce = await provider.getTransactionCount(wallet.address, 'pending');
    const feeData = await provider.getFeeData();
    
    // Calculate gas price with buffer to avoid replacement fee issues
    // Use higher gas price for Plinko to ensure faster confirmation
    const baseGasPrice = feeData.gasPrice ? feeData.gasPrice * 110n / 100n : ethers.parseUnits('30', 'gwei');
    const gasPrice = gameType === 'PLINKO' ? baseGasPrice * 120n / 100n : baseGasPrice; // Extra 20% for Plinko
    
    console.log('📊 Transaction parameters:', {
      nonce,
      gasPrice: ethers.formatUnits(gasPrice, 'gwei') + ' gwei',
      walletAddress: wallet.address
    });

    // Send transaction to Midnight Network with game data
    const tx = await wallet.sendTransaction({
      to: POLYGON_TREASURY_ADDRESS, // Send to treasury address
      value: 0, // No value transfer, just logging
      data: gameDataHex, // Game data in transaction data
      gasLimit: 100000, // Sufficient gas for data transaction
      nonce: nonce, // Explicit nonce to avoid conflicts
      gasPrice: gasPrice, // Higher gas price to avoid replacement fee issues
    });

    console.log('📝 Game logged to Midnight Network:', tx.hash);
    
    // Wait for confirmation with extended timeout
    const receipt = await Promise.race([
      tx.wait(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction timeout')), 45000)
      )
    ]);
    
    console.log('✅ Game log confirmed:', {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    });

    return Response.json({
      success: true,
      midnightTxHash: receipt.hash,
      midnightBlockNumber: receipt.blockNumber,
      midnightExplorerUrl: `https://amoy.midnightscan.com/tx/${receipt.hash}`,
      gameData,
      gasUsed: receipt.gasUsed.toString()
    });

  } catch (error) {
    console.error('❌ Game logging failed:', error);
    
    // Handle specific error types
    let errorMessage = error.message;
    let shouldRetry = false;
    
    if (error.code === 'REPLACEMENT_UNDERPRICED' || error.message.includes('replacement fee too low')) {
      errorMessage = 'Transaction fee too low - network congestion detected';
      shouldRetry = true;
    } else if (error.code === 'NONCE_EXPIRED' || error.message.includes('nonce')) {
      errorMessage = 'Transaction nonce conflict - please retry';
      shouldRetry = true;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Transaction timeout - may still be pending';
      shouldRetry = true;
    }
    
    return Response.json(
      { 
        success: false, 
        error: errorMessage,
        code: error.code,
        shouldRetry,
        details: 'Failed to log game result to Midnight Network'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve game logs for a player
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const player = searchParams.get('player');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!player) {
      return Response.json(
        { success: false, error: 'Player address is required' },
        { status: 400 }
      );
    }

    // For now, return mock data
    // In a real implementation, you'd query the GameLogger contract or index transaction data
    const mockGameLogs = [
      {
        gameType: 'WHEEL',
        player,
        betAmount: '1000000000000000000', // 1 MIDN in wei
        payout: '2000000000000000000', // 2 MIDN in wei
        won: true,
        entropyTxHash: '0x1234...abcd',
        midnightTxHash: '0x5678...efgh',
        timestamp: Date.now() - 3600000, // 1 hour ago
        blockNumber: 12345678
      }
    ];

    return Response.json({
      success: true,
      gameLogs: mockGameLogs,
      count: mockGameLogs.length
    });

  } catch (error) {
    console.error('❌ Failed to get game logs:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}