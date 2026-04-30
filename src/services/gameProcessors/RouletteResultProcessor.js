/**
 * Roulette Game VRF Result Processor
 * Converts VRF values into roulette numbers and colors for the Roulette game
 */
export class RouletteResultProcessor {
  constructor() {
    this.gameType = 'ROULETTE';
    this.maxNumber = 36;
    this.minNumber = 0;
    this.totalNumbers = 37; // 0-36
    
    // European Roulette color mapping
    this.redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    this.blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
    this.greenNumbers = [0];
  }

  /**
   * Process Pyth Entropy value to generate roulette number and color
   * @param {string|bigint} entropyValue - Pyth Entropy random value
   * @param {Object} gameConfig - Game configuration
   * @returns {Object} Roulette game result
   */
  processEntropy(entropyValue, gameConfig) {
    try {
      // Convert Entropy value to BigInt for processing
      const entropyBigInt = typeof entropyValue === 'string' ? BigInt(entropyValue) : entropyValue;
      
      // Generate roulette number (0-36)
      const number = this.generateRouletteNumber(entropyBigInt);
      
      // Determine color
      const color = this.getColor(number);
      
      // Get number properties
      const properties = this.getNumberProperties(number);
      
      // Generate additional game data
      const gameResult = {
        gameType: this.gameType,
        number,
        color,
        properties,
        entropyValue: entropyValue.toString(),
        payoutTable: this.getPayoutTable(),
        metadata: {
          algorithm: 'modulo-37',
          totalPossibleOutcomes: this.totalNumbers,
          wheelType: 'european',
          generatedAt: new Date().toISOString(),
          source: 'Pyth Entropy'
        }
      };

      console.log(`✅ Roulette result processed: number ${number} (${color})`);
      
      return gameResult;

    } catch (error) {
      console.error('❌ Failed to process Roulette Entropy:', error);
      throw new Error(`Roulette Entropy processing failed: ${error.message}`);
    }
  }

  /**
   * Generate roulette number using Entropy value
   * @param {bigint} entropyValue - Pyth Entropy random value
   * @returns {number} Roulette number (0-36)
   */
  generateRouletteNumber(entropyValue) {
    // Use modulo operation to get number in range 0-36
    const number = Number(entropyValue % BigInt(this.totalNumbers));
    return number;
  }

  /**
   * Get color for a roulette number
   * @param {number} number - Roulette number
   * @returns {string} Color ('red', 'black', or 'green')
   */
  getColor(number) {
    if (this.greenNumbers.includes(number)) {
      return 'green';
    } else if (this.redNumbers.includes(number)) {
      return 'red';
    } else if (this.blackNumbers.includes(number)) {
      return 'black';
    } else {
      throw new Error(`Invalid roulette number: ${number}`);
    }
  }

  /**
   * Get properties of a roulette number
   * @param {number} number - Roulette number
   * @returns {Object} Number properties
   */
  getNumberProperties(number) {
    if (number < 0 || number > 36) {
      throw new Error(`Invalid roulette number: ${number}`);
    }

    const properties = {
      number,
      color: this.getColor(number),
      isZero: number === 0,
      isEven: number > 0 && number % 2 === 0,
      isOdd: number > 0 && number % 2 === 1,
      isLow: number >= 1 && number <= 18,
      isHigh: number >= 19 && number <= 36,
      dozen: this.getDozen(number),
      column: this.getColumn(number),
      section: this.getSection(number)
    };

    return properties;
  }

  /**
   * Get dozen for a number
   * @param {number} number - Roulette number
   * @returns {number|null} Dozen (1, 2, 3) or null for 0
   */
  getDozen(number) {
    if (number === 0) return null;
    if (number >= 1 && number <= 12) return 1;
    if (number >= 13 && number <= 24) return 2;
    if (number >= 25 && number <= 36) return 3;
    return null;
  }

  /**
   * Get column for a number
   * @param {number} number - Roulette number
   * @returns {number|null} Column (1, 2, 3) or null for 0
   */
  getColumn(number) {
    if (number === 0) return null;
    return ((number - 1) % 3) + 1;
  }

  /**
   * Get section for a number (for neighbor bets)
   * @param {number} number - Roulette number
   * @returns {string} Section name
   */
  getSection(number) {
    // European wheel sections (simplified)
    const sections = {
      'zero': [0],
      'orphelins': [1, 6, 9, 14, 17, 20, 31, 34],
      'tiers': [5, 8, 10, 11, 13, 16, 23, 24, 27, 30, 33, 36],
      'voisins': [2, 3, 4, 7, 12, 15, 18, 19, 21, 22, 25, 26, 28, 29, 32, 35]
    };

    for (const [sectionName, numbers] of Object.entries(sections)) {
      if (numbers.includes(number)) {
        return sectionName;
      }
    }

    return 'unknown';
  }

  /**
   * Get payout table for different bet types
   * @returns {Object} Payout table
   */
  getPayoutTable() {
    return {
      straight: { payout: 35, description: 'Single number' },
      split: { payout: 17, description: 'Two adjacent numbers' },
      street: { payout: 11, description: 'Three numbers in a row' },
      corner: { payout: 8, description: 'Four numbers in a square' },
      sixLine: { payout: 5, description: 'Six numbers in two rows' },
      dozen: { payout: 2, description: 'First, second, or third dozen' },
      column: { payout: 2, description: 'First, second, or third column' },
      red: { payout: 1, description: 'Red numbers' },
      black: { payout: 1, description: 'Black numbers' },
      even: { payout: 1, description: 'Even numbers' },
      odd: { payout: 1, description: 'Odd numbers' },
      low: { payout: 1, description: 'Numbers 1-18' },
      high: { payout: 1, description: 'Numbers 19-36' }
    };
  }

  /**
   * Calculate payout for a specific bet
   * @param {string} betType - Type of bet
   * @param {number|Array} betValue - Bet value(s)
   * @param {number} resultNumber - Result number
   * @param {number} betAmount - Bet amount
   * @returns {Object} Payout calculation result
   */
  calculatePayout(betType, betValue, resultNumber, betAmount) {
    const payoutTable = this.getPayoutTable();
    const properties = this.getNumberProperties(resultNumber);
    
    let isWin = false;
    let payout = 0;

    switch (betType.toLowerCase()) {
      case 'straight':
        isWin = resultNumber === betValue;
        payout = isWin ? betAmount * (payoutTable.straight.payout + 1) : 0;
        break;

      case 'split':
        isWin = Array.isArray(betValue) && betValue.includes(resultNumber);
        payout = isWin ? betAmount * (payoutTable.split.payout + 1) : 0;
        break;

      case 'street':
        isWin = Array.isArray(betValue) && betValue.includes(resultNumber);
        payout = isWin ? betAmount * (payoutTable.street.payout + 1) : 0;
        break;

      case 'corner':
        isWin = Array.isArray(betValue) && betValue.includes(resultNumber);
        payout = isWin ? betAmount * (payoutTable.corner.payout + 1) : 0;
        break;

      case 'sixline':
        isWin = Array.isArray(betValue) && betValue.includes(resultNumber);
        payout = isWin ? betAmount * (payoutTable.sixLine.payout + 1) : 0;
        break;

      case 'dozen':
        isWin = properties.dozen === betValue;
        payout = isWin ? betAmount * (payoutTable.dozen.payout + 1) : 0;
        break;

      case 'column':
        isWin = properties.column === betValue;
        payout = isWin ? betAmount * (payoutTable.column.payout + 1) : 0;
        break;

      case 'red':
        isWin = properties.color === 'red';
        payout = isWin ? betAmount * (payoutTable.red.payout + 1) : 0;
        break;

      case 'black':
        isWin = properties.color === 'black';
        payout = isWin ? betAmount * (payoutTable.black.payout + 1) : 0;
        break;

      case 'even':
        isWin = properties.isEven;
        payout = isWin ? betAmount * (payoutTable.even.payout + 1) : 0;
        break;

      case 'odd':
        isWin = properties.isOdd;
        payout = isWin ? betAmount * (payoutTable.odd.payout + 1) : 0;
        break;

      case 'low':
        isWin = properties.isLow;
        payout = isWin ? betAmount * (payoutTable.low.payout + 1) : 0;
        break;

      case 'high':
        isWin = properties.isHigh;
        payout = isWin ? betAmount * (payoutTable.high.payout + 1) : 0;
        break;

      default:
        throw new Error(`Unknown bet type: ${betType}`);
    }

    return {
      betType,
      betValue,
      betAmount,
      resultNumber,
      isWin,
      payout,
      profit: payout - betAmount,
      multiplier: payout > 0 ? payout / betAmount : 0
    };
  }

  /**
   * Validate roulette number against VRF value
   * @param {string|bigint} vrfValue - Original VRF value
   * @param {number} number - Generated number
   * @returns {boolean} True if number is valid
   */
  validateRouletteNumber(vrfValue, number) {
    try {
      // Regenerate number using the same VRF value
      const vrfBigInt = typeof vrfValue === 'string' ? BigInt(vrfValue) : vrfValue;
      const regeneratedNumber = this.generateRouletteNumber(vrfBigInt);
      
      return number === regeneratedNumber;

    } catch (error) {
      console.error('❌ Roulette number validation failed:', error);
      return false;
    }
  }

  /**
   * Get wheel layout (European style)
   * @returns {number[]} Array of numbers in wheel order
   */
  getWheelLayout() {
    // European roulette wheel layout (clockwise from 0)
    return [
      0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
      5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
    ];
  }

  /**
   * Get neighboring numbers on the wheel
   * @param {number} number - Center number
   * @param {number} neighbors - Number of neighbors on each side
   * @returns {number[]} Array of neighboring numbers
   */
  getNeighbors(number, neighbors = 2) {
    const wheelLayout = this.getWheelLayout();
    const centerIndex = wheelLayout.indexOf(number);
    
    if (centerIndex === -1) {
      throw new Error(`Number ${number} not found on wheel`);
    }

    const neighborNumbers = [];
    
    for (let i = -neighbors; i <= neighbors; i++) {
      let index = (centerIndex + i + wheelLayout.length) % wheelLayout.length;
      neighborNumbers.push(wheelLayout[index]);
    }

    return neighborNumbers;
  }

  /**
   * Simulate multiple bets on a single spin
   * @param {Object} gameResult - Processed game result
   * @param {Array} bets - Array of bet objects
   * @returns {Object} Multi-bet result
   */
  simulateMultipleBets(gameResult, bets) {
    const { number } = gameResult;
    const results = [];
    let totalBetAmount = 0;
    let totalPayout = 0;
    let totalProfit = 0;

    bets.forEach((bet, index) => {
      const { betType, betValue, betAmount } = bet;
      
      try {
        const result = this.calculatePayout(betType, betValue, number, betAmount);
        results.push({
          betIndex: index,
          ...result
        });
        
        totalBetAmount += betAmount;
        totalPayout += result.payout;
        totalProfit += result.profit;

      } catch (error) {
        results.push({
          betIndex: index,
          error: error.message,
          betType,
          betValue,
          betAmount
        });
      }
    });

    return {
      resultNumber: number,
      totalBets: bets.length,
      totalBetAmount,
      totalPayout,
      totalProfit,
      overallWin: totalProfit > 0,
      results
    };
  }

  /**
   * Get game statistics
   * @returns {Object} Game statistics
   */
  getGameStats() {
    const payoutTable = this.getPayoutTable();
    
    return {
      totalNumbers: this.totalNumbers,
      redNumbers: this.redNumbers.length,
      blackNumbers: this.blackNumbers.length,
      greenNumbers: this.greenNumbers.length,
      houseEdge: '2.70%', // European roulette house edge
      maxPayout: payoutTable.straight.payout,
      minPayout: payoutTable.red.payout,
      wheelType: 'european',
      probabilityPerNumber: (1 / this.totalNumbers * 100).toFixed(2) + '%'
    };
  }

  /**
   * Get hot and cold numbers analysis
   * @param {number[]} recentNumbers - Array of recent winning numbers
   * @param {number} minSpins - Minimum spins to consider
   * @returns {Object} Hot and cold analysis
   */
  getHotColdAnalysis(recentNumbers, minSpins = 100) {
    if (recentNumbers.length < minSpins) {
      return {
        error: `Need at least ${minSpins} spins for analysis`,
        provided: recentNumbers.length
      };
    }

    // Count frequency of each number
    const frequency = {};
    for (let i = 0; i <= 36; i++) {
      frequency[i] = 0;
    }

    recentNumbers.forEach(number => {
      if (frequency[number] !== undefined) {
        frequency[number]++;
      }
    });

    // Calculate expected frequency
    const expectedFrequency = recentNumbers.length / this.totalNumbers;
    
    // Sort by frequency
    const sortedNumbers = Object.entries(frequency)
      .map(([number, count]) => ({
        number: parseInt(number),
        count,
        percentage: (count / recentNumbers.length * 100).toFixed(2),
        deviation: count - expectedFrequency
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalSpins: recentNumbers.length,
      expectedFrequency: expectedFrequency.toFixed(2),
      hotNumbers: sortedNumbers.slice(0, 10), // Top 10 most frequent
      coldNumbers: sortedNumbers.slice(-10).reverse(), // Bottom 10 least frequent
      analysis: {
        mostFrequent: sortedNumbers[0],
        leastFrequent: sortedNumbers[sortedNumbers.length - 1],
        averageDeviation: sortedNumbers.reduce((sum, item) => sum + Math.abs(item.deviation), 0) / sortedNumbers.length
      }
    };
  }

  /**
   * Generate betting suggestions based on result
   * @param {Object} gameResult - Game result
   * @returns {Object} Betting suggestions
   */
  generateBettingSuggestions(gameResult) {
    const { number, properties } = gameResult;
    const neighbors = this.getNeighbors(number, 2);
    
    return {
      straightUp: {
        description: 'Bet on the exact number',
        numbers: [number],
        payout: '35:1',
        probability: '2.70%'
      },
      neighbors: {
        description: 'Bet on neighboring numbers',
        numbers: neighbors,
        strategy: 'wheel_section'
      },
      color: {
        description: `Bet on ${properties.color} color`,
        color: properties.color,
        payout: '1:1',
        probability: properties.color === 'green' ? '2.70%' : '48.65%'
      },
      dozen: {
        description: `Bet on ${properties.dozen ? `${properties.dozen}${this.getOrdinalSuffix(properties.dozen)} dozen` : 'no dozen (zero)'}`,
        dozen: properties.dozen,
        payout: '2:1',
        probability: properties.dozen ? '32.43%' : '0%'
      },
      evenOdd: {
        description: `Bet on ${properties.isEven ? 'even' : properties.isOdd ? 'odd' : 'neither (zero)'} numbers`,
        type: properties.isEven ? 'even' : properties.isOdd ? 'odd' : 'zero',
        payout: '1:1',
        probability: properties.isZero ? '0%' : '48.65%'
      }
    };
  }

  /**
   * Get ordinal suffix for numbers
   * @param {number} number - Number
   * @returns {string} Ordinal suffix
   */
  getOrdinalSuffix(number) {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const value = number % 100;
    return suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];
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

    // Roulette doesn't require specific configuration
    // All validation is done on bet level
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get supported bet types
   * @returns {string[]} Array of supported bet types
   */
  getSupportedBetTypes() {
    return Object.keys(this.getPayoutTable());
  }

  /**
   * Generate test scenarios
   * @returns {Object[]} Array of test scenarios
   */
  generateTestScenarios() {
    return [
      {
        name: 'Zero (Green)',
        vrfValue: '0',
        expectedNumber: 0,
        expectedColor: 'green'
      },
      {
        name: 'Red Number',
        vrfValue: '1',
        expectedNumber: 1,
        expectedColor: 'red'
      },
      {
        name: 'Black Number',
        vrfValue: '2',
        expectedNumber: 2,
        expectedColor: 'black'
      },
      {
        name: 'Maximum Number',
        vrfValue: '36',
        expectedNumber: 36,
        expectedColor: 'red'
      },
      {
        name: 'Large VRF Value',
        vrfValue: '999999999999999999999999999999999999999999999999999999999999999999999999999999',
        expectedNumber: 'calculated', // Will be calculated via modulo
        expectedColor: 'calculated'
      }
    ];
  }
}

export default RouletteResultProcessor;