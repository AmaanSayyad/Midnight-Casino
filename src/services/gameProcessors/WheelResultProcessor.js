/**
 * Wheel Game VRF Result Processor
 * Converts VRF values into wheel segment positions for the Wheel game
 */
export class WheelResultProcessor {
  constructor() {
    this.gameType = 'WHEEL';
    this.defaultSegments = 54; // Default wheel configuration
    this.supportedSegments = [10, 20, 30, 40, 50, 54]; // Supported wheel configurations
  }

  /**
   * Process Pyth Entropy value to generate wheel segment position
   * @param {string|bigint} entropyValue - Pyth Entropy random value
   * @param {Object} gameConfig - Game configuration
   * @returns {Object} Wheel game result
   */
  processEntropy(entropyValue, gameConfig) {
    try {
      const { segments = this.defaultSegments } = gameConfig;
      
      // Validate segment count
      if (!this.supportedSegments.includes(segments)) {
        throw new Error(`Invalid segment count: ${segments}. Must be one of: ${this.supportedSegments.join(', ')}`);
      }

      // Convert Entropy value to BigInt for processing
      const entropyBigInt = typeof entropyValue === 'string' ? BigInt(entropyValue) : entropyValue;
      
      // Generate wheel segment
      const segment = this.generateWheelSegment(entropyBigInt, segments);
      
      // Get segment properties
      const segmentData = this.getSegmentData(segment, segments);
      
      // Get multipliers for this wheel configuration
      const multipliers = this.getMultipliers(segments);
      
      // Calculate payout multiplier for the segment
      const payoutMultiplier = multipliers[segment] || 0;
      
      // Generate additional game data
      const gameResult = {
        gameType: this.gameType,
        segment,
        segments,
        payoutMultiplier,
        segmentData,
        multipliers,
        entropyValue: entropyValue.toString(),
        wheelVisualization: this.generateWheelVisualization(segment, segments),
        metadata: {
          algorithm: 'modulo-segments',
          totalSegments: segments,
          segmentAngle: (360 / segments).toFixed(2) + '°',
          generatedAt: new Date().toISOString(),
          source: 'Pyth Entropy'
        }
      };

      console.log(`✅ Wheel result processed: segment ${segment}/${segments}, multiplier: ${payoutMultiplier}x`);
      
      return gameResult;

    } catch (error) {
      console.error('❌ Failed to process Wheel Entropy:', error);
      throw new Error(`Wheel Entropy processing failed: ${error.message}`);
    }
  }

  /**
   * Generate wheel segment using Entropy value
   * @param {bigint} entropyValue - Pyth Entropy random value
   * @param {number} segments - Number of segments
   * @returns {number} Segment number (0 to segments-1)
   */
  generateWheelSegment(entropyValue, segments) {
    // Use modulo operation to get segment in range 0 to segments-1
    const segment = Number(entropyValue % BigInt(segments));
    return segment;
  }

  /**
   * Get segment data including position and properties
   * @param {number} segment - Segment number
   * @param {number} totalSegments - Total number of segments
   * @returns {Object} Segment data
   */
  getSegmentData(segment, totalSegments) {
    const anglePerSegment = 360 / totalSegments;
    const startAngle = segment * anglePerSegment;
    const endAngle = (segment + 1) * anglePerSegment;
    const centerAngle = startAngle + (anglePerSegment / 2);

    return {
      segment,
      startAngle: startAngle.toFixed(2),
      endAngle: endAngle.toFixed(2),
      centerAngle: centerAngle.toFixed(2),
      angleWidth: anglePerSegment.toFixed(2),
      position: this.getSegmentPosition(centerAngle),
      riskLevel: this.getSegmentRiskLevel(segment, totalSegments)
    };
  }

  /**
   * Get segment position description
   * @param {number} centerAngle - Center angle of segment
   * @returns {string} Position description
   */
  getSegmentPosition(centerAngle) {
    // Normalize angle to 0-360
    const normalizedAngle = ((centerAngle % 360) + 360) % 360;
    
    if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) return 'top';
    if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) return 'top-right';
    if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) return 'right';
    if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) return 'bottom-right';
    if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) return 'bottom';
    if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) return 'bottom-left';
    if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) return 'left';
    if (normalizedAngle >= 292.5 && normalizedAngle < 337.5) return 'top-left';
    
    return 'unknown';
  }

  /**
   * Get risk level for a segment based on its multiplier
   * @param {number} segment - Segment number
   * @param {number} totalSegments - Total number of segments
   * @returns {string} Risk level
   */
  getSegmentRiskLevel(segment, totalSegments) {
    const multipliers = this.getMultipliers(totalSegments);
    const multiplier = multipliers[segment] || 0;
    
    if (multiplier >= 50) return 'extreme';
    if (multiplier >= 10) return 'high';
    if (multiplier >= 5) return 'medium';
    if (multiplier >= 2) return 'low';
    return 'safe';
  }

  /**
   * Get multipliers for different wheel configurations
   * @param {number} segments - Number of segments
   * @returns {number[]} Array of multipliers for each segment
   */
  getMultipliers(segments) {
    // Multiplier configurations for different segment counts
    const multiplierConfigs = {
      10: [1.5, 1.2, 2.0, 1.2, 5.0, 1.2, 2.0, 1.2, 3.0, 1.2],
      20: [1.5, 1.2, 2.0, 1.2, 3.0, 1.2, 2.0, 1.2, 5.0, 1.2, 2.0, 1.2, 3.0, 1.2, 2.0, 1.2, 10.0, 1.2, 2.0, 1.2],
      30: Array.from({ length: 30 }, (_, i) => {
        if (i === 0) return 50.0;  // Jackpot segment
        if (i % 5 === 0) return 10.0;
        if (i % 3 === 0) return 5.0;
        if (i % 2 === 0) return 2.0;
        return 1.2;
      }),
      40: Array.from({ length: 40 }, (_, i) => {
        if (i === 0) return 40.0;  // Jackpot segment
        if (i % 8 === 0) return 20.0;
        if (i % 5 === 0) return 10.0;
        if (i % 3 === 0) return 5.0;
        if (i % 2 === 0) return 2.0;
        return 1.2;
      }),
      50: Array.from({ length: 50 }, (_, i) => {
        if (i === 0) return 50.0;  // Jackpot segment
        if (i === 25) return 25.0; // Half-way jackpot
        if (i % 10 === 0) return 15.0;
        if (i % 5 === 0) return 8.0;
        if (i % 3 === 0) return 4.0;
        if (i % 2 === 0) return 2.0;
        return 1.2;
      }),
      54: Array.from({ length: 54 }, (_, i) => {
        if (i === 0) return 54.0;  // Jackpot segment
        if (i === 27) return 27.0; // Half-way jackpot
        if (i % 9 === 0) return 18.0;
        if (i % 6 === 0) return 12.0;
        if (i % 3 === 0) return 6.0;
        if (i % 2 === 0) return 3.0;
        return 1.5;
      })
    };

    return multiplierConfigs[segments] || Array.from({ length: segments }, () => 1.0);
  }

  /**
   * Generate wheel visualization
   * @param {number} winningSegment - Winning segment
   * @param {number} totalSegments - Total segments
   * @returns {string} ASCII wheel visualization
   */
  generateWheelVisualization(winningSegment, totalSegments) {
    const radius = 10;
    const centerX = radius;
    const centerY = radius;
    const size = radius * 2 + 1;
    
    // Create grid
    const grid = Array.from({ length: size }, () => Array(size).fill(' '));
    
    // Draw wheel outline
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (Math.abs(distance - radius) < 0.5) {
          grid[y][x] = '○';
        }
      }
    }
    
    // Mark winning segment
    const anglePerSegment = (2 * Math.PI) / totalSegments;
    const winningAngle = winningSegment * anglePerSegment + anglePerSegment / 2;
    
    const winX = Math.round(centerX + (radius - 2) * Math.cos(winningAngle));
    const winY = Math.round(centerY + (radius - 2) * Math.sin(winningAngle));
    
    if (winX >= 0 && winX < size && winY >= 0 && winY < size) {
      grid[winY][winX] = '★';
    }
    
    // Add center point
    grid[centerY][centerX] = '●';
    
    // Convert grid to string
    let visualization = `Wheel (${totalSegments} segments) - Winner: Segment ${winningSegment}\n`;
    visualization += grid.map(row => row.join('')).join('\n');
    visualization += `\n★ = Winning Segment ${winningSegment}`;
    
    return visualization;
  }

  /**
   * Validate wheel segment against VRF value
   * @param {string|bigint} vrfValue - Original VRF value
   * @param {number} segment - Generated segment
   * @param {number} segments - Number of segments
   * @returns {boolean} True if segment is valid
   */
  validateWheelSegment(vrfValue, segment, segments) {
    try {
      // Regenerate segment using the same VRF value
      const vrfBigInt = typeof vrfValue === 'string' ? BigInt(vrfValue) : vrfValue;
      const regeneratedSegment = this.generateWheelSegment(vrfBigInt, segments);
      
      return segment === regeneratedSegment;

    } catch (error) {
      console.error('❌ Wheel segment validation failed:', error);
      return false;
    }
  }

  /**
   * Calculate probability for each segment
   * @param {number} segments - Number of segments
   * @returns {Object} Probability data
   */
  calculateProbabilities(segments) {
    const probability = 1 / segments;
    const percentage = (probability * 100).toFixed(2);
    
    const probabilities = {};
    for (let i = 0; i < segments; i++) {
      probabilities[i] = {
        probability,
        percentage: percentage + '%',
        odds: `1:${segments - 1}`
      };
    }
    
    return {
      uniform: true,
      probabilityPerSegment: probability,
      percentagePerSegment: percentage + '%',
      segments: probabilities
    };
  }

  /**
   * Simulate a game round
   * @param {Object} gameResult - Processed game result
   * @param {number} betAmount - Bet amount
   * @returns {Object} Game round result
   */
  simulateGameRound(gameResult, betAmount) {
    const { segment, payoutMultiplier, segments, segmentData } = gameResult;
    
    const payout = betAmount * payoutMultiplier;
    const profit = payout - betAmount;
    const isWin = payoutMultiplier > 1;
    
    return {
      segment,
      segments,
      payoutMultiplier,
      betAmount,
      payout,
      profit,
      isWin,
      riskLevel: segmentData.riskLevel,
      position: segmentData.position,
      winProbability: (1 / segments * 100).toFixed(2) + '%'
    };
  }

  /**
   * Get wheel statistics for a configuration
   * @param {number} segments - Number of segments
   * @returns {Object} Wheel statistics
   */
  getWheelStats(segments) {
    const multipliers = this.getMultipliers(segments);
    const probabilities = this.calculateProbabilities(segments);
    
    // Calculate expected value
    const expectedValue = multipliers.reduce((sum, multiplier) => {
      return sum + (multiplier * probabilities.probabilityPerSegment);
    }, 0);
    
    // Find min/max multipliers
    const maxMultiplier = Math.max(...multipliers);
    const minMultiplier = Math.min(...multipliers);
    
    // Count segments by risk level
    const riskCounts = { safe: 0, low: 0, medium: 0, high: 0, extreme: 0 };
    multipliers.forEach((multiplier, segment) => {
      const riskLevel = this.getSegmentRiskLevel(segment, segments);
      riskCounts[riskLevel]++;
    });
    
    return {
      segments,
      maxMultiplier,
      minMultiplier,
      averageMultiplier: (multipliers.reduce((sum, mult) => sum + mult, 0) / multipliers.length).toFixed(2),
      expectedValue: expectedValue.toFixed(4),
      houseEdge: ((1 - expectedValue) * 100).toFixed(2) + '%',
      uniformProbability: probabilities.percentagePerSegment,
      riskDistribution: riskCounts,
      jackpotSegments: multipliers.filter(mult => mult >= 20).length
    };
  }

  /**
   * Get adjacent segments
   * @param {number} segment - Center segment
   * @param {number} totalSegments - Total segments
   * @param {number} range - Number of segments on each side
   * @returns {number[]} Array of adjacent segments
   */
  getAdjacentSegments(segment, totalSegments, range = 2) {
    const adjacent = [];
    
    for (let i = -range; i <= range; i++) {
      let adjacentSegment = (segment + i + totalSegments) % totalSegments;
      adjacent.push(adjacentSegment);
    }
    
    return adjacent;
  }

  /**
   * Analyze wheel balance (check if multipliers are fairly distributed)
   * @param {number} segments - Number of segments
   * @returns {Object} Balance analysis
   */
  analyzeWheelBalance(segments) {
    const multipliers = this.getMultipliers(segments);
    const probabilities = this.calculateProbabilities(segments);
    
    // Calculate variance
    const expectedValue = multipliers.reduce((sum, mult) => sum + mult * probabilities.probabilityPerSegment, 0);
    const variance = multipliers.reduce((sum, mult) => {
      const diff = mult - expectedValue;
      return sum + (diff * diff * probabilities.probabilityPerSegment);
    }, 0);
    
    const standardDeviation = Math.sqrt(variance);
    
    // Check distribution
    const highValueSegments = multipliers.filter(mult => mult > expectedValue * 2).length;
    const lowValueSegments = multipliers.filter(mult => mult < expectedValue * 0.5).length;
    
    return {
      expectedValue: expectedValue.toFixed(4),
      variance: variance.toFixed(4),
      standardDeviation: standardDeviation.toFixed(4),
      highValueSegments,
      lowValueSegments,
      balanceScore: Math.max(0, 100 - (standardDeviation / expectedValue * 100)).toFixed(1) + '%',
      isBalanced: standardDeviation / expectedValue < 2 // Coefficient of variation < 2
    };
  }

  /**
   * Generate betting strategies
   * @param {Object} gameResult - Game result
   * @returns {Object} Betting strategies
   */
  generateBettingStrategies(gameResult) {
    const { segment, segments, payoutMultiplier } = gameResult;
    const adjacent = this.getAdjacentSegments(segment, segments, 2);
    const multipliers = this.getMultipliers(segments);
    
    // Find high-value segments
    const highValueSegments = multipliers
      .map((mult, seg) => ({ segment: seg, multiplier: mult }))
      .filter(item => item.multiplier >= 10)
      .sort((a, b) => b.multiplier - a.multiplier)
      .slice(0, 5);
    
    return {
      singleSegment: {
        description: 'Bet on the exact winning segment',
        segments: [segment],
        probability: (1 / segments * 100).toFixed(2) + '%',
        strategy: 'high_risk_high_reward'
      },
      adjacent: {
        description: 'Bet on adjacent segments',
        segments: adjacent,
        probability: (adjacent.length / segments * 100).toFixed(2) + '%',
        strategy: 'medium_risk_medium_reward'
      },
      highValue: {
        description: 'Bet on high multiplier segments',
        segments: highValueSegments.map(item => item.segment),
        multipliers: highValueSegments.map(item => item.multiplier),
        strategy: 'jackpot_hunting'
      },
      safe: {
        description: 'Bet on low multiplier (safe) segments',
        segments: multipliers
          .map((mult, seg) => ({ segment: seg, multiplier: mult }))
          .filter(item => item.multiplier >= 1 && item.multiplier < 2)
          .map(item => item.segment),
        strategy: 'conservative'
      }
    };
  }

  /**
   * Get supported segment counts
   * @returns {number[]} Array of supported segment counts
   */
  getSupportedSegments() {
    return [...this.supportedSegments];
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
    
    const { segments = this.defaultSegments } = gameConfig;
    
    if (typeof segments !== 'number') {
      errors.push('Segment count must be a number');
    } else if (!this.supportedSegments.includes(segments)) {
      errors.push(`Segment count must be one of: ${this.supportedSegments.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate test scenarios
   * @returns {Object[]} Array of test scenarios
   */
  generateTestScenarios() {
    const scenarios = [];
    
    this.supportedSegments.forEach(segments => {
      // Test first segment
      scenarios.push({
        name: `${segments} segments - First Segment`,
        vrfValue: '0',
        gameConfig: { segments },
        expectedSegment: 0
      });
      
      // Test last segment
      scenarios.push({
        name: `${segments} segments - Last Segment`,
        vrfValue: (segments - 1).toString(),
        gameConfig: { segments },
        expectedSegment: segments - 1
      });
      
      // Test middle segment
      const middleSegment = Math.floor(segments / 2);
      scenarios.push({
        name: `${segments} segments - Middle Segment`,
        vrfValue: middleSegment.toString(),
        gameConfig: { segments },
        expectedSegment: middleSegment
      });
    });
    
    return scenarios;
  }
}

export default WheelResultProcessor;