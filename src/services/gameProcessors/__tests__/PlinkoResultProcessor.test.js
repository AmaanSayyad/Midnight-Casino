import PlinkoResultProcessor from '../PlinkoResultProcessor.js';

describe('PlinkoResultProcessor', () => {
  let processor;

  beforeEach(() => {
    processor = new PlinkoResultProcessor();
  });

  describe('processVRF', () => {
    test('should generate ball path with correct length', () => {
      const vrfValue = '12345678901234567890123456789012345678901234567890123456789012345678901234567890';
      const gameConfig = { rows: 12 };

      const result = processor.processVRF(vrfValue, gameConfig);

      expect(result.ballPath).toHaveLength(12);
      expect(result.rows).toBe(12);
      expect(result.gameType).toBe('PLINKO');
    });

    test('should generate valid final position', () => {
      const vrfValue = BigInt('98765432109876543210987654321098765432109876543210987654321098765432109876543210');
      const gameConfig = { rows: 10 };

      const result = processor.processVRF(vrfValue, gameConfig);

      expect(result.finalPosition).toBeGreaterThanOrEqual(0);
      expect(result.finalPosition).toBeLessThanOrEqual(10);
    });

    test('should include payout multiplier', () => {
      const vrfValue = '55555555555555555555555555555555555555555555555555555555555555555555555555555555';
      const gameConfig = { rows: 8 };

      const result = processor.processVRF(vrfValue, gameConfig);

      expect(result.payoutMultiplier).toBeGreaterThanOrEqual(0);
      expect(typeof result.payoutMultiplier).toBe('number');
    });

    test('should throw error for invalid row count', () => {
      const vrfValue = '12345';
      const gameConfig = { rows: 7 }; // Invalid - not in supported rows

      expect(() => {
        processor.processVRF(vrfValue, gameConfig);
      }).toThrow('Invalid row count');
    });

    test('should generate consistent results for same VRF value', () => {
      const vrfValue = '77777777777777777777777777777777777777777777777777777777777777777777777777777777';
      const gameConfig = { rows: 14 };

      const result1 = processor.processVRF(vrfValue, gameConfig);
      const result2 = processor.processVRF(vrfValue, gameConfig);

      expect(result1.ballPath).toEqual(result2.ballPath);
      expect(result1.finalPosition).toBe(result2.finalPosition);
    });

    test('should include path visualization', () => {
      const vrfValue = '33333333333333333333333333333333333333333333333333333333333333333333333333333333';
      const gameConfig = { rows: 8 };

      const result = processor.processVRF(vrfValue, gameConfig);

      expect(result.pathVisualization).toBeDefined();
      expect(typeof result.pathVisualization).toBe('string');
      expect(result.pathVisualization).toContain('●');
    });

    test('should include metadata', () => {
      const vrfValue = '11111111111111111111111111111111111111111111111111111111111111111111111111111111';
      const gameConfig = { rows: 16 };

      const result = processor.processVRF(vrfValue, gameConfig);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.algorithm).toBe('controlled-randomness');
      expect(result.metadata.totalPossibleOutcomes).toBe(17); // rows + 1
      expect(result.metadata.pathLength).toBe(16);
    });
  });

  describe('generateBallPath', () => {
    test('should generate path with only 0s and 1s', () => {
      const vrfValue = BigInt('123456789012345678901234567890');
      const rows = 12;

      const path = processor.generateBallPath(vrfValue, rows);

      expect(path).toHaveLength(rows);
      path.forEach(move => {
        expect([0, 1]).toContain(move);
      });
    });

    test('should apply center bias to prevent extreme outcomes', () => {
      const vrfValue = BigInt('999999999999999999999999999999999999999999999999999999999999999999999999999999');
      const rows = 16;

      const path = processor.generateBallPath(vrfValue, rows);
      const rightMoves = path.filter(move => move === 1).length;
      const leftMoves = path.filter(move => move === 0).length;

      // With center bias, we shouldn't get all moves in one direction
      expect(rightMoves).toBeLessThan(rows);
      expect(leftMoves).toBeLessThan(rows);
    });

    test('should handle different row counts', () => {
      const vrfValue = BigInt('555555555555555555555555555555555555555555555555555555555555555555555555555555');
      
      processor.getSupportedRows().forEach(rows => {
        const path = processor.generateBallPath(vrfValue, rows);
        expect(path).toHaveLength(rows);
      });
    });
  });

  describe('calculateFinalPosition', () => {
    test('should calculate correct final position', () => {
      const path = [0, 1, 1, 0, 1]; // 3 right moves
      const finalPosition = processor.calculateFinalPosition(path);
      expect(finalPosition).toBe(3);
    });

    test('should handle all left moves', () => {
      const path = [0, 0, 0, 0, 0]; // 0 right moves
      const finalPosition = processor.calculateFinalPosition(path);
      expect(finalPosition).toBe(0);
    });

    test('should handle all right moves', () => {
      const path = [1, 1, 1, 1, 1]; // 5 right moves
      const finalPosition = processor.calculateFinalPosition(path);
      expect(finalPosition).toBe(5);
    });
  });

  describe('getMultipliers', () => {
    test('should return correct multipliers for 8 rows', () => {
      const multipliers = processor.getMultipliers(8);
      
      expect(multipliers).toHaveLength(9); // rows + 1
      expect(multipliers[0]).toBe(5.6); // Edge multiplier
      expect(multipliers[4]).toBe(0.5); // Center multiplier (lowest)
      expect(multipliers[8]).toBe(5.6); // Edge multiplier
    });

    test('should return correct multipliers for 16 rows', () => {
      const multipliers = processor.getMultipliers(16);
      
      expect(multipliers).toHaveLength(17); // rows + 1
      expect(multipliers[0]).toBe(16.0); // Edge multiplier
      expect(multipliers[8]).toBe(0.2); // Center multiplier (lowest)
    });

    test('should return symmetric multipliers', () => {
      processor.getSupportedRows().forEach(rows => {
        const multipliers = processor.getMultipliers(rows);
        const mid = Math.floor(multipliers.length / 2);
        
        // Check symmetry (allowing for small floating point differences)
        for (let i = 0; i < mid; i++) {
          const left = multipliers[i];
          const right = multipliers[multipliers.length - 1 - i];
          expect(Math.abs(left - right)).toBeLessThan(0.01);
        }
      });
    });
  });

  describe('validateBallPath', () => {
    test('should validate correct ball path', () => {
      const vrfValue = '12345678901234567890123456789012345678901234567890123456789012345678901234567890';
      const rows = 10;
      
      const result = processor.processVRF(vrfValue, { rows });
      const isValid = processor.validateBallPath(vrfValue, result.ballPath, rows);

      expect(isValid).toBe(true);
    });

    test('should reject incorrect ball path', () => {
      const vrfValue = '98765432109876543210987654321098765432109876543210987654321098765432109876543210';
      const rows = 8;
      const fakePath = [0, 0, 0, 0, 0, 0, 0, 0]; // Likely incorrect path

      const isValid = processor.validateBallPath(vrfValue, fakePath, rows);

      expect(isValid).toBe(false);
    });
  });

  describe('calculateCenterBias', () => {
    test('should increase bias as ball progresses down', () => {
      const totalRows = 12;
      
      const earlyBias = processor.calculateCenterBias(2, totalRows);
      const lateBias = processor.calculateCenterBias(10, totalRows);

      expect(lateBias).toBeGreaterThan(earlyBias);
    });

    test('should cap bias at maximum value', () => {
      const bias = processor.calculateCenterBias(15, 16);
      expect(bias).toBeLessThanOrEqual(0.3);
    });
  });

  describe('applyBias', () => {
    test('should move extreme values towards center', () => {
      const extremeValue = 100; // Far from center (500)
      const bias = 0.2;
      
      const biasedValue = processor.applyBias(extremeValue, bias);
      
      expect(biasedValue).toBeGreaterThan(extremeValue);
      expect(biasedValue).toBeLessThan(500);
    });

    test('should move other extreme values towards center', () => {
      const extremeValue = 900; // Far from center (500)
      const bias = 0.2;
      
      const biasedValue = processor.applyBias(extremeValue, bias);
      
      expect(biasedValue).toBeLessThan(extremeValue);
      expect(biasedValue).toBeGreaterThan(500);
    });

    test('should not change center values much', () => {
      const centerValue = 500;
      const bias = 0.2;
      
      const biasedValue = processor.applyBias(centerValue, bias);
      
      expect(Math.abs(biasedValue - centerValue)).toBeLessThan(10);
    });
  });

  describe('calculateProbabilityDistribution', () => {
    test('should calculate correct probabilities for 8 rows', () => {
      const distribution = processor.calculateProbabilityDistribution(8);
      
      expect(Object.keys(distribution)).toHaveLength(9); // 0 to 8
      
      // Center position should have highest probability
      const centerPos = 4;
      const centerProb = distribution[centerPos].probability;
      const edgeProb = distribution[0].probability;
      
      expect(centerProb).toBeGreaterThan(edgeProb);
    });

    test('should have probabilities sum to 1', () => {
      const distribution = processor.calculateProbabilityDistribution(10);
      
      const totalProbability = Object.values(distribution)
        .reduce((sum, item) => sum + item.probability, 0);
      
      expect(Math.abs(totalProbability - 1)).toBeLessThan(0.0001);
    });
  });

  describe('binomialCoefficient', () => {
    test('should calculate correct binomial coefficients', () => {
      expect(processor.binomialCoefficient(8, 0)).toBe(1);
      expect(processor.binomialCoefficient(8, 4)).toBe(70);
      expect(processor.binomialCoefficient(8, 8)).toBe(1);
      expect(processor.binomialCoefficient(10, 5)).toBe(252);
    });

    test('should handle edge cases', () => {
      expect(processor.binomialCoefficient(5, 6)).toBe(0); // k > n
      expect(processor.binomialCoefficient(0, 0)).toBe(1);
    });
  });

  describe('simulateGameRound', () => {
    test('should calculate correct payout', () => {
      const gameResult = {
        finalPosition: 0,
        payoutMultiplier: 5.6,
        rows: 8
      };
      const betAmount = 100;

      const roundResult = processor.simulateGameRound(gameResult, betAmount);

      expect(roundResult.betAmount).toBe(100);
      expect(roundResult.payout).toBe(560); // 100 * 5.6
      expect(roundResult.profit).toBe(460); // 560 - 100
      expect(roundResult.isWin).toBe(true);
    });

    test('should handle losing outcome', () => {
      const gameResult = {
        finalPosition: 4,
        payoutMultiplier: 0.5,
        rows: 8
      };
      const betAmount = 100;

      const roundResult = processor.simulateGameRound(gameResult, betAmount);

      expect(roundResult.payout).toBe(50); // 100 * 0.5
      expect(roundResult.profit).toBe(-50); // 50 - 100
      expect(roundResult.isWin).toBe(false);
    });
  });

  describe('calculateRiskLevel', () => {
    test('should return low risk for center positions', () => {
      const riskLevel = processor.calculateRiskLevel(10, 5); // Center position
      expect(riskLevel).toBe('low');
    });

    test('should return high risk for edge positions', () => {
      const riskLevel = processor.calculateRiskLevel(10, 0); // Edge position
      expect(riskLevel).toBe('high');
    });

    test('should return medium risk for intermediate positions', () => {
      const riskLevel = processor.calculateRiskLevel(10, 3); // Intermediate position
      expect(riskLevel).toBe('medium');
    });
  });

  describe('getGameStats', () => {
    test('should return correct stats for 8 rows', () => {
      const stats = processor.getGameStats(8);

      expect(stats.rows).toBe(8);
      expect(stats.totalPositions).toBe(9);
      expect(stats.maxMultiplier).toBe(5.6);
      expect(stats.minMultiplier).toBe(0.5);
      expect(parseFloat(stats.expectedValue)).toBeLessThan(1); // House edge
    });

    test('should calculate house edge correctly', () => {
      const stats = processor.getGameStats(12);
      
      const houseEdgePercent = parseFloat(stats.houseEdge);
      expect(houseEdgePercent).toBeGreaterThan(0);
      expect(houseEdgePercent).toBeLessThan(50); // Reasonable house edge
    });
  });

  describe('validateGameConfig', () => {
    test('should validate correct game config', () => {
      const gameConfig = { rows: 12 };
      const validation = processor.validateGameConfig(gameConfig);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject missing row count', () => {
      const gameConfig = {};
      const validation = processor.validateGameConfig(gameConfig);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Row count is required');
    });

    test('should reject invalid row count', () => {
      const gameConfig = { rows: 7 }; // Not in supported rows
      const validation = processor.validateGameConfig(gameConfig);

      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('Row count must be one of');
    });

    test('should reject non-numeric row count', () => {
      const gameConfig = { rows: '12' };
      const validation = processor.validateGameConfig(gameConfig);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Row count must be a number');
    });
  });

  describe('getSupportedRows', () => {
    test('should return array of supported row counts', () => {
      const supportedRows = processor.getSupportedRows();

      expect(supportedRows).toEqual([8, 10, 12, 14, 16]);
      expect(supportedRows).toHaveLength(5);
    });
  });

  describe('generatePathVisualization', () => {
    test('should generate ASCII visualization', () => {
      const path = [0, 1, 0, 1]; // Simple path
      const rows = 4;

      const visualization = processor.generatePathVisualization(path, rows);

      expect(visualization).toContain('●');
      expect(visualization).toContain('▼');
      expect(typeof visualization).toBe('string');
    });
  });

  describe('generateTestScenarios', () => {
    test('should generate test scenarios for all supported rows', () => {
      const scenarios = processor.generateTestScenarios();

      expect(scenarios.length).toBe(15); // 5 rows * 3 scenarios each
      
      scenarios.forEach(scenario => {
        expect(scenario.name).toBeDefined();
        expect(scenario.vrfValue).toBeDefined();
        expect(scenario.gameConfig).toBeDefined();
        expect(scenario.expectedOutcome).toBeDefined();
      });
    });
  });
});