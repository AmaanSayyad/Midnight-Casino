/**
 * Plinko Game VRF Result Processor
 * Converts VRF values into ball path and final position for the Plinko game
 */
export class PlinkoResultProcessor {
  constructor() {
    this.gameType = 'PLINKO';
    this.supportedRows = [8, 10, 12, 14, 16];
    this.maxRows = 16;
    this.minRows = 8;
  }

  /**
   * Process Pyth Entropy value to generate ball path and final position
   * @param {string|bigint} entropyValue - Pyth Entropy random value
   * @param {Object} gameConfig - Game configuration
   * @returns {Object} Plinko game result
   */
  processEntropy(entropyValue, gameConfig) {
    try {
      const { rows } = gameConfig;
      
      // Validate row count
      if (!rows || !this.supportedRows.includes(rows)) {
        throw new Error(`Invalid row count: ${rows}. Must be one of: ${this.supportedRows.join(', ')}`);
      }

      // Convert Entropy value to BigInt for processing
      const entropyBigInt = typeof entropyValue === 'string' ? BigInt(entropyValue) : entropyValue;
      
      // Generate ball path with controlled randomness
      const ballPath = this.generateBallPath(entropyBigInt, rows);
      
      // Calculate final position
      const finalPosition = this.calculateFinalPosition(ballPath);
      
      // Get multipliers for this row configuration
      const multipliers = this.getMultipliers(rows);
      
      // Calculate payout multiplier for final position
      const payoutMultiplier = multipliers[finalPosition] || 0;
      
      // Generate additional game data
      const gameResult = {
        gameType: this.gameType,
        rows,
        ballPath,
        finalPosition,
        payoutMultiplier,
        multipliers,
        entropyValue: entropyValue.toString(),
        pathVisualization: this.generatePathVisualization(ballPath, rows),
        metadata: {
          algorithm: 'controlled-randomness',
          totalPossibleOutcomes: rows + 1,
          pathLength: ballPath.length,
          leftMoves: ballPath.filter(move => move === 0).length,
          rightMoves: ballPath.filter(move => move === 1).length,
          generatedAt: new Date().toISOString(),
          source: 'Pyth Entropy'
        }
      };

      console.log(`✅ Plinko result processed: ${rows} rows, final position: ${finalPosition}, multiplier: ${payoutMultiplier}x`);
      
      return gameResult;

    } catch (error) {
      console.error('❌ Failed to process Plinko Entropy:', error);
      throw new Error(`Plinko Entropy processing failed: ${error.message}`);
    }
  }

  /**
   * Generate ball path with controlled randomness
   * @param {bigint} entropyValue - Pyth Entropy random value
   * @param {number} rows - Number of rows
   * @returns {number[]} Array of moves (0 = left, 1 = right)
   */
  generateBallPath(entropyValue, rows) {
    const path = [];
    let seed = entropyValue;
    
    // Generate path for each row
    for (let row = 0; row < rows; row++) {
      // Use controlled randomness to prevent extreme outcomes
      const rawRandom = Number(seed % BigInt(1000));
      
      // Apply bias towards center to make extreme outcomes less likely
      // This ensures the ball doesn't always go to extreme left or right
      const centerBias = this.calculateCenterBias(row, rows);
      const biasedRandom = this.applyBias(rawRandom, centerBias);
      
      // Determine direction (0 = left, 1 = right)
      const direction = biasedRandom < 500 ? 0 : 1;
      path.push(direction);
      
      // Update seed for next iteration
      seed = seed / BigInt(1000);
      
      // Ensure we don't run out of entropy
      if (seed === 0n) {
        seed = entropyValue + BigInt(row + 1);
      }
    }
    
    return path;
  }

  /**
   * Calculate center bias for a given row to prevent extreme outcomes
   * @param {number} currentRow - Current row index
   * @param {number} totalRows - Total number of rows
   * @returns {number} Bias factor (0-1)
   */
  calculateCenterBias(currentRow, totalRows) {
    // Stronger bias towards center in later rows
    const progressRatio = currentRow / totalRows;
    
    // Base bias increases as we go down
    const baseBias = 0.1 + (progressRatio * 0.2); // 0.1 to 0.3
    
    // Additional bias based on current position tendency
    // This helps prevent the ball from going too far to one side
    return Math.min(baseBias, 0.3); // Cap at 30% bias
  }

