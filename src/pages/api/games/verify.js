import { gameHistory } from '../../../services/GameHistoryService.js';
import RouletteResultProcessor from '../../../services/gameProcessors/RouletteResultProcessor.js';
import MinesResultProcessor from '../../../services/gameProcessors/MinesResultProcessor.js';
import PlinkoResultProcessor from '../../../services/gameProcessors/PlinkoResultProcessor.js';
import WheelResultProcessor from '../../../services/gameProcessors/WheelResultProcessor.js';

/**
 * Game Verification API
 * GET /api/games/verify?gameId=xxx - Verify game result using VRF
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Initialize service if needed
    if (!gameHistory.isInitialized) {
      await gameHistory.initialize();
    }

    const { gameId } = req.query;

    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: 'gameId parameter is required'
      });
    }

    // Get game result with VRF details
    const verification = await gameHistory.verifyGameResult(gameId);

    if (!verification.verifiable) {
      return res.status(200).json({
        success: true,
        data: {
          verifiable: false,
          reason: verification.reason,
          gameId
        }
      });
    }

    // Get full game details for re-processing
    const gameDetails = await getGameDetails(gameId);
    
    if (!gameDetails) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    // Re-process the VRF value to verify the result
    const reprocessedResult = await reprocessGameResult(
      gameDetails.gameType,
      gameDetails.vrfValue,
      gameDetails.gameConfig
    );

    // Compare original result with reprocessed result
    const isValid = compareGameResults(
      gameDetails.gameType,
      gameDetails.originalResult,
      reprocessedResult
    );

    // Response
    res.status(200).json({
      success: true,
      data: {
        verifiable: true,
        verified: isValid,
        gameId,
        gameType: gameDetails.gameType,
        vrfDetails: {
          vrfValue: verification.vrfValue,
          transactionHash: verification.transactionHash,
          requestId: verification.requestId,
          etherscanUrl: verification.etherscanUrl
        },
        originalResult: gameDetails.originalResult,
        reprocessedResult,
        matches: isValid,
        verificationNote: isValid ? 
          'Game result verified successfully using Pyth Entropy' :
          'Game result verification failed - results do not match',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Game verification API error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to verify game result',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get full game details including VRF value
 */
async function getGameDetails(gameId) {
  try {
    const query = `
      SELECT 
        gr.id,
        gr.game_type,
        gr.game_config,
        gr.result_data,
        vr.vrf_value,
        vr.transaction_hash,
        vr.request_id
      FROM game_results gr
      LEFT JOIN vrf_requests vr ON gr.vrf_request_id = vr.id
      WHERE gr.id = $1
    `;

    const result = await gameHistory.pool.query(query, [gameId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      gameId: row.id,
      gameType: row.game_type,
      gameConfig: JSON.parse(row.game_config),
      originalResult: JSON.parse(row.result_data),
      vrfValue: row.vrf_value,
      transactionHash: row.transaction_hash,
      requestId: row.request_id
    };

  } catch (error) {
    console.error('❌ Failed to get game details:', error);
    throw error;
  }
}

/**
 * Re-process game result using VRF value
 */
async function reprocessGameResult(gameType, vrfValue, gameConfig) {
  try {
    let processor;

    switch (gameType) {
      case 'ROULETTE':
        processor = new RouletteResultProcessor();
        break;
      case 'MINES':
        processor = new MinesResultProcessor();
        break;
      case 'PLINKO':
        processor = new PlinkoResultProcessor();
        break;
      case 'WHEEL':
        processor = new WheelResultProcessor();
        break;
      default:
        throw new Error(`Unsupported game type: ${gameType}`);
    }

    return processor.processVRF(vrfValue.toString(), gameConfig);

  } catch (error) {
    console.error('❌ Failed to reprocess game result:', error);
    throw error;
  }
}

/**
 * Compare original and reprocessed results
 */
function compareGameResults(gameType, originalResult, reprocessedResult) {
  try {
    switch (gameType) {
      case 'ROULETTE':
        return originalResult.number === reprocessedResult.number &&
               originalResult.color === reprocessedResult.color;

      case 'MINES':
        return JSON.stringify(originalResult.minePositions?.sort()) === 
               JSON.stringify(reprocessedResult.minePositions?.sort());

      case 'PLINKO':
        return originalResult.finalSlot === reprocessedResult.finalSlot &&
               originalResult.multiplier === reprocessedResult.multiplier;

      case 'WHEEL':
        return originalResult.segment === reprocessedResult.segment &&
               originalResult.multiplier === reprocessedResult.multiplier;

      default:
        // Generic comparison for unknown game types
        return JSON.stringify(originalResult) === JSON.stringify(reprocessedResult);
    }

  } catch (error) {
    console.error('❌ Failed to compare game results:', error);
    return false;
  }
}