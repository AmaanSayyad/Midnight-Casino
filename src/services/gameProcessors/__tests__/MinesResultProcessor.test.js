import MinesResultProcessor from '../MinesResultProcessor.js';

describe('MinesResultProcessor', () => {
  let processor;

  beforeEach(() => {
    processor = new MinesResultProcessor();
  });

  describe('processVRF', () => {
    test('should generate correct number of mine positions', () => {
      const vrfValue = '12345678901234567890123456789012345678901234567890123456789012345678901234567890';
      const gameConfig = { mineCount: 5 };

      const result = processor.processVRF(vrfValue, gameConfig);

      expect(result.minePositions).toHaveLength(5);
      expect(result.mineCount).toBe(5);
      expect(result.gameType).toBe('MINES');
    });

    test('should generate unique mine positions', () => {
      const vrfValue = BigInt('98765432109876543210987654321098765432109876543210987654321098765432109876543210');
      const gameConfig = { mineCount: 10 };

      const result = processor.processVRF(vrfValue, gameConfig);

      const uniquePositions = new Set(result.minePositions);
      expect(uniquePositions.size).toBe(10);
    });

    test('should generate positions within valid range', () => {
      const vrfValue = '11111111111111111111111111111111111111111111111111111111111111111111111111111111';
      const gameConfig = { mineCount: 15 };

      const result = processor.processVRF(vrfValue, gameConfig);

      result.minePositions.forEach(position => {
        expect(position).toBeGreaterThanOrEqual(0);
        expect(position).toBeLessThan(25);
      });
    });

    test('should throw error for invalid mine count', () => {
      const vrfValue = '12345';
      const gameConfig = { mineCount: 25 }; // Invalid - max is 24

      expect(() => {
        processor.processVRF(vrfValue, gameConfig);
      }).toThrow('Invalid mine count');
    });

    test('should generate consistent results for same VRF value', () => {
      const vrfValue = '55555555555555555555555555555555555555555555555555555555555555555555555555555555';
      const gameConfig = { mineCount: 8 };

      const result1 = processor.processVRF(vrfValue, gameConfig);
      const result2 = processor.processVRF(vrfValue, gameConfig);

      expect(result1.minePositions).toEqual(result2.minePositions);
    });

    test('should include safe positions', () => {
      const vrfValue = '77777777777777777777777777777777777777777777777777777777777777777777777777777777';
      const gameConfig = { mineCount: 3 };

      const result = processor.processVRF(vrfValue, gameConfig);

      expect(result.safePositions).toHaveLength(22); // 25 - 3 = 22
      
      // Check that mine positions and safe positions don't overlap
      const mineSet = new Set(result.minePositions);
      result.safePositions.forEach(position => {
        expect(mineSet.has(position)).toBe(false);
      });
    });

    test('should include multipliers array', () => {
      const vrfValue = '99999999999999999999999999999999999999999999999999999999999999999999999999999999';
      const gameConfig = { mineCount: 6 };

      const result = processor.processVRF(vrfValue, gameConfig);

      expect(result.multipliers).toHaveLength(19); // 25 - 6 = 19 safe positions
      expect(result.multipliers[0]).toBeGreaterThan(1); // First multiplier should be > 1
    });
  });

  describe('generateMinePositions', () => {
    test('should use Fisher-Yates shuffle algorithm correctly', () => {
      const vrfValue = BigInt('123456789012345678901234567890');
      const mineCount = 5;

      const positions = processor.generateMinePositions(vrfValue, mineCount);

      expect(positions).toHaveLength(mineCount);
      expect(new Set(positions).size).toBe(mineCount); // All unique
    });

    test('should handle edge case with maximum mines', () => {
      const vrfValue = BigInt('999999999999999999999999999999999999999999999999999999999999999999999999999999');
      const mineCount = 24;

      const positions = processor.generateMinePositions(vrfValue, mineCount);

      expect(positions).toHaveLength(24);
      expect(new Set(positions).size).toBe(24);
    });

    test('should handle single mine', () => {
      const vrfValue = BigInt('111111111111111111111111111111111111111111111111111111111111111111111111111111');
      const mineCount = 1;

      const positions = processor.generateMinePositions(vrfValue, mineCount);

      expect(positions).toHaveLength(1);
      expect(positions[0]).toBeGreaterThanOrEqual(0);
      expect(positions[0]).toBeLessThan(25);
    });
  });

  describe('validateMinePositions', () => {
    test('should validate correct mine positions', () => {
      const vrfValue = '12345678901234567890123456789012345678901234567890123456789012345678901234567890';
      const mineCount = 7;
      
      const result = processor.processVRF(vrfValue, { mineCount });
      const isValid = processor.validateMinePositions(vrfValue, result.minePositions, mineCount);

      expect(isValid).toBe(true);
    });

    test('should reject incorrect mine positions', () => {
      const vrfValue = '98765432109876543210987654321098765432109876543210987654321098765432109876543210';
      const mineCount = 5;
      const fakeMinePositions = [0, 1, 2, 3, 4]; // Likely incorrect positions

      const isValid = processor.validateMinePositions(vrfValue, fakeMinePositions, mineCount);

      expect(isValid).toBe(false);
    });
  });

  describe('positionToCoordinates', () => {
    test('should convert position 0 to coordinates (0,0)', () => {
      const coords = processor.positionToCoordinates(0);
      expect(coords).toEqual({ row: 0, col: 0 });
    });

    test('should convert position 24 to coordinates (4,4)', () => {
      const coords = processor.positionToCoordinates(24);
      expect(coords).toEqual({ row: 4, col: 4 });
    });

    test('should convert position 12 to coordinates (2,2)', () => {
      const coords = processor.positionToCoordinates(12);
      expect(coords).toEqual({ row: 2, col: 2 });
    });

    test('should throw error for invalid position', () => {
      expect(() => {
        processor.positionToCoordinates(25);
      }).toThrow('Invalid position');

      expect(() => {
        processor.positionToCoordinates(-1);
      }).toThrow('Invalid position');
    });
  });

  describe('coordinatesToPosition', () => {
    test('should convert coordinates (0,0) to position 0', () => {
      const position = processor.coordinatesToPosition(0, 0);
      expect(position).toBe(0);
    });

    test('should convert coordinates (4,4) to position 24', () => {
      const position = processor.coordinatesToPosition(4, 4);
      expect(position).toBe(24);
    });

    test('should convert coordinates (2,2) to position 12', () => {
      const position = processor.coordinatesToPosition(2, 2);
      expect(position).toBe(12);
    });

    test('should throw error for invalid coordinates', () => {
      expect(() => {
        processor.coordinatesToPosition(5, 0);
      }).toThrow('Invalid coordinates');

      expect(() => {
        processor.coordinatesToPosition(0, -1);
      }).toThrow('Invalid coordinates');
    });
  });

  describe('calculateMultipliers', () => {
    test('should calculate multipliers for low mine count', () => {
      const multipliers = processor.calculateMultipliers(3);
      
      expect(multipliers).toHaveLength(22); // 25 - 3 = 22 safe positions
      expect(multipliers[0]).toBeGreaterThan(1);
      expect(multipliers[multipliers.length - 1]).toBeGreaterThan(multipliers[0]); // Should increase
    });

    test('should calculate multipliers for high mine count', () => {
      const multipliers = processor.calculateMultipliers(20);
      
      expect(multipliers).toHaveLength(5); // 25 - 20 = 5 safe positions
      expect(multipliers[0]).toBeGreaterThan(1);
      expect(multipliers[multipliers.length - 1]).toBeGreaterThan(10); // High risk, high reward
    });
  });

  describe('simulateGameRound', () => {
    test('should handle safe tile reveals', () => {
      const vrfValue = '12345678901234567890123456789012345678901234567890123456789012345678901234567890';
      const gameConfig = { mineCount: 5 };
      const gameResult = processor.processVRF(vrfValue, gameConfig);
      
      // Find a safe position
      const safePosition = gameResult.safePositions[0];
      const revealedPositions = [safePosition];

      const roundResult = processor.simulateGameRound(gameResult, revealedPositions);

      expect(roundResult.isGameOver).toBe(false);
      expect(roundResult.hitMine).toBe(false);
      expect(roundResult.safeRevealed).toBe(1);
      expect(roundResult.canCashout).toBe(true);
      expect(roundResult.currentMultiplier).toBeGreaterThan(1);
    });

    test('should handle mine hit', () => {
      const vrfValue = '98765432109876543210987654321098765432109876543210987654321098765432109876543210';
      const gameConfig = { mineCount: 5 };
      const gameResult = processor.processVRF(vrfValue, gameConfig);
      
      // Reveal a mine position
      const minePosition = gameResult.minePositions[0];
      const revealedPositions = [minePosition];

      const roundResult = processor.simulateGameRound(gameResult, revealedPositions);

      expect(roundResult.isGameOver).toBe(true);
      expect(roundResult.hitMine).toBe(true);
      expect(roundResult.safeRevealed).toBe(0);
      expect(roundResult.canCashout).toBe(false);
      expect(roundResult.currentMultiplier).toBe(0);
    });

    test('should handle multiple safe reveals', () => {
      const vrfValue = '55555555555555555555555555555555555555555555555555555555555555555555555555555555';
      const gameConfig = { mineCount: 3 };
      const gameResult = processor.processVRF(vrfValue, gameConfig);
      
      // Reveal multiple safe positions
      const safePositions = gameResult.safePositions.slice(0, 3);

      const roundResult = processor.simulateGameRound(gameResult, safePositions);

      expect(roundResult.isGameOver).toBe(false);
      expect(roundResult.hitMine).toBe(false);
      expect(roundResult.safeRevealed).toBe(3);
      expect(roundResult.canCashout).toBe(true);
    });
  });

  describe('getGameStats', () => {
    test('should return correct stats for low risk game', () => {
      const stats = processor.getGameStats(3);

      expect(stats.mineCount).toBe(3);
      expect(stats.safeCount).toBe(22);
      expect(stats.riskLevel).toBe('low');
      expect(stats.winProbability).toBe('88.00%'); // 22/25 * 100
    });

    test('should return correct stats for high risk game', () => {
      const stats = processor.getGameStats(20);

      expect(stats.mineCount).toBe(20);
      expect(stats.safeCount).toBe(5);
      expect(stats.riskLevel).toBe('high');
      expect(stats.winProbability).toBe('20.00%'); // 5/25 * 100
    });
  });

  describe('validateGameConfig', () => {
    test('should validate correct game config', () => {
      const gameConfig = { mineCount: 10 };
      const validation = processor.validateGameConfig(gameConfig);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject missing mine count', () => {
      const gameConfig = {};
      const validation = processor.validateGameConfig(gameConfig);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Mine count is required');
    });

    test('should reject invalid mine count', () => {
      const gameConfig = { mineCount: 25 };
      const validation = processor.validateGameConfig(gameConfig);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Mine count must be between 1 and 24');
    });

    test('should reject non-numeric mine count', () => {
      const gameConfig = { mineCount: '5' };
      const validation = processor.validateGameConfig(gameConfig);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Mine count must be a number');
    });
  });

  describe('getSupportedMineCounts', () => {
    test('should return array of supported mine counts', () => {
      const supportedCounts = processor.getSupportedMineCounts();

      expect(supportedCounts).toHaveLength(24);
      expect(supportedCounts[0]).toBe(1);
      expect(supportedCounts[23]).toBe(24);
    });
  });
});