  /**
   * Apply bias to random value to control extreme outcomes
   * @param {number} randomValue - Raw random value (0-999)
   * @param {number} bias - Bias factor (0-1)
   * @returns {number} Biased random value
   */
  applyBias(randomValue, bias) {
    // Apply gentle bias towards center (500)
    const center = 500;
    const distance = Math.abs(randomValue - center);
    const biasedDistance = distance * (1 - bias);
    
    // Return biased value
    return randomValue < center 
      ? center - biasedDistance 
      : center + biasedDistance;
  }

  /**
   * Calculate final position from ball path
   * @param {number[]} path - Ball path array
   * @returns {number} Final position (0 to rows)
   */
  calculateFinalPosition(path) {
    // Count right moves to determine final position
    const rightMoves = path.filter(move => move === 1).length;
    return rightMoves;
  }

  /**
   * Get multipliers for a specific row configuration
   * @param {number} rows - Number of rows
   * @returns {number[]} Array of multipliers for each position
   */
  getMultipliers(rows) {
    // Multiplier configurations for different row counts
    const multiplierConfigs = {
      8: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
      10: [8.9, 3.0, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 3.0, 8.9],
      12: [10.3, 4.0, 1.9, 1.2, 1.1, 1.0, 0.7, 1.0, 1.1, 1.2, 1.9, 4.0, 10.3],
      14: [7.1, 4.0, 1.9, 1.3, 1.1, 1.0, 0.7, 0.7, 0.7, 1.0, 1.1, 1.3, 1.9, 4.0, 7.1],
      16: [16.0, 9.0, 2.0, 1.4, 1.1, 1.0, 0.5, 0.2, 0.2, 0.5, 1.0, 1.1, 1.4, 2.0, 9.0, 16.0, 16.0]
    };

    return multiplierConfigs[rows] || [];
  }

  /**
   * Generate path visualization for debugging/display
   * @param {number[]} path - Ball path array
   * @param {number} rows - Number of rows
   * @returns {string} ASCII visualization of the path
   */
  generatePathVisualization(path, rows) {
    let visualization = '';
    let currentPosition = 0;
    
    // Start position
    visualization += ' '.repeat(rows) + '●\n';
    
    // Generate each row
    for (let row = 0; row < rows; row++) {
      const move = path[row];
      currentPosition += move;
      
      // Create row visualization
      const spaces = ' '.repeat(rows - row - 1);
      const leftSpaces = ' '.repeat(currentPosition);
      const rightSpaces = ' '.repeat(rows - currentPosition);
      
      visualization += spaces + leftSpaces + '●' + rightSpaces + '\n';
    }
    
    // Final position indicator
    const finalSpaces = ' '.repeat(currentPosition);
    visualization += finalSpaces + '▼';
    
    return visualization;
  }

  /**
   * Validate ball path against VRF value
   * @param {string|bigint} vrfValue - Original VRF value
   * @param {number[]} ballPath - Generated ball path
   * @param {number} rows - Number of rows
   * @returns {boolean} True if path is valid
   */
  validateBallPath(vrfValue, ballPath, rows) {
    try {
      // Regenerate path using the same VRF value
      const vrfBigInt = typeof vrfValue === 'string' ? BigInt(vrfValue) : vrfValue;
      const regeneratedPath = this.generateBallPath(vrfBigInt, rows);
      
      // Compare arrays
      if (ballPath.length !== regeneratedPath.length) {
        return false;
      }
      
      for (let i = 0; i < ballPath.length; i++) {
        if (ballPath[i] !== regeneratedPath[i]) {
          return false;
        }
      }
      
      return true;

    } catch (error) {
      console.error('❌ Ball path validation failed:', error);
      return false;
    }
  }

  /**
   * Calculate probability distribution for outcomes
   * @param {number} rows - Number of rows
   * @returns {Object} Probability distribution
   */
  calculateProbabilityDistribution(rows) {
    const totalOutcomes = Math.pow(2, rows);
    const distribution = {};
    
    for (let position = 0; position <= rows; position++) {
      // Calculate binomial probability
      const combinations = this.binomialCoefficient(rows, position);
      const probability = combinations / totalOutcomes;
      
      distribution[position] = {
        probability: probability,
        percentage: (probability * 100).toFixed(2) + '%',
        combinations: combinations
      };
    }
    
    return distribution;
  }

  /**
   * Calculate binomial coefficient (n choose k)
   * @param {number} n - Total number of trials
   * @param {number} k - Number of successes
   * @returns {number} Binomial coefficient
   */
  binomialCoefficient(n, k) {
    if (k > n) return 0;
    if (k === 0 || k === n) return 1;
    
    let result = 1;
    for (let i = 0; i < k; i++) {
      result = result * (n - i) / (i + 1);
    }
    
    return Math.round(result);
  }

  /**
   * Simulate a game round
   * @param {Object} gameResult - Processed game result
   * @param {number} betAmount - Bet amount
   * @returns {Object} Game round result
   */
  simulateGameRound(gameResult, betAmount) {
    const { finalPosition, payoutMultiplier, rows } = gameResult;
    
    const payout = betAmount * payoutMultiplier;
    const profit = payout - betAmount;
    const isWin = payoutMultiplier > 1;
    
    return {
      finalPosition,
      payoutMultiplier,
      betAmount,
      payout,
      profit,
      isWin,
      riskLevel: this.calculateRiskLevel(rows, finalPosition),
      outcome: this.getOutcomeDescription(finalPosition, rows)
    };
  }

  /**
   * Calculate risk level for a specific outcome
   * @param {number} rows - Number of rows
   * @param {number} finalPosition - Final ball position
   * @returns {string} Risk level description
   */
  calculateRiskLevel(rows, finalPosition) {
    const center = rows / 2;
    const distance = Math.abs(finalPosition - center);
    const maxDistance = rows / 2;
    const distanceRatio = distance / maxDistance;
    
    if (distanceRatio < 0.3) return 'low';
    if (distanceRatio < 0.7) return 'medium';
    return 'high';
  }

  /**
   * Get outcome description
   * @param {number} finalPosition - Final ball position
   * @param {number} rows - Number of rows
   * @returns {string} Outcome description
   */
  getOutcomeDescription(finalPosition, rows) {
    const center = rows / 2;
    
    if (finalPosition === 0 || finalPosition === rows) {
      return 'extreme';
    } else if (Math.abs(finalPosition - center) <= 1) {
      return 'center';
    } else if (finalPosition < center) {
      return 'left';
    } else {
      return 'right';
    }
  }

  /**
   * Get game statistics for a row configuration
   * @param {number} rows - Number of rows
   * @returns {Object} Game statistics
   */
  getGameStats(rows) {
    const multipliers = this.getMultipliers(rows);
    const distribution = this.calculateProbabilityDistribution(rows);
    
    // Calculate expected value
    let expectedValue = 0;
    for (let position = 0; position <= rows; position++) {
      const multiplier = multipliers[position] || 0;
      const probability = distribution[position].probability;
      expectedValue += multiplier * probability;
    }
    
    return {
      rows,
      totalPositions: rows + 1,
      maxMultiplier: Math.max(...multipliers),
      minMultiplier: Math.min(...multipliers),
      expectedValue: expectedValue.toFixed(4),
      houseEdge: ((1 - expectedValue) * 100).toFixed(2) + '%',
      riskLevel: rows <= 10 ? 'low' : rows <= 14 ? 'medium' : 'high',
      centerProbability: distribution[Math.floor(rows / 2)].percentage
    };
  }

  /**
   * Get supported row counts
   * @returns {number[]} Array of supported row counts
   */
  getSupportedRows() {
    return [...this.supportedRows];
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
    
    const { rows } = gameConfig;
    
    if (!rows) {
      errors.push('Row count is required');
    } else if (typeof rows !== 'number') {
      errors.push('Row count must be a number');
    } else if (!this.supportedRows.includes(rows)) {
      errors.push(`Row count must be one of: ${this.supportedRows.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate test scenarios for different row configurations
   * @returns {Object[]} Array of test scenarios
   */
  generateTestScenarios() {
    const scenarios = [];
    
    this.supportedRows.forEach(rows => {
      // Test extreme left
      scenarios.push({
        name: `${rows} rows - Extreme Left`,
        vrfValue: '1111111111111111111111111111111111111111111111111111111111111111111111111111111',
        gameConfig: { rows },
        expectedOutcome: 'extreme_left'
      });
      
      // Test extreme right
      scenarios.push({
        name: `${rows} rows - Extreme Right`,
        vrfValue: '9999999999999999999999999999999999999999999999999999999999999999999999999999999',
        gameConfig: { rows },
        expectedOutcome: 'extreme_right'
      });
      
      // Test center
      scenarios.push({
        name: `${rows} rows - Center`,
        vrfValue: '5555555555555555555555555555555555555555555555555555555555555555555555555555555',
        gameConfig: { rows },
        expectedOutcome: 'center'
      });
    });
    
    return scenarios;
  }
}

export default PlinkoResultProcessor;