/**
 * Mines Game VRF Result Processor
 * Converts VRF values into mine positions for the Mines game
 */
export class MinesResultProcessor {
  constructor() {
    this.gameType = 'MINES';
    this.gridSize = 25; // 5x5 grid (0-24 positions)
    this.maxMines = 24; // Maximum mines allowed
  }

  /**
   * Process Pyth Entropy value to generate mine positions
   * @param {string|bigint} entropyValue - Pyth Entropy random value
   * @param {Object} gameConfig - Game configuration
   * @returns {Object} Mines game result
   */
  processEntropy(entropyValue, gameConfig) {
    try {
      const { mineCount } = gameConfig;
      
      // Validate mine count
      if (!mineCount || mineCount < 1 || mineCount > this.maxMines) {
        throw new Error(`Invalid mine count: ${mineCount}. Must be between 1 and ${this.maxMines}`);
      }

      // Convert Entropy value to BigInt for processing
      const entropyBigInt = typeof entropyValue === 'string' ? BigInt(entropyValue) : entropyValue;
      
      // Generate mine positions using Fisher-Yates shuffle algorithm
      const minePositions = this.generateMinePositions(entropyBigInt, mineCount);
      
      // Calculate multipliers for each safe tile revealed
      const multipliers = this.calculateMultipliers(mineCount);
      
      // Generate additional game data
      const gameResult = {
        gameType: this.gameType,
        minePositions: minePositions.sort((a, b) => a - b), // Sort for consistency
        mineCount,
        gridSize: this.gridSize,
        safePositions: this.getSafePositions(minePositions),
        multipliers,
        entropyValue: entropyValue.toString(),
        metadata: {
          algorithm: 'fisher-yates-shuffle',
          gridLayout: '5x5',
          totalPositions: this.gridSize,
          safePositions: this.gridSize - mineCount,
          generatedAt: new Date().toISOString(),
          source: 'Pyth Entropy'
        }
      };

      console.log(`✅ Mines result processed: ${mineCount} mines, positions: [${minePositions.join(', ')}]`);
      
      return gameResult;

    } catch (error) {
      console.error('❌ Failed to process Mines Entropy:', error);
      throw new Error(`Mines Entropy processing failed: ${error.message}`);
    }
  }

  /**
   * Generate mine positions using Fisher-Yates shuffle algorithm
   * @param {bigint} entropyValue - Pyth Entropy random value
   * @param {number} mineCount - Number of mines to place
   * @returns {number[]} Array of mine positions
   */
  generateMinePositions(entropyValue, mineCount) {
    // Create array of all possible positions
    const positions = Array.from({ length: this.gridSize }, (_, i) => i);
    const minePositions = [];
    let seed = entropyValue;

    // Use Fisher-Yates shuffle to select mine positions
    for (let i = 0; i < mineCount; i++) {
      // Calculate remaining positions
      const remainingPositions = positions.length;
      
      if (remainingPositions === 0) {
        throw new Error('Not enough positions available for mines');
      }

      // Generate random index using VRF seed
      const randomIndex = Number(seed % BigInt(remainingPositions));
      
      // Select position and remove from available positions
      const selectedPosition = positions.splice(randomIndex, 1)[0];
      minePositions.push(selectedPosition);
      
      // Update seed for next iteration
      seed = seed / BigInt(remainingPositions);
      
      // Ensure we don't run out of entropy
      if (seed === 0n) {
        seed = entropyValue + BigInt(i + 1);
      }
    }

    return minePositions;
  }

  /**
   * Get safe positions (positions without mines)
   * @param {number[]} minePositions - Array of mine positions
   * @returns {number[]} Array of safe positions
   */
  getSafePositions(minePositions) {
    const mineSet = new Set(minePositions);
    const safePositions = [];
    
    for (let i = 0; i < this.gridSize; i++) {
      if (!mineSet.has(i)) {
        safePositions.push(i);
      }
    }
    
    return safePositions;
  }

  /**
   * Calculate multipliers for each safe tile revealed
   * @param {number} mineCount - Number of mines
   * @returns {number[]} Array of multipliers for each safe tile
   */
  calculateMultipliers(mineCount) {
    const safeCount = this.gridSize - mineCount;
    const multipliers = [];
    
    // Calculate multiplier for each safe tile revealed
    for (let revealed = 1; revealed <= safeCount; revealed++) {
      // Formula: (totalTiles / safeTilesRemaining) * houseEdge
      const safeTilesRemaining = safeCount - revealed + 1;
      const baseMultiplier = this.gridSize / safeTilesRemaining;
      
      // Apply house edge (2% house edge = 0.98 multiplier)
      const houseEdge = 0.98;
      const multiplier = baseMultiplier * houseEdge;
      
      // Round to 2 decimal places
      multipliers.push(Math.round(multiplier * 100) / 100);
    }
    
    return multipliers;
  }

  /**
   * Validate mine positions against Entropy value
   * @param {string|bigint} entropyValue - Original Entropy value
   * @param {number[]} minePositions - Generated mine positions
   * @param {number} mineCount - Number of mines
   * @returns {boolean} True if positions are valid
   */
  validateMinePositions(entropyValue, minePositions, mineCount) {
    try {
      // Regenerate positions using the same Entropy value
      const entropyBigInt = typeof entropyValue === 'string' ? BigInt(entropyValue) : entropyValue;
      const regeneratedPositions = this.generateMinePositions(entropyBigInt, mineCount);
      
      // Compare arrays (sort both for comparison)
      const originalSorted = [...minePositions].sort((a, b) => a - b);
      const regeneratedSorted = [...regeneratedPositions].sort((a, b) => a - b);
      
      if (originalSorted.length !== regeneratedSorted.length) {
        return false;
      }
      
      for (let i = 0; i < originalSorted.length; i++) {
        if (originalSorted[i] !== regeneratedSorted[i]) {
          return false;
        }
      }
      
      return true;

    } catch (error) {
      console.error('❌ Mine position validation failed:', error);
      return false;
    }
  }

  /**
   * Convert position index to grid coordinates
   * @param {number} position - Position index (0-24)
   * @returns {Object} Grid coordinates {row, col}
   */
  positionToCoordinates(position) {
    if (position < 0 || position >= this.gridSize) {
      throw new Error(`Invalid position: ${position}. Must be between 0 and ${this.gridSize - 1}`);
    }
    
    const row = Math.floor(position / 5);
    const col = position % 5;
    
    return { row, col };
  }

  /**
   * Convert grid coordinates to position index
   * @param {number} row - Row index (0-4)
   * @param {number} col - Column index (0-4)
   * @returns {number} Position index
   */
  coordinatesToPosition(row, col) {
    if (row < 0 || row >= 5 || col < 0 || col >= 5) {
      throw new Error(`Invalid coordinates: (${row}, ${col}). Must be between (0,0) and (4,4)`);
    }
    
    return row * 5 + col;
  }

  /**
   * Get game statistics for a mine configuration
   * @param {number} mineCount - Number of mines
   * @returns {Object} Game statistics
   */
  getGameStats(mineCount) {
    const safeCount = this.gridSize - mineCount;
    const multipliers = this.calculateMultipliers(mineCount);
    
    return {
      mineCount,
      safeCount,
      totalPositions: this.gridSize,
      maxMultiplier: Math.max(...multipliers),
      minMultiplier: Math.min(...multipliers),
      averageMultiplier: multipliers.reduce((sum, mult) => sum + mult, 0) / multipliers.length,
      riskLevel: mineCount <= 5 ? 'low' : mineCount <= 15 ? 'medium' : 'high',
      winProbability: (safeCount / this.gridSize * 100).toFixed(2) + '%'
    };
  }

  /**
   * Simulate a game round
   * @param {Object} gameResult - Processed game result
   * @param {number[]} revealedPositions - Positions revealed by player
   * @returns {Object} Game round result
   */
  simulateGameRound(gameResult, revealedPositions) {
    const { minePositions, multipliers } = gameResult;
    const mineSet = new Set(minePositions);
    
    let isGameOver = false;
    let hitMine = false;
    let currentMultiplier = 1;
    let safeRevealed = 0;
    
    for (const position of revealedPositions) {
      if (mineSet.has(position)) {
        // Hit a mine - game over
        isGameOver = true;
        hitMine = true;
        currentMultiplier = 0;
        break;
      } else {
        // Safe tile - increase multiplier
        safeRevealed++;
        if (safeRevealed <= multipliers.length) {
          currentMultiplier = multipliers[safeRevealed - 1];
        }
      }
    }
    
    return {
      isGameOver,
      hitMine,
      safeRevealed,
      currentMultiplier,
      canCashout: !hitMine && safeRevealed > 0,
      revealedPositions: [...revealedPositions],
      nextMultiplier: safeRevealed < multipliers.length ? multipliers[safeRevealed] : null
    };
  }

  /**
   * Get supported mine counts
   * @returns {number[]} Array of supported mine counts
   */
  getSupportedMineCounts() {
    return Array.from({ length: this.maxMines }, (_, i) => i + 1);
  }

  /**
   * Validate game configuration
   * @param {Object} gameConfig - Game configuration to validate
   * @returns {Object} Validation result
   */
  validateGameConfig(gameConfig) {
    const errors = [];
    
    if (!gameConfig) {
      errors.push('Game configuration is required');
      return { isValid: false, errors };
    }
    
    const { mineCount } = gameConfig;
    
    if (!mineCount) {
      errors.push('Mine count is required');
    } else if (typeof mineCount !== 'number') {
      errors.push('Mine count must be a number');
    } else if (mineCount < 1 || mineCount > this.maxMines) {
      errors.push(`Mine count must be between 1 and ${this.maxMines}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default MinesResultProcessor;