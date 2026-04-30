import RouletteResultProcessor from '../RouletteResultProcessor.js';

describe('RouletteResultProcessor', () => {
  let processor;

  beforeEach(() => {
    processor = new RouletteResultProcessor();
  });

  describe('processVRF', () => {
    test('should generate valid roulette number', () => {
      const vrfValue = '12345678901234567890123456789012345678901234567890123456789012345678901234567890';
      const gameConfig = {};

      const result = processor.processVRF(vrfValue, gameConfig);

      expect(result.number).toBeGreaterThanOrEqual(0);
      expect(result.number).toBeLessThanOrEqual(36);
      expect(result.gameType).toBe('ROULETTE');
    });

    test('should include color information', () => {
      const vrfValue = BigInt('98765432109876543210987654321098765432109876543210987654321098765432109876543210');
      const gameConfig = {};

      const result = processor.processVRF(vrfValue, gameConfig);

      expect(['red', 'black', 'green']).toContain(result.color);
    });

    test('should include number properties', () => {
      const vrfValue = '55555555555555555555555555555555555555555555555555555555555555555555555555555555';
      const gameConfig = {};

      const result = processor.processVRF(vrfValue, gameConfig);

      expect(result.properties).toBeDefined();
      expect(result.properties.number).toBe(result.number);
      expect(result.properties.color).toBe(result.color);
      expect(typeof result.properties.isEven).toBe('boolean');
      expect(typeof result.properties.isOdd).toBe('boolean');
    });

    test('should generate consistent results for same VRF value', () => {
      const vrfValue = '77777777777777777777777777777777777777777777777777777777777777777777777777777777';
      const gameConfig = {};

      const result1 = processor.processVRF(vrfValue, gameConfig);
      const result2 = processor.processVRF(vrfValue, gameConfig);

      expect(result1.number).toBe(result2.number);
      expect(result1.color).toBe(result2.color);
    });

    test('should include payout table', () => {
      const vrfValue = '33333333333333333333333333333333333333333333333333333333333333333333333333333333';
      const gameConfig = {};

      const result = processor.processVRF(vrfValue, gameConfig);

      expect(result.payoutTable).toBeDefined();
      expect(result.payoutTable.straight.payout).toBe(35);
      expect(result.payoutTable.red.payout).toBe(1);
    });
  });

  describe('generateRouletteNumber', () => {
    test('should generate number in valid range', () => {
      const vrfValue = BigInt('123456789012345678901234567890');

      const number = processor.generateRouletteNumber(vrfValue);

      expect(number).toBeGreaterThanOrEqual(0);
      expect(number).toBeLessThanOrEqual(36);
    });

    test('should handle zero VRF value', () => {
      const vrfValue = BigInt('0');

      const number = processor.generateRouletteNumber(vrfValue);

      expect(number).toBe(0);
    });

    test('should handle large VRF values', () => {
      const vrfValue = BigInt('999999999999999999999999999999999999999999999999999999999999999999999999999999');

      const number = processor.generateRouletteNumber(vrfValue);

      expect(number).toBeGreaterThanOrEqual(0);
      expect(number).toBeLessThanOrEqual(36);
    });
  });

  describe('getColor', () => {
    test('should return green for zero', () => {
      const color = processor.getColor(0);
      expect(color).toBe('green');
    });

    test('should return red for red numbers', () => {
      const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      
      redNumbers.forEach(number => {
        const color = processor.getColor(number);
        expect(color).toBe('red');
      });
    });

    test('should return black for black numbers', () => {
      const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
      
      blackNumbers.forEach(number => {
        const color = processor.getColor(number);
        expect(color).toBe('black');
      });
    });

    test('should throw error for invalid number', () => {
      expect(() => {
        processor.getColor(37);
      }).toThrow('Invalid roulette number');

      expect(() => {
        processor.getColor(-1);
      }).toThrow('Invalid roulette number');
    });
  });

  describe('getNumberProperties', () => {
    test('should return correct properties for zero', () => {
      const properties = processor.getNumberProperties(0);

      expect(properties.number).toBe(0);
      expect(properties.color).toBe('green');
      expect(properties.isZero).toBe(true);
      expect(properties.isEven).toBe(false);
      expect(properties.isOdd).toBe(false);
      expect(properties.isLow).toBe(false);
      expect(properties.isHigh).toBe(false);
      expect(properties.dozen).toBeNull();
      expect(properties.column).toBeNull();
    });

    test('should return correct properties for even red number', () => {
      const properties = processor.getNumberProperties(12); // Even red number

      expect(properties.number).toBe(12);
      expect(properties.color).toBe('red');
      expect(properties.isZero).toBe(false);
      expect(properties.isEven).toBe(true);
      expect(properties.isOdd).toBe(false);
      expect(properties.isLow).toBe(true);
      expect(properties.isHigh).toBe(false);
      expect(properties.dozen).toBe(1);
      expect(properties.column).toBe(3);
    });

    test('should return correct properties for odd black number', () => {
      const properties = processor.getNumberProperties(35); // Odd black number

      expect(properties.number).toBe(35);
      expect(properties.color).toBe('black');
      expect(properties.isZero).toBe(false);
      expect(properties.isEven).toBe(false);
      expect(properties.isOdd).toBe(true);
      expect(properties.isLow).toBe(false);
      expect(properties.isHigh).toBe(true);
      expect(properties.dozen).toBe(3);
      expect(properties.column).toBe(2);
    });
  });

  describe('getDozen', () => {
    test('should return null for zero', () => {
      expect(processor.getDozen(0)).toBeNull();
    });

    test('should return correct dozen for numbers 1-12', () => {
      for (let i = 1; i <= 12; i++) {
        expect(processor.getDozen(i)).toBe(1);
      }
    });

    test('should return correct dozen for numbers 13-24', () => {
      for (let i = 13; i <= 24; i++) {
        expect(processor.getDozen(i)).toBe(2);
      }
    });

    test('should return correct dozen for numbers 25-36', () => {
      for (let i = 25; i <= 36; i++) {
        expect(processor.getDozen(i)).toBe(3);
      }
    });
  });

  describe('getColumn', () => {
    test('should return null for zero', () => {
      expect(processor.getColumn(0)).toBeNull();
    });

    test('should return correct column for first column', () => {
      const firstColumn = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];
      firstColumn.forEach(number => {
        expect(processor.getColumn(number)).toBe(1);
      });
    });

    test('should return correct column for second column', () => {
      const secondColumn = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
      secondColumn.forEach(number => {
        expect(processor.getColumn(number)).toBe(2);
      });
    });

    test('should return correct column for third column', () => {
      const thirdColumn = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
      thirdColumn.forEach(number => {
        expect(processor.getColumn(number)).toBe(3);
      });
    });
  });

  describe('calculatePayout', () => {
    test('should calculate straight bet payout correctly', () => {
      const result = processor.calculatePayout('straight', 17, 17, 100);

      expect(result.isWin).toBe(true);
      expect(result.payout).toBe(3600); // 100 * (35 + 1)
      expect(result.profit).toBe(3500); // 3600 - 100
      expect(result.multiplier).toBe(36);
    });

    test('should calculate losing straight bet correctly', () => {
      const result = processor.calculatePayout('straight', 17, 18, 100);

      expect(result.isWin).toBe(false);
      expect(result.payout).toBe(0);
      expect(result.profit).toBe(-100);
      expect(result.multiplier).toBe(0);
    });

    test('should calculate red bet payout correctly', () => {
      const result = processor.calculatePayout('red', null, 1, 100); // 1 is red

      expect(result.isWin).toBe(true);
      expect(result.payout).toBe(200); // 100 * (1 + 1)
      expect(result.profit).toBe(100); // 200 - 100
      expect(result.multiplier).toBe(2);
    });

    test('should calculate losing red bet correctly', () => {
      const result = processor.calculatePayout('red', null, 2, 100); // 2 is black

      expect(result.isWin).toBe(false);
      expect(result.payout).toBe(0);
      expect(result.profit).toBe(-100);
      expect(result.multiplier).toBe(0);
    });

    test('should calculate dozen bet payout correctly', () => {
      const result = processor.calculatePayout('dozen', 1, 5, 100); // 5 is in first dozen

      expect(result.isWin).toBe(true);
      expect(result.payout).toBe(300); // 100 * (2 + 1)
      expect(result.profit).toBe(200); // 300 - 100
      expect(result.multiplier).toBe(3);
    });

    test('should handle zero for even/odd bets', () => {
      const evenResult = processor.calculatePayout('even', null, 0, 100);
      const oddResult = processor.calculatePayout('odd', null, 0, 100);

      expect(evenResult.isWin).toBe(false);
      expect(oddResult.isWin).toBe(false);
      expect(evenResult.payout).toBe(0);
      expect(oddResult.payout).toBe(0);
    });

    test('should throw error for unknown bet type', () => {
      expect(() => {
        processor.calculatePayout('unknown', null, 17, 100);
      }).toThrow('Unknown bet type');
    });
  });

  describe('validateRouletteNumber', () => {
    test('should validate correct roulette number', () => {
      const vrfValue = '12345678901234567890123456789012345678901234567890123456789012345678901234567890';
      
      const result = processor.processVRF(vrfValue, {});
      const isValid = processor.validateRouletteNumber(vrfValue, result.number);

      expect(isValid).toBe(true);
    });

    test('should reject incorrect roulette number', () => {
      const vrfValue = '98765432109876543210987654321098765432109876543210987654321098765432109876543210';
      const fakeNumber = 99; // Invalid number

      const isValid = processor.validateRouletteNumber(vrfValue, fakeNumber);

      expect(isValid).toBe(false);
    });
  });

  describe('getWheelLayout', () => {
    test('should return correct wheel layout', () => {
      const layout = processor.getWheelLayout();

      expect(layout).toHaveLength(37);
      expect(layout[0]).toBe(0); // First position is 0
      expect(new Set(layout).size).toBe(37); // All numbers unique
      
      // Check all numbers 0-36 are present
      for (let i = 0; i <= 36; i++) {
        expect(layout).toContain(i);
      }
    });
  });

  describe('getNeighbors', () => {
    test('should return correct neighbors for zero', () => {
      const neighbors = processor.getNeighbors(0, 2);

      expect(neighbors).toHaveLength(5); // 2 on each side + center
      expect(neighbors).toContain(0); // Center number
    });

    test('should return correct neighbors for regular number', () => {
      const neighbors = processor.getNeighbors(17, 1);

      expect(neighbors).toHaveLength(3); // 1 on each side + center
      expect(neighbors).toContain(17); // Center number
    });

    test('should throw error for invalid number', () => {
      expect(() => {
        processor.getNeighbors(37, 2);
      }).toThrow('Number 37 not found on wheel');
    });
  });

  describe('simulateMultipleBets', () => {
    test('should handle multiple bets correctly', () => {
      const gameResult = { number: 17 };
      const bets = [
        { betType: 'straight', betValue: 17, betAmount: 100 },
        { betType: 'red', betValue: null, betAmount: 50 },
        { betType: 'odd', betValue: null, betAmount: 25 }
      ];

      const result = processor.simulateMultipleBets(gameResult, bets);

      expect(result.totalBets).toBe(3);
      expect(result.totalBetAmount).toBe(175);
      expect(result.results).toHaveLength(3);
      expect(result.overallWin).toBe(true); // 17 is red and odd
    });

    test('should handle bet errors gracefully', () => {
      const gameResult = { number: 17 };
      const bets = [
        { betType: 'invalid', betValue: 17, betAmount: 100 }
      ];

      const result = processor.simulateMultipleBets(gameResult, bets);

      expect(result.results[0].error).toBeDefined();
      expect(result.results[0].error).toContain('Unknown bet type');
    });
  });

  describe('getGameStats', () => {
    test('should return correct game statistics', () => {
      const stats = processor.getGameStats();

      expect(stats.totalNumbers).toBe(37);
      expect(stats.redNumbers).toBe(18);
      expect(stats.blackNumbers).toBe(18);
      expect(stats.greenNumbers).toBe(1);
      expect(stats.houseEdge).toBe('2.70%');
      expect(stats.maxPayout).toBe(35);
      expect(stats.wheelType).toBe('european');
    });
  });

  describe('getHotColdAnalysis', () => {
    test('should analyze hot and cold numbers', () => {
      const recentNumbers = Array.from({ length: 200 }, (_, i) => i % 37);
      
      const analysis = processor.getHotColdAnalysis(recentNumbers, 100);

      expect(analysis.totalSpins).toBe(200);
      expect(analysis.hotNumbers).toHaveLength(10);
      expect(analysis.coldNumbers).toHaveLength(10);
      expect(analysis.analysis.mostFrequent).toBeDefined();
      expect(analysis.analysis.leastFrequent).toBeDefined();
    });

    test('should return error for insufficient data', () => {
      const recentNumbers = [1, 2, 3]; // Too few numbers
      
      const analysis = processor.getHotColdAnalysis(recentNumbers, 100);

      expect(analysis.error).toBeDefined();
      expect(analysis.provided).toBe(3);
    });
  });

  describe('generateBettingSuggestions', () => {
    test('should generate betting suggestions', () => {
      const gameResult = {
        number: 17,
        properties: {
          color: 'black',
          dozen: 2,
          isEven: false,
          isOdd: true,
          isZero: false
        }
      };

      const suggestions = processor.generateBettingSuggestions(gameResult);

      expect(suggestions.straightUp.numbers).toEqual([17]);
      expect(suggestions.color.color).toBe('black');
      expect(suggestions.dozen.dozen).toBe(2);
      expect(suggestions.evenOdd.type).toBe('odd');
      expect(suggestions.neighbors.numbers).toBeDefined();
    });
  });

  describe('validateGameConfig', () => {
    test('should validate empty game config', () => {
      const gameConfig = {};
      const validation = processor.validateGameConfig(gameConfig);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject null game config', () => {
      const validation = processor.validateGameConfig(null);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Game configuration is required');
    });
  });

  describe('getSupportedBetTypes', () => {
    test('should return array of supported bet types', () => {
      const betTypes = processor.getSupportedBetTypes();

      expect(betTypes).toContain('straight');
      expect(betTypes).toContain('red');
      expect(betTypes).toContain('black');
      expect(betTypes).toContain('even');
      expect(betTypes).toContain('odd');
      expect(betTypes).toContain('dozen');
      expect(betTypes).toContain('column');
    });
  });

  describe('generateTestScenarios', () => {
    test('should generate test scenarios', () => {
      const scenarios = processor.generateTestScenarios();

      expect(scenarios.length).toBeGreaterThan(0);
      
      scenarios.forEach(scenario => {
        expect(scenario.name).toBeDefined();
        expect(scenario.vrfValue).toBeDefined();
        expect(scenario.expectedNumber).toBeDefined();
        expect(scenario.expectedColor).toBeDefined();
      });
    });
  });

  describe('getOrdinalSuffix', () => {
    test('should return correct ordinal suffixes', () => {
      expect(processor.getOrdinalSuffix(1)).toBe('st');
      expect(processor.getOrdinalSuffix(2)).toBe('nd');
      expect(processor.getOrdinalSuffix(3)).toBe('rd');
      expect(processor.getOrdinalSuffix(4)).toBe('th');
      expect(processor.getOrdinalSuffix(11)).toBe('th');
      expect(processor.getOrdinalSuffix(21)).toBe('st');
      expect(processor.getOrdinalSuffix(22)).toBe('nd');
      expect(processor.getOrdinalSuffix(23)).toBe('rd');
    });
  });
});