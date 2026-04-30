import { useState, useCallback } from 'react';
import { saveGameResult } from '../utils/gameHistory';

/**
 * Game History Hook
 * Provides functions to save game results with VRF transaction hashes
 */
export const useGameHistory = () => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Save a game result with VRF details
   * @param {Object} gameData - Game result data
   * @returns {Promise<Object>} Save result
   */
  const saveGame = useCallback(async (gameData) => {
    try {
      setSaving(true);
      setError(null);

      const result = await saveGameResult(gameData);
      
      console.log('✅ Game saved to history:', result.gameId);
      return result;

    } catch (err) {
      console.error('❌ Failed to save game:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  /**
   * Save Roulette game result
   * @param {Object} params - Roulette game parameters
   * @returns {Promise<Object>} Save result
   */
  const saveRouletteGame = useCallback(async ({
    userAddress,
    vrfRequestId,
    vrfTransactionHash,
    vrfValue,
    gameConfig,
    resultData,
    betAmount,
    payoutAmount
  }) => {
    return saveGame({
      userAddress,
      gameType: 'ROULETTE',
      vrfRequestId,
      vrfTransactionHash,
      vrfValue,
      gameConfig: {
        betType: gameConfig.betType || 'straight',
        betValue: gameConfig.betValue,
        wheelType: gameConfig.wheelType || 'european',
        ...gameConfig
      },
      resultData: {
        number: resultData.number,
        color: resultData.color,
        properties: resultData.properties,
        vrfValue: vrfValue,
        ...resultData
      },
      betAmount,
      payoutAmount
    });
  }, [saveGame]);

  /**
   * Save Mines game result
   * @param {Object} params - Mines game parameters
   * @returns {Promise<Object>} Save result
   */
  const saveMinesGame = useCallback(async ({
    userAddress,
    vrfRequestId,
    vrfTransactionHash,
    vrfValue,
    gameConfig,
    resultData,
    betAmount,
    payoutAmount
  }) => {
    return saveGame({
      userAddress,
      gameType: 'MINES',
      vrfRequestId,
      vrfTransactionHash,
      vrfValue,
      gameConfig: {
        mineCount: gameConfig.mineCount || 3,
        gridSize: gameConfig.gridSize || 25,
        ...gameConfig
      },
      resultData: {
        minePositions: resultData.minePositions,
        revealedTiles: resultData.revealedTiles,
        hitMine: resultData.hitMine,
        totalMines: resultData.minePositions?.length || 0,
        vrfValue: vrfValue,
        ...resultData
      },
      betAmount,
      payoutAmount
    });
  }, [saveGame]);

  /**
   * Save Plinko game result
   * @param {Object} params - Plinko game parameters
   * @returns {Promise<Object>} Save result
   */
  const savePlinkoGame = useCallback(async ({
    userAddress,
    vrfRequestId,
    vrfTransactionHash,
    vrfValue,
    gameConfig,
    resultData,
    betAmount,
    payoutAmount
  }) => {
    return saveGame({
      userAddress,
      gameType: 'PLINKO',
      vrfRequestId,
      vrfTransactionHash,
      vrfValue,
      gameConfig: {
        rows: gameConfig.rows || 16,
        risk: gameConfig.risk || 'medium',
        ...gameConfig
      },
      resultData: {
        ballPath: resultData.ballPath,
        finalSlot: resultData.finalSlot,
        multiplier: resultData.multiplier,
        rows: resultData.rows,
        vrfValue: vrfValue,
        ...resultData
      },
      betAmount,
      payoutAmount
    });
  }, [saveGame]);

  /**
   * Save Wheel game result
   * @param {Object} params - Wheel game parameters
   * @returns {Promise<Object>} Save result
   */
  const saveWheelGame = useCallback(async ({
    userAddress,
    vrfRequestId,
    vrfTransactionHash,
    vrfValue,
    gameConfig,
    resultData,
    betAmount,
    payoutAmount
  }) => {
    return saveGame({
      userAddress,
      gameType: 'WHEEL',
      vrfRequestId,
      vrfTransactionHash,
      vrfValue,
      gameConfig: {
        segments: gameConfig.segments || 54,
        riskLevel: gameConfig.riskLevel || 'medium',
        ...gameConfig
      },
      resultData: {
        segment: resultData.segment,
        multiplier: resultData.multiplier,
        color: resultData.color,
        totalSegments: resultData.totalSegments,
        vrfValue: vrfValue,
        ...resultData
      },
      betAmount,
      payoutAmount
    });
  }, [saveGame]);

  return {
    // General functions
    saveGame,
    saving,
    error,
    
    // Game-specific functions
    saveRouletteGame,
    saveMinesGame,
    savePlinkoGame,
    saveWheelGame
  };
};

export default useGameHistory